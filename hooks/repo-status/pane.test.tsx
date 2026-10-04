import { expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const PANE = {
  component: 'Pane',
  requestId: 'repo-status',
  props: { title: 'Repo status', isFocused: false, bodyColumns: 40, placement: 'inline', scroll: { offset: 0, bodyRows: 10 }, view: {} },
} as const

const fakeGit = (on: On, isRepo: boolean) => {
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('process.run', async (_$, e) => {
    if (!isRepo) return { value: { exitCode: 128, stdout: '', stderr: 'not a git repository', isStdoutTruncated: false, isStderrTruncated: false } }
    const out = e.argv.includes('status')
      ? '## feat/x-cu-86bc9ct1k...origin/feat/x-cu-86bc9ct1k [ahead 1]\n M a.ts\n'
      : e.argv.includes('--path-format=absolute')
        ? '/r/.git\n'
        : '/r/.git/worktrees/x\n.git\n'
    return { value: { exitCode: 0, stdout: out, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
}

test('/repo-status reports the status and the pane draws it on every surface, mobile included', async ($, on) => {
  fakeGit(on, true)
  const ran = await $.command.run({ command: 'repo-status', args: '', origin: { kind: 'user' } } as never)
  expect(ran.text).toContain('CU 86bc9ct1k')
  for (const surface of ['mobile', 'terminal', 'desktop', 'vscode'] as const) {
    const ui = await $.ui.mount({ plugin: 'sk-skills', surface, ...PANE })
    expect(await ui.find({ type: 'Text', text: /worktree x/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /1 uncommitted/ })).toBeDefined()
    await ui.unmount()
  }
})

test('outside a git repo the pane says so', async ($, on) => {
  fakeGit(on, false)
  const ran = await $.command.run({ command: 'repo-status', args: '', origin: { kind: 'user' } } as never)
  expect(ran.text).toBe('Not in a git repo.')
  const ui = await $.ui.mount({ plugin: 'sk-skills', surface: 'mobile', ...PANE })
  expect(await ui.find({ type: 'Text', text: /Not in a git repo/ })).toBeDefined()
  await ui.unmount()
})
