import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { describe, parseStatus } from './parse'

const status = atom({ plugin: 'sk-skills', key: 'repoStatus' } as const, null)

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

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await refresh($).catch(() => undefined)
    return result
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
}
