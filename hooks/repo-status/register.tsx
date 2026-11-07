import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ToolCallInput, ToolCallResult } from 'claude-code'

import type { CiStatus, FinishedTask, InFlightTask, NextAction, TaskFile, TaskFileCandidate, TasksUi } from '../../types'
import { ciDetail, ciReason, isDue, parseCi, STATE_WORD, unavailable } from './ci'
import { ACTIVE_AGENT, elapsed, lastLine, ordered, parseBackgroundStart, parseNotifications } from './inflight'
import { parseNextActions, SUGGEST_PROMPT } from './next-actions'
import { EXPORT_DIR, extensionFile, inboxFile, isExtensionLive, parseInbox, parseTitle, sessionFile } from './export'
import { parseStatus } from './parse'
import {
  counts,
  defaultCollapsed,
  insertTask,
  isTaskFile,
  nextOpen,
  parseTasks,
  replaceLineText,
  textOfLine,
  toggleLine,
} from './tasks'
import type { TaskGroup, TaskItem } from './tasks'

const PANE = 'repo-status'
const TICK_MS = 10_000
const FINISHED_KEEP_MS = 10 * 60_000
const NO_UI: TasksUi = { toggled: [], editing: null, conflict: null, isSource: false }

const status = atom({ plugin: 'sk-skills', key: 'repoStatus' } as const, null)
const inFlight = atom({ plugin: 'sk-skills', key: 'inFlight' } as const, [] as InFlightTask[])
const inFlightNow = atom({ plugin: 'sk-skills', key: 'inFlightNow' } as const, 0)
const finished = atom({ plugin: 'sk-skills', key: 'finished' } as const, [] as FinishedTask[])
const nextActions = atom({ plugin: 'sk-skills', key: 'nextActions' } as const, [] as NextAction[])
const ci = atom({ plugin: 'sk-skills', key: 'ci' } as const, null as CiStatus | null)
const taskCandidates = atom({ plugin: 'sk-skills', key: 'taskCandidates' } as const, [] as TaskFileCandidate[])
const taskFile = atom({ plugin: 'sk-skills', key: 'taskFile' } as const, null as TaskFile | null)
const tasksUi = atom({ plugin: 'sk-skills', key: 'tasksUi' } as const, NO_UI)

// ---------------------------------------------------------------- next actions

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

// ---------------------------------------------------------------- git + CI

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

// A pane started from an editor may not inherit the shell's PATH, so `gh` is
// also looked for where the usual installers put it.
const GH_PATHS = ['gh', '/opt/homebrew/bin/gh', '/usr/local/bin/gh', '/usr/bin/gh']
let ghPath: string | null = null

/**
 * `REPO_STATUS_GH_PROXY`, when set, is the proxy the CI lookup uses in place
 * of the session's own (`direct` or `none` for no proxy): for a network where
 * GitHub accepts some egress paths and not others (an org IP allow list, say).
 */
const ghEnv = async ($: EngineInterface): Promise<Record<string, string> | undefined> => {
  const raw = (await $.env.get('REPO_STATUS_GH_PROXY').catch(() => undefined))?.trim()
  if (!raw) return undefined
  // `direct` (or `none`) reaches GitHub with no proxy at all.
  const proxy = /^(direct|none)$/i.test(raw) ? '' : raw
  return { HTTPS_PROXY: proxy, https_proxy: proxy, HTTP_PROXY: proxy, http_proxy: proxy }
}

const gh = async ($: EngineInterface, args: readonly string[]): Promise<{ exitCode: number; stdout: string; reason: string }> => {
  const env = await ghEnv($)
  for (const bin of ghPath ? [ghPath] : GH_PATHS) {
    const ran = await $.process.run([bin, ...args], { timeoutMs: 20_000, ...(env ? { env } : {}) }).catch(() => null)
    if (ran === null || ran.exitCode === 127) continue
    ghPath = bin
    return { exitCode: ran.exitCode, stdout: ran.stdout, reason: ciReason(ran.stderr) }
  }
  return { exitCode: 127, stdout: '', reason: 'gh not found' }
}

let ciFetchedAt = 0
let ciBranch = ''

/**
 * The latest run for the current branch from the GitHub CLI: often while a run
 * moves, every two minutes once settled. No `gh`, no auth, or no GitHub remote
 * shows "CI unavailable" with the reason (gh missing, not signed in, no remote).
 */
const refreshCi = async ($: EngineInterface, now: number) => {
  const s = await read($, status)
  if (s === null || s.branch === 'detached') {
    if ((await read($, ci)) !== null) await update($, ci, () => null)
    return
  }
  const isNewBranch = s.branch !== ciBranch
  if (!isDue(await read($, ci), ciFetchedAt, now, isNewBranch)) return
  ciFetchedAt = now
  ciBranch = s.branch
  const fields = 'databaseId,status,conclusion,workflowName,createdAt,url'
  const list = await gh($, ['run', 'list', '--branch', s.branch, '--limit', '1', '--json', fields])
  if (list.exitCode !== 0) {
    await update($, ci, () => unavailable(list.reason))
    return
  }
  let next = parseCi(list.stdout, null)
  if (next.runId !== null && (next.state === 'running' || next.state === 'failed')) {
    const jobs = await gh($, ['run', 'view', String(next.runId), '--json', 'jobs'])
    if (jobs.exitCode === 0) next = parseCi(list.stdout, jobs.stdout)
  }
  await update($, ci, () => next)
}

// ---------------------------------------------------------------- in flight + finished

const track = ($: EngineInterface, task: InFlightTask) =>
  update($, inFlight, tasks => [...tasks.filter(t => t.id !== task.id), task])

const untrack = ($: EngineInterface, ids: readonly string[]) =>
  ids.length === 0 ? Promise.resolve() : update($, inFlight, tasks => tasks.filter(t => !ids.includes(t.id)))

const toFinished = (t: InFlightTask, status: string, now: number): FinishedTask => ({
  id: t.id,
  kind: t.kind,
  label: t.label,
  startedAt: t.startedAt,
  endedAt: now,
  status,
  lastLine: t.lastLine,
})

/** Moves ended tasks from in flight to finished, keeping their last output line. */
const finish = async ($: EngineInterface, ended: ReadonlyMap<string, string>) => {
  if (ended.size === 0) return
  const now = await $.clock.now()
  const current = await read($, inFlight)
  const done = current.filter(t => ended.has(t.id) && t.kind !== 'wakeup').map(t => toFinished(t, ended.get(t.id) ?? 'completed', now))
  await update($, inFlight, tasks => tasks.filter(t => !ended.has(t.id)))
  if (done.length > 0) await update($, finished, list => [...done, ...list.filter(f => !ended.has(f.id))].slice(0, 20))
}

const endFromNotifications = async ($: EngineInterface, text: string) => {
  if (!text.includes('<task-notification>')) return
  await finish($, new Map(parseNotifications(text).map(n => [n.id, n.status])))
}

/**
 * Brings the session's live state up to date: each shell's latest output line,
 * the agents still running (an agent that stopped moves to finished), fired
 * check-ins, finished tasks past their keep time, the task file, and CI.
 */
const tick = async ($: EngineInterface) => {
  const now = await $.clock.now()
  const agents = await $.agent.list().catch(() => [])
  const current = await read($, inFlight)
  const seen = new Map(current.map(t => [t.id, t]))
  const next: InFlightTask[] = []
  const ended: FinishedTask[] = []

  for (const t of current) {
    if (t.kind === 'agent') {
      const a = agents.find(x => x.id === t.id)
      if (!a || !ACTIVE_AGENT.has(a.status)) ended.push(toFinished(t, a?.status ?? 'completed', now))
      continue
    }
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
  await update($, finished, list => [...ended, ...list].filter(f => now - f.endedAt < FINISHED_KEEP_MS).slice(0, 20))
  await update($, inFlightNow, () => now)
  await reloadTaskFile($).catch(() => undefined)
  await refreshCi($, now).catch(() => undefined)
}

// ---------------------------------------------------------------- task file

const tidyPath = (path: string) => path.split('/').slice(-2).join('/')

/** Re-reads the task file when its mtime moved: VS Code, Claude or a press changed it. */
const reloadTaskFile = async ($: EngineInterface, force = false) => {
  const file = await read($, taskFile)
  if (file === null) return
  const stat = await $.fs.stat(file.path).catch(() => null)
  if (stat === null) {
    await update($, taskFile, () => null)
    return
  }
  if (!force && stat.mtimeMs === file.mtimeMs) return
  const text = await $.fs.read(file.path)
  await update($, taskFile, () => ({ path: file.path, mtimeMs: stat.mtimeMs, text }))
}

const loadTaskFile = async ($: EngineInterface, path: string) => {
  const [stat, text] = await Promise.all([$.fs.stat(path), $.fs.read(path)])
  await update($, taskFile, () => ({ path, mtimeMs: stat.mtimeMs, text }))
  await update($, tasksUi, () => NO_UI)
}

/**
 * The session's task file is picked, never configured: the latest markdown file
 * with `- [ ]` lines this session created, else the latest such file it edited.
 */
const noteTaskFile = async ($: EngineInterface, path: string, isCreated: boolean) => {
  const text = await $.fs.read(path).catch(() => '')
  if (!isTaskFile(path, text)) return
  const at = await $.clock.now()
  const list = await update($, taskCandidates, list => {
    const prior = list.find(c => c.path === path)
    return [...list.filter(c => c.path !== path), { path, isCreated: isCreated || prior?.isCreated === true, at }].slice(-20)
  })
  const created = list.filter(c => c.isCreated)
  const pick = (created.length > 0 ? created : list).reduce((a, b) => (b.at >= a.at ? b : a))
  const current = await read($, taskFile)
  if (current?.path !== pick.path) await loadTaskFile($, pick.path)
  else await reloadTaskFile($, true)
}

/** Applies one edit to the file as it is on disk now; `edit` returns null when the line moved. */
const editTaskFile = async ($: EngineInterface, edit: (text: string) => string | null): Promise<boolean> => {
  const file = await read($, taskFile)
  if (file === null) return false
  const text = await $.fs.read(file.path)
  const next = edit(text)
  if (next === null || next === text) {
    await reloadTaskFile($, true)
    return next !== null
  }
  await $.fs.write(file.path, next)
  await reloadTaskFile($, true)
  return true
}

/**
 * Opens the task file in the editor: `code -r` reuses the VS Code window the
 * session runs in; without the `code` CLI, the system opener takes it.
 */
const openInEditor = async ($: EngineInterface, path: string) => {
  for (const argv of [['code', '-r', path], ['open', path], ['xdg-open', path]]) {
    const ran = await $.process.run(argv, { timeoutMs: 10_000 }).catch(() => null)
    if (ran?.exitCode === 0) return
  }
}

const setUi = ($: EngineInterface, fn: (ui: TasksUi) => TasksUi) => update($, tasksUi, fn)

const toggleTask = ($: EngineInterface, item: TaskItem) => editTaskFile($, text => toggleLine(text, item.line, item.raw))

const saveEdit = async ($: EngineInterface, value: string) => {
  const ui = await read($, tasksUi)
  if (!ui.editing) return
  const { line, raw } = ui.editing
  const file = await read($, taskFile)
  if (file === null) return
  const text = await $.fs.read(file.path)
  const next = replaceLineText(text, line, raw, value)
  if (next === null) {
    const theirs = textOfLine(text, line) ?? '(line removed)'
    const nowRaw = text.split('\n')[line] ?? ''
    await setUi($, u => ({ ...u, conflict: { line, raw: nowRaw, mine: value, theirs } }))
    return
  }
  if (next !== text) await $.fs.write(file.path, next)
  await setUi($, u => ({ ...u, editing: null, conflict: null }))
  await reloadTaskFile($, true)
}

const keepMine = async ($: EngineInterface) => {
  const ui = await read($, tasksUi)
  if (!ui.conflict) return
  const { line, raw, mine } = ui.conflict
  await editTaskFile($, text => replaceLineText(text, line, raw, mine))
  await setUi($, u => ({ ...u, editing: null, conflict: null }))
}

const useTheirs = async ($: EngineInterface) => {
  await setUi($, u => ({ ...u, editing: null, conflict: null }))
  await reloadTaskFile($, true)
}

const addTask = ($: EngineInterface, groupKey: string, value: string) =>
  editTaskFile($, text => {
    const g = parseTasks(text).find(x => x.key === groupKey)
    const last = g?.items[g.items.length - 1]
    return last ? insertTask(text, last.line, last.indent, value) : null
  })

// ---------------------------------------------------------------- tool calls

/** Records the background work a main-loop tool call started or stopped, and task files any loop wrote. */
const noteToolCall = async ($: EngineInterface, e: ToolCallInput, result: ToolCallResult, isNewFile: boolean) => {
  if (result.isError || typeof result.text !== 'string') return
  const path = 'file_path' in e && typeof e.file_path === 'string' ? e.file_path : null
  if (path && /\.md$/i.test(path) && (['Write', 'Edit', 'MultiEdit'] as string[]).includes(e.tool)) {
    await noteTaskFile($, path, e.tool === 'Write' && isNewFile)
  }
  if (e.agentId !== undefined) return
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
    const ids = [e.task_id, e.shell_id].filter((id): id is string => typeof id === 'string')
    await finish($, new Map(ids.map(id => [id, 'stopped'])))
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

/** The pane: opened at session start unless an editor extension draws it, reopened by `/repo-status`. */
const openPane = ($: EngineInterface) => $.ui.open({ id: PANE, title: 'Repo status' })

// ---------------------------------------------------------------- export for an editor extension

const exp = { dir: '', id: '', cwd: '', transcript: '', title: null as string | null, titleAt: 0, last: '', writtenAt: 0, extensionLive: false, interactedAt: 0 }

const setupExport = async ($: EngineInterface) => {
  if (exp.dir) return
  exp.dir = EXPORT_DIR((await $.env.get('HOME')) ?? '')
  exp.id = await $.session.id()
  exp.cwd = await $.session.cwd()
  await $.process.run(['mkdir', '-p', exp.dir])
  const found = await $.process.run(['find', `${exp.dir.replace(/\/repo-status$/, '')}/projects`, '-maxdepth', '2', '-name', `${exp.id}.jsonl`])
  exp.transcript = found.stdout.split('\n')[0]?.trim() ?? ''
}

/** The tab title, re-read every 15s: it changes when Claude names the session or the person renames it. */
const refreshTitle = async ($: EngineInterface, now: number) => {
  if (!exp.transcript || now - exp.titleAt < 5_000) return
  exp.titleAt = now
  const hits = await $.process.run(['grep', '-a', '-E', '"type":"(custom-title|ai-title)"', exp.transcript])
  exp.title = parseTitle(hits.stdout) ?? exp.title
}

/**
 * Once a second: writes the session's state when it changed (and every 5s as a
 * heartbeat), submits any prompt the extension queued, and keeps the built-in
 * pane closed while an extension is drawing.
 */
const exportTick = async ($: EngineInterface) => {
  await setupExport($)
  const now = await $.clock.now()
  await refreshTitle($, now).catch(() => undefined)
  const [repo, run, file, tasks, done, actions] = await Promise.all([read($, status), read($, ci), read($, taskFile), read($, inFlight), read($, finished), read($, nextActions)])
  const state = { repo, ci: run, taskFile: file ? { path: file.path, mtimeMs: file.mtimeMs } : null, inFlight: tasks, finished: done, nextActions: actions }
  const body = JSON.stringify({ title: exp.title, interactedAt: exp.interactedAt, state })
  if (body !== exp.last || now - exp.writtenAt > 5_000) {
    exp.last = body
    exp.writtenAt = now
    await $.fs.write(sessionFile(exp.dir, exp.id), JSON.stringify({ sessionId: exp.id, cwd: exp.cwd, title: exp.title, interactedAt: exp.interactedAt, updatedAt: now, state }))
  }
  const inbox = inboxFile(exp.dir, exp.id)
  if (await $.fs.exists(inbox)) {
    const text = await $.fs.read(inbox)
    await $.process.run(['rm', '-f', inbox])
    for (const prompt of parseInbox(text)) {
      // A press in the extension's pane is the person acting on this session too.
      exp.interactedAt = now
      await clearSuggestions($)
      await $.prompt.submit({ text: prompt })
    }
  }
  const heartbeat = await $.fs.read(extensionFile(exp.dir)).catch(() => null)
  const live = isExtensionLive(heartbeat, now)
  if (live && !exp.extensionLive) await $.ui.close({ id: PANE }).catch(() => undefined)
  exp.extensionLive = live
}

// ---------------------------------------------------------------- view helpers

const RUN_GLYPH: Record<InFlightTask['kind'], string> = { shell: '◐', monitor: '◐', agent: '◐', wakeup: '◷' }
const CI_LOOK: Record<CiStatus['state'], { glyph: string; color: string }> = {
  passed: { glyph: '✓', color: 'success' },
  failed: { glyph: '✗', color: 'error' },
  running: { glyph: '◐', color: 'claude' },
  queued: { glyph: '◌', color: 'warning' },
  none: { glyph: '–', color: 'inactive' },
  unavailable: { glyph: '–', color: 'inactive' },
  other: { glyph: '•', color: 'inactive' },
}
const isGood = (s: string) => s === 'completed' || s === 'success'

/** `code` spans of a task's text, so they draw in mono like the editor shows them. */
const spans = (text: string) => text.split(/(`[^`]+`)/).filter(Boolean).map(p => (p.startsWith('`') && p.endsWith('`') ? { code: true, text: p.slice(1, -1) } : { code: false, text: p }))

// ---------------------------------------------------------------- hooks

export const register: Register = on => {

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await $.command.register({ name: 'repo-status', description: 'Open the Repo status pane: branch and CI, the session task list, running work and suggested next prompts' })
    await refresh($).catch(() => undefined)
    await tick($).catch(() => undefined)
    $.clock.every(TICK_MS, () => tick($).catch(() => undefined))
    await exportTick($).catch(() => undefined)
    $.clock.every(1_000, () => exportTick($).catch(() => undefined))
    if (!exp.extensionLive) await openPane($).catch(() => undefined)
    return result
  })

  // A surface that attaches later (a phone) gets the pane too.
  on('session.attach', async ($, e, next) => {
    const result = await next(e)
    await refresh($).catch(() => undefined)
    if (!exp.extensionLive) await openPane($).catch(() => undefined)
    return result
  })

  on('tool.call', async ($, e, next) => {
    const path = e.tool === 'Write' && typeof e.file_path === 'string' ? e.file_path : null
    const isNewFile = path !== null && /\.md$/i.test(path) ? !(await $.fs.exists(path).catch(() => true)) : false
    const result = await next(e)
    await noteToolCall($, e, result, isNewFile).catch(() => undefined)
    return result
  })

  // Typing in this session's prompt box: the clearest sign the person is looking at this session.
  on('prompt.change', async ($, e, next) => {
    exp.interactedAt = await $.clock.now().catch(() => exp.interactedAt)
    return next(e)
  })

  // A background task ended: its notification reaches the session as a prompt, idle or mid-turn.
  // Any other prompt means the person moved on: the old suggestions no longer apply.
  on('prompt.submit', async ($, e, next) => {
    if (e.text.includes('<task-notification>')) await endFromNotifications($, e.text).catch(() => undefined)
    else {
      exp.interactedAt = await $.clock.now().catch(() => exp.interactedAt)
      await clearSuggestions($).catch(() => undefined)
    }
    return next(e)
  })

  on('session.receive', async ($, e, next) => {
    if (e.agentId === undefined) await endFromNotifications($, e.text).catch(() => undefined)
    return next(e)
  })

  on('session.end', async ($, e, next) => {
    const result = await next(e)
    if (exp.dir && exp.id) await $.process.run(['rm', '-f', sessionFile(exp.dir, exp.id)]).catch(() => undefined)
    return result
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
    const [s, tasks, now, done, actions, run, file, ui] = await Promise.all([
      read($, status), read($, inFlight), read($, inFlightNow), read($, finished), read($, nextActions), read($, ci), read($, taskFile), read($, tasksUi),
    ])
    const { Box, Text, Button, Input, Link, Code } = $.ui.resolve(e)
    // Every row is sibling Texts in one Box: a Text nested in a Text loses its
    // color on some surfaces, and a run of rule glyphs wraps instead of shrinking.
    const rule = (key: string, title: string, right = '') => (
      <Box key={key} flexDirection="row" justifyContent="space-between" marginTop={1}>
        <Text bold color="suggestion">{title}</Text>
        <Text dimColor>{right}</Text>
      </Box>
    )

    // Repo: branch and working tree | CI, side by side
    const repoRow = s === null ? (
      <Text key="no-repo" dimColor>{'  Not a git repository'}</Text>
    ) : (
      <Box key="repo-row" flexDirection="row">
        <Box flexDirection="column" width="50%" paddingRight={1}>
          <Box flexDirection="row">
            <Text bold wrap="truncate-end">{`⎇ ${s.branch}`}</Text>
            {s.isWorktree && <Text dimColor>{` ${s.worktreeName ?? 'worktree'}`}</Text>}
          </Box>
          <Box flexDirection="row" columnGap={1}>
            {s.dirty === 0 ? <Text color="success">✓ clean</Text> : <Text color="warning">{`● ${s.dirty} changed`}</Text>}
            <Text dimColor>{s.hasUpstream ? `↑${s.ahead} ↓${s.behind}` : 'no upstream'}</Text>
            {s.taskId && <Text dimColor>{`CU ${s.taskId}`}</Text>}
          </Box>
        </Box>
        <Box flexDirection="column" width="50%">
          {run === null ? (
            <Text dimColor>CI …</Text>
          ) : (
            <Box flexDirection="column">
              <Box flexDirection="row" justifyContent="space-between">
                <Box flexDirection="row" columnGap={1}>
                  <Text color={CI_LOOK[run.state].color}>{CI_LOOK[run.state].glyph}</Text>
                  <Text>CI</Text>
                  <Text bold color={CI_LOOK[run.state].color}>{STATE_WORD[run.state]}</Text>
                </Box>
                {run.startedAt !== null && <Text dimColor>{elapsed(now - run.startedAt)}</Text>}
              </Box>
              <Box flexDirection="row" justifyContent="space-between" columnGap={1}>
                <Text dimColor={run.state !== 'failed'} color={run.state === 'failed' ? 'error' : undefined} wrap="truncate-end">{ciDetail(run)}</Text>
                {run.url && <Link key="ci-logs" href={run.url} label="Logs" />}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    )

    // Tasks: the session's task file, rendered and edited a line at a time
    const groups: TaskGroup[] = file ? parseTasks(file.text) : []
    const tally = counts(groups)
    const nextItem = nextOpen(groups)
    const collapsed = defaultCollapsed(groups)
    for (const k of ui.toggled) collapsed.has(k) ? collapsed.delete(k) : collapsed.add(k)
    const barLen = 12
    const filled = tally.total === 0 ? 0 : Math.round((tally.done / tally.total) * barLen)

    const taskRow = (item: TaskItem) => {
      const pad = 2 + Math.floor(item.indent.replace(/\t/g, '  ').length / 2)
      if (ui.editing?.line === item.line) {
        const conflict = ui.conflict?.line === item.line ? ui.conflict : null
        return (
          <Box key={`edit-${item.line}`} flexDirection="column" paddingLeft={pad}>
            <Input key={`input-${item.line}`} value={item.text} autoFocus onSubmit={value => saveEdit($, value)} />
            <Box flexDirection="row" columnGap={1}>
              <Text dimColor>Enter saves this line</Text>
              <Button key="edit-cancel" plain dimColor onPress={() => setUi($, u => ({ ...u, editing: null, conflict: null }))}>Cancel</Button>
            </Box>
            {conflict && (
              <Box flexDirection="column">
                <Text color="warning" wrap="wrap">{`Changed on disk: ${conflict.theirs}`}</Text>
                <Box flexDirection="row" columnGap={1}>
                  <Button key="use-theirs" plain onPress={() => useTheirs($)}>Use theirs</Button>
                  <Button key="keep-mine" plain onPress={() => keepMine($)}>Keep mine</Button>
                </Box>
              </Box>
            )}
          </Box>
        )
      }
      const isNext = nextItem?.line === item.line
      return (
        <Box key={`task-${item.line}`} flexDirection="row" paddingLeft={pad} columnGap={1}>
          <Button key={`check-${item.line}`} plain onPress={() => toggleTask($, item)}>
            <Text color={item.checked ? 'success' : isNext ? 'claude' : undefined}>{item.checked ? '☑' : '☐'}</Text>
          </Button>
          <Button key={`text-${item.line}`} plain dimColor={item.checked} onPress={() => setUi($, u => ({ ...u, editing: { line: item.line, raw: item.raw }, conflict: null }))}>
            {spans(item.text).map((p, i) => <Text key={`${item.line}-${i}`} bold={isNext} {...(p.code ? { color: 'suggestion' } : {})}>{p.text}</Text>)}
          </Button>
        </Box>
      )
    }

    const tasksSection = file === null ? [
      rule('rule-tasks', 'Tasks', '–'),
      <Text key="tasks-none" dimColor wrap="wrap">{'  None yet: appears when this session writes a checklist'}</Text>,
    ] : [
      <Box key="rule-tasks" flexDirection="row" justifyContent="space-between" marginTop={1}>
        <Text bold color="suggestion">Tasks</Text>
        <Box flexDirection="row" columnGap={1}>
          <Box flexDirection="row">
            <Text color="success">{'━'.repeat(filled)}</Text>
            <Text dimColor>{'─'.repeat(barLen - filled)}</Text>
          </Box>
          <Text dimColor>{`${tally.done}/${tally.total}`}</Text>
        </Box>
      </Box>,
      <Box key="task-file" flexDirection="row" justifyContent="space-between" columnGap={1}>
        <Text dimColor wrap="truncate-middle">{tidyPath(file.path)}</Text>
        <Box flexDirection="row" columnGap={1}>
          <Button key="task-open" plain onPress={() => openInEditor($, file.path)}>Open</Button>
          <Button key="task-source" plain onPress={() => setUi($, u => ({ ...u, isSource: !u.isSource }))}>{ui.isSource ? 'Rendered' : 'Source'}</Button>
        </Box>
      </Box>,
      ...(ui.isSource
        ? [<Code key="task-code" source={file.text} language="markdown" path={file.path} />]
        : groups.flatMap(g => {
            const isOpen = !collapsed.has(g.key)
            const c = counts([g])
            return [
              <Button key={`group-${g.key}`} plain onPress={() => setUi($, u => ({ ...u, toggled: u.toggled.includes(g.key) ? u.toggled.filter(k => k !== g.key) : [...u.toggled, g.key] }))}>
                <Text>{`${isOpen ? '▾' : '▸'} ${g.title || 'Tasks'}`}</Text>
                <Text dimColor>{`  ${c.done}/${c.total}`}</Text>
              </Button>,
              ...(isOpen ? [
                ...g.items.map(taskRow),
                <Box key={`add-${g.key}`} paddingLeft={2}>
                  <Input key={`add-input-${g.key}`} placeholder="+ Add a task" onSubmit={value => addTask($, g.key, value)} />
                </Box>,
              ] : []),
            ]
          })),
    ]

    // In flight + finished
    const running = ordered(tasks)
    const inFlightSection = [
      rule('rule-inflight', 'In flight', String(running.filter(t => t.kind !== 'wakeup').length)),
      ...(running.length === 0 ? [<Text key="inflight-none" dimColor>{'  Nothing running'}</Text>] : running.map(t => {
        const waiting = t.kind === 'agent' && t.status === 'waiting'
        const color = t.kind === 'wakeup' ? 'inactive' : waiting ? 'warning' : 'claude'
        const when = t.kind === 'wakeup' ? `in ${elapsed(t.startedAt - now)}` : elapsed(now - t.startedAt)
        return (
          <Box key={`run-${t.id}`} flexDirection="column">
            <Box flexDirection="row" justifyContent="space-between" columnGap={1}>
              <Box flexDirection="row" columnGap={1} flexShrink={1}>
                <Text color={color}>{waiting ? '◑' : RUN_GLYPH[t.kind]}</Text>
                <Text wrap="truncate-end">{t.label}</Text>
              </Box>
              <Text dimColor>{when}</Text>
            </Box>
            <Text dimColor wrap="truncate-end">{`  ${t.kind === 'wakeup' ? 'check-in' : t.kind}${waiting ? '  ·  waiting' : ''}${t.lastLine ? `  ·  ${t.lastLine}` : ''}`}</Text>
          </Box>
        )
      })),
      ...(done.length === 0 ? [] : [
        rule('rule-finished', 'Finished', String(done.length)),
        ...done.map(f => {
          const ok = isGood(f.status)
          return (
            <Box key={`done-${f.id}`} flexDirection="column">
              <Box flexDirection="row" justifyContent="space-between" columnGap={1}>
                <Box flexDirection="row" columnGap={1} flexShrink={1}>
                  <Text color={ok ? 'success' : 'error'}>{ok ? '✓' : '✗'}</Text>
                  <Text dimColor={ok} wrap="truncate-end">{f.label}</Text>
                </Box>
                <Text dimColor>{`${elapsed(now - f.endedAt)} ago`}</Text>
              </Box>
              <Text dimColor={ok} color={ok ? undefined : 'error'} wrap="truncate-end">{`  ${f.kind}  ·  ${f.status}  ·  took ${elapsed(f.endedAt - f.startedAt)}`}</Text>
            </Box>
          )
        }),
      ]),
    ]

    // Next: the top suggestion as the one accent card, the rest as chips
    const [first, ...rest] = actions
    const nextSection = [
      rule('rule-next', 'Next'),
      ...(first === undefined ? [<Text key="next-none" dimColor>{'  Nothing to suggest yet'}</Text>] : [
        <Box key="next-card" flexDirection="column" borderStyle="round" borderColor="claude" paddingX={1}>
          <Button key="next-0" variant="primary" hotkey="1" label={first.label} onPress={() => runAction($, first)} />
          <Text dimColor wrap="wrap">{first.prompt}</Text>
        </Box>,
        ...(rest.length === 0 ? [] : [
          <Box key="next-more" flexDirection="row" flexWrap="wrap" columnGap={1}>
            {rest.map((a, i) => <Button key={`next-${i + 1}`} variant="secondary" hotkey={String(i + 2)} label={a.label} onPress={() => runAction($, a)} />)}
          </Box>,
        ]),
      ]),
    ]

    return (
      <Box flexDirection="column">
        {rule('rule-repo', 'Repo')}
        {repoRow}
        {tasksSection}
        {inFlightSection}
        {nextSection}
      </Box>
    )
  })
}
