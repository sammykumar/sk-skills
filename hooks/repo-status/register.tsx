import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { describe, parseStatus } from './parse'

const PANE = 'repo-status'
const status = atom({ plugin: 'sk-skills', key: 'repoStatus' } as const, null)
const isAutoOpened = atom({ plugin: 'sk-skills', key: 'repoStatusPaneAutoOpened' } as const, false)

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

const hasPhone = async ($: EngineInterface) => (await $.session.surfaces()).includes('mobile')

const openForPhone = async ($: EngineInterface) => {
  await update($, isAutoOpened, () => true)
  await $.ui.open({ id: PANE, title: 'Repo status' })
}

export const register: Register = on => {

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await $.command.register({ name: 'repo-status', description: 'Show branch, worktree and uncommitted state in a pane' })
    await refresh($).catch(() => undefined)
    if (await hasPhone($)) await openForPhone($)
    return result
  })

  on('session.attach', { surface: 'mobile' }, async ($, e, next) => {
    const result = await next(e)
    await refresh($).catch(() => undefined)
    await openForPhone($)
    return result
  })

  on('session.detach', { surface: 'mobile' }, async ($, e, next) => {
    const result = await next(e)
    if (e.reason === 'detach' && (await read($, isAutoOpened)) && !(await hasPhone($))) {
      await update($, isAutoOpened, () => false)
      await $.ui.close({ id: PANE }).catch(() => undefined)
    }
    return result
  })

  on('command.run', { command: 'repo-status' }, async $ => {
    await update($, isAutoOpened, () => false)
    await refresh($).catch(() => undefined)
    await $.ui.open({ id: PANE, title: 'Repo status' })
    const s = await read($, status)
    return { text: s === null ? 'Not in a git repo.' : describe(s).join('  ·  ') }
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    await refresh($).catch(() => undefined)
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const s = await read($, status)
    if (e.props.hasSurvey || s === null) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const parts = describe(s)

    return (
      <Box>
        <Text dimColor>{parts.join('  ·  ')}</Text>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const s = await read($, status)
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {s === null ? (
          <Text dimColor>Not in a git repo.</Text>
        ) : (
          describe(s).map(part => <Text key={part}>{part}</Text>)
        )}
      </Box>
    )
  })
}
