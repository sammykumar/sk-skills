import { expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const PANE = {
  component: 'Pane',
  requestId: 'repo-status',
  props: { title: 'Repo status', isFocused: false, bodyColumns: 80, placement: 'inline', scroll: { offset: 0, bodyRows: 10 }, view: {} },
} as const

const OUTPUT = '/tmp/s/tasks/bci1.output'

const ok = (stdout: string) => ({ value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })

const fakeHost = (on: On) => {
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('clock.now', () => ({ value: 1_000_000 }))
  on('agent.list', () => ({ value: [] }))
  on('prompt.submit', (_$, e) => ({ text: e.text }))
  on('process.run', async (_$, e) => {
    if (e.argv[0] === 'tail') return ok('Build: passed\nlint: in_progress\n')
    if (e.argv.includes('status')) return ok('## main...origin/main\n')
    return ok(e.argv.includes('--path-format=absolute') ? '/r/.git\n' : '/r/.git\n.git\n')
  })
  on('tool.call', { tool: 'Bash' }, () => ({
    result: { stdout: '', stderr: '', interrupted: false, backgroundTaskId: 'bci1' },
    text: `Command running in background with ID: bci1. Output is being written to: ${OUTPUT}. You will be notified when it completes.`,
  }))
}

test('a background shell shows in the pane with its latest output, and its notification clears it', async ($, on) => {
  fakeHost(on)
  await $.tool.call({ tool: 'Bash', command: 'gh run watch 123', description: 'Wait for master CI', run_in_background: true })

  await $.command.run({ command: 'repo-status', args: '', origin: { kind: 'user' } } as never)

  for (const surface of ['terminal', 'mobile'] as const) {
    const ui = await $.ui.mount({ plugin: 'sk-skills', surface, ...PANE })
    expect(await ui.find({ type: 'Text', text: /In flight: 1 running/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /shell  Wait for master CI  ·  lint: in_progress/ })).toBeDefined()
    await ui.unmount()
  }

  await $.prompt.submit({ text: '<task-notification>\n<task-id>bci1</task-id>\n<status>completed</status>\n</task-notification>' } as never)
  const after = await $.ui.mount({ plugin: 'sk-skills', surface: 'terminal', ...PANE })
  expect(await after.find({ type: 'Text', text: /Wait for master CI/ })).toBeUndefined()
  expect(await after.find({ type: 'Text', text: /In flight: nothing running/ })).toBeDefined()
  await after.unmount()
})
