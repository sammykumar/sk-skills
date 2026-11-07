import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const PANE = {
  component: 'Pane',
  requestId: 'repo-status',
  props: { title: 'Repo status', isFocused: false, bodyColumns: 40, placement: 'inline', scroll: { offset: 0, bodyRows: 10 }, view: {} },
} as const

const fakeGit = (on: On, isRepo: boolean, opened: string[] = []) => {
  on('ui.open', (_$, e) => {
    opened.push(e.id)
    return { value: { isPlaced: true } }
  })
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

test('/repo-status opens the pane without printing, and the pane draws the status on every surface', async ($, on) => {
  const opened: string[] = []
  fakeGit(on, true, opened)
  const ran = await $.command.run({ command: 'repo-status', args: '', origin: { kind: 'user' } } as never)
  expect(ran.text).toBeUndefined()
  expect(opened).toEqual(['repo-status'])
  for (const surface of ['mobile', 'terminal', 'desktop', 'vscode'] as const) {
    const ui = await $.ui.mount({ plugin: 'sk-skills', surface, ...PANE })
    expect(await ui.find({ type: 'Text', text: /⎇ feat\/x-cu-86bc9ct1k/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^ x$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /● 1 changed/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /CU 86bc9ct1k/ })).toBeDefined()
    await ui.unmount()
  }
})

test('outside a git repo the pane says so', async ($, on) => {
  fakeGit(on, false)
  await $.command.run({ command: 'repo-status', args: '', origin: { kind: 'user' } } as never)
  const ui = await $.ui.mount({ plugin: 'sk-skills', surface: 'mobile', ...PANE })
  expect(await ui.find({ type: 'Text', text: /Not a git repository/ })).toBeDefined()
  await ui.unmount()
})

test('the pane opens by itself when the session starts', async ($, on) => {
  const opened: string[] = []
  fakeGit(on, true, opened)
  on('session.start', () => ({ cwd: '/r' }) as never)
  on('command.register', () => ({ value: undefined }) as never)
  on('agent.list', () => ({ value: [] }))
  mock.clock(on, { now: 0 })
  await $.session.start({ source: 'startup', cwd: '/r' } as never)
  expect(opened).toEqual(['repo-status'])
})
