import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ToolCallInput, ToolCallResult } from 'claude-code'

import type { InFlightTask, NextAction } from '../../types'
import { ACTIVE_AGENT, describeTask, lastLine, ordered, parseBackgroundStart, parseNotifications, summary } from './inflight'
import { parseNextActions, SUGGEST_PROMPT } from './next-actions'
import { describe, parseStatus } from './parse'

const PANE = 'repo-status'
const TICK_MS = 10_000
const status = atom({ plugin: 'sk-skills', key: 'repoStatus' } as const, null)
const inFlight = atom({ plugin: 'sk-skills', key: 'inFlight' } as const, [] as InFlightTask[])
const inFlightNow = atom({ plugin: 'sk-skills', key: 'inFlightNow' } as const, 0)
const nextActions = atom({ plugin: 'sk-skills', key: 'nextActions' } as const, [] as NextAction[])

// Bumped on every prompt, so a suggestion that resolves after the person moved on is dropped.
let suggestionRound = 0

/** Asks a low-effort fork of the session for the likely next prompts and shows them as buttons. */
const suggest = async ($: EngineInterface) => {
  const round = suggestionRound
  const reply = await $.model.fork({ prompt: SUGGEST_PROMPT, effort: 'low' })
  if (round !== suggestionRound || !reply.isAnswered) return
  const actions = parseNextActions(reply.text)
  await update($, nextActions, () => actions)
}

const clearSuggestions = async ($: EngineInterface) => {
  suggestionRound++
  if ((await read($, nextActions)).length > 0) await update($, nextActions, () => [])
}

const runAction = async ($: EngineInterface, a: NextAction) => {
  await clearSuggestions($)
  await $.prompt.submit({ text: a.prompt })
}

const refresh = async ($: EngineInterface) => {
  const dirs = await $.process.run(['git', 'rev-parse', '--absolute-git-dir', '--git-common-dir'])
  if (dirs.exitCode !== 0) {
    await update($, status, () => null)
    return
  }
  const [gitDir = '', commonRaw = ''] = dirs.stdout.trim().split('\n')
  const common = await $.process.run(['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'])
  const commonDir = common.exitCode === 0 ? common.stdout.trim() : commonRaw
  const porcelain = await $.process.run(['git', 'status', '--porcelain=v1', '-b', '--untracked-files=normal'])
  if (porcelain.exitCode !== 0) return
  const next = parseStatus(porcelain.stdout, gitDir, commonDir)
  await update($, status, () => next)
}

const track = ($: EngineInterface, task: InFlightTask) =>
  update($, inFlight, tasks => [...tasks.filter(t => t.id !== task.id), task])

const untrack = ($: EngineInterface, ids: readonly string[]) =>
  ids.length === 0 ? Promise.resolve() : update($, inFlight, tasks => tasks.filter(t => !ids.includes(t.id)))

/**
 * Brings every in-flight row up to date: each shell's latest output line, the
 * agents still running, check-ins that have fired. A shell whose output file is
 * gone ended without a notification reaching us, so it drops.
 */
const tick = async ($: EngineInterface) => {
  const now = await $.clock.now()
  const agents = await $.agent.list().catch(() => [])
  const current = await read($, inFlight)
  const seen = new Map(current.map(t => [t.id, t]))
  const next: InFlightTask[] = []

  for (const t of current) {
    if (t.kind === 'agent') continue
    if (t.kind === 'wakeup') {
      if (t.startedAt > now - 60_000) next.push(t)
      continue
    }
    if (!t.outputFile) {
      next.push(t)
      continue
    }
    const out = await $.process.run(['tail', '-c', '4000', t.outputFile]).catch(() => null)
    if (out === null || out.exitCode !== 0) continue
    next.push({ ...t, lastLine: lastLine(out.stdout) ?? t.lastLine })
  }

  for (const a of agents) {
    if (!ACTIVE_AGENT.has(a.status)) continue
    const before = seen.get(a.id)
    next.push({
      id: a.id,
      kind: 'agent',
      label: a.description || a.name || a.type,
      startedAt: before?.startedAt ?? now,
      outputFile: null,
      lastLine: null,
      status: a.status,
    })
  }

  await update($, inFlight, () => next)
  await update($, inFlightNow, () => now)
}

/** The pane is the mod's only view: opened at session start, reopened by `/repo-status`. */
const openPane = ($: EngineInterface) => $.ui.open({ id: PANE, title: 'Repo status' })

const endFromNotifications = async ($: EngineInterface, text: string) => {
  if (!text.includes('<task-notification>')) return
  await untrack($, parseNotifications(text).map(n => n.id))
}

/** Records the background work a main-loop tool call started or stopped. */
const noteToolCall = async ($: EngineInterface, e: ToolCallInput, result: ToolCallResult) => {
  if (e.agentId !== undefined || result.isError || typeof result.text !== 'string') return
  if (e.tool === 'Bash' || e.tool === 'Monitor') {
    const started = parseBackgroundStart(result.text)
    if (!started) return
    const label = (e.tool === 'Bash' ? e.description || e.command : e.description) || e.tool
    await track($, {
      id: started.id,
      kind: e.tool === 'Bash' ? 'shell' : 'monitor',
      label: label.length > 60 ? `${label.slice(0, 59)}…` : label,
      startedAt: await $.clock.now(),
      outputFile: started.outputFile,
      lastLine: null,
      status: null,
    })
    await tick($)
  } else if (e.tool === 'TaskStop') {
    await untrack($, [e.task_id, e.shell_id].filter((id): id is string => typeof id === 'string'))
  } else if (e.tool === 'Agent') {
    await tick($)
  } else if (e.tool === 'ScheduleWakeup') {
    await untrack($, ['wakeup'])
    const at = (result.result as { scheduledFor?: number } | undefined)?.scheduledFor
    if (!e.stop && typeof at === 'number') {
      await track($, { id: 'wakeup', kind: 'wakeup', label: e.reason || 'scheduled check-in', startedAt: at, outputFile: null, lastLine: null, status: null })
    }
  }
}

export const register: Register = on => {

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await $.command.register({ name: 'repo-status', description: 'Open the Repo status pane: branch, uncommitted state, running background work and suggested next prompts' })
    await refresh($).catch(() => undefined)
    await tick($).catch(() => undefined)
    $.clock.every(TICK_MS, () => tick($).catch(() => undefined))
    await openPane($).catch(() => undefined)
    return result
  })

  // A surface that attaches later (a phone) gets the pane too.
  on('session.attach', async ($, e, next) => {
    const result = await next(e)
    await refresh($).catch(() => undefined)
    await openPane($).catch(() => undefined)
    return result
  })

  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    await noteToolCall($, e, result).catch(() => undefined)
    return result
  })

  // A background task ended: its notification reaches the session as a prompt, idle or mid-turn.
  // Any other prompt means the person moved on: the old suggestions no longer apply.
  on('prompt.submit', async ($, e, next) => {
    if (e.text.includes('<task-notification>')) await endFromNotifications($, e.text).catch(() => undefined)
    else await clearSuggestions($).catch(() => undefined)
    return next(e)
  })

  on('session.receive', async ($, e, next) => {
    if (e.agentId === undefined) await endFromNotifications($, e.text).catch(() => undefined)
    return next(e)
  })

  // Reopens the pane; it prints nothing, so the status lives in one place only.
  on('command.run', { command: 'repo-status' }, async $ => {
    await refresh($).catch(() => undefined)
    await tick($).catch(() => undefined)
    await openPane($)
    return {}
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    await refresh($).catch(() => undefined)
    // Off the turn's own path: the fork runs on a timer so the prompt comes back at once.
    if (e.agentId === undefined && e.reason === 'answer' && !e.isAborted) {
      $.clock.after(0, () => suggest($).catch(() => undefined))
    }
    return result
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const s = await read($, status)
    const tasks = ordered(await read($, inFlight))
    const now = await read($, inFlightNow)
    const actions = await read($, nextActions)
    const { Box, Button, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {s === null ? (
          <Text dimColor>Not in a git repo.</Text>
        ) : (
          describe(s).map(part => <Text key={part}>{part}</Text>)
        )}
        <Text bold>{`In flight: ${summary(tasks)}`}</Text>
        {tasks.map(t => (
          <Text key={t.id} wrap="truncate-end">{`● ${describeTask(t, now)}`}</Text>
        ))}
        {actions.length > 0 && <Text bold>Next</Text>}
        {actions.map((a, i) => (
          <Button key={`next-${i}`} label={`${i + 1} ${a.label}`} hotkey={String(i + 1)} onPress={() => runAction($, a)} />
        ))}
      </Box>
    )
  })
}
