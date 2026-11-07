import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'
import type { Engine } from 'claude-code/testing'

const PANE = {
  component: 'Pane',
  requestId: 'repo-status',
  props: { title: 'Repo status', isFocused: false, bodyColumns: 60, placement: 'inline', scroll: { offset: 0, bodyRows: 40 }, view: {} },
} as const

const PLAN = '/r/plans/pane.md'
const START = ['# Pane', '', '## 1. Rows', '- [x] Track shells', '- [ ] Keep finished tasks', '- [ ] Colour icons'].join('\n')

const ok = (stdout: string) => ({ value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })

/** An in-memory disk and a git repo whose CI failed on lint. */
const fakeHost = (on: On) => {
  const disk = new Map<string, { text: string; mtimeMs: number }>()
  let clock = 1
  const put = (path: string, text: string) => disk.set(path, { text, mtimeMs: clock++ })
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('agent.list', () => ({ value: [] }))
  on('fs.exists', (_$, e) => ({ value: disk.has(e.path) }) as never)
  on('fs.read', (_$, e) => ({ value: disk.get(e.path)?.text ?? '' }) as never)
  on('fs.stat', (_$, e) => {
    const f = disk.get(e.path)
    if (!f) throw new Error('ENOENT')
    return { value: { kind: 'file', size: f.text.length, mtimeMs: f.mtimeMs, isLink: false } } as never
  })
  on('fs.write', (_$, e) => {
    put(e.path, e.text)
    return { value: undefined } as never
  })
  on('process.run', async (_$, e) => {
    const argv = e.argv
    if (argv[0] === 'gh' && argv[1] === 'run' && argv[2] === 'list') {
      return ok(JSON.stringify([{ databaseId: 9, status: 'completed', conclusion: 'failure', workflowName: 'Build & test', createdAt: '1970-01-01T00:00:00Z', url: 'https://example.test/runs/9' }]))
    }
    if (argv[0] === 'gh' && argv[1] === 'run' && argv[2] === 'view') return ok(JSON.stringify({ jobs: [{ name: 'lint', status: 'completed', conclusion: 'failure' }] }))
    if (argv.includes('status')) return ok('## feat/task-list...origin/feat/task-list [ahead 3]\n M a.ts\n')
    return ok('/r/.git\n/r/.git\n')
  })
  on('tool.call', { tool: 'Write' }, async (_$, e) => {
    put(e.file_path, e.content)
    return { result: { type: 'create', filePath: e.file_path, content: e.content }, text: `File created successfully at: ${e.file_path}` } as never
  })
  on('prompt.submit', (_$, e) => ({ text: e.text }))
  return { disk, put }
}

const refreshPane = ($: Engine) =>
  $.command.run({ command: 'repo-status', args: '', origin: { kind: 'user' } } as never)

test('the checklist this session wrote becomes the Tasks section, beside branch and CI', async ($, on) => {
  mock.clock(on, { now: 600_000 })
  fakeHost(on)
  await $.tool.call({ tool: 'Write', file_path: PLAN, content: START } as never)
  await refreshPane($)

  for (const surface of ['vscode', 'terminal'] as const) {
    const ui = await $.ui.mount({ plugin: 'sk-skills', surface, ...PANE })
    expect(await ui.find({ type: 'Text', text: /⎇ feat\/task-list/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^failed$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^lint$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^1\/3$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /plans\/pane\.md/ })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'check-4' })).toBeDefined()
    await ui.unmount()
  }
})

test('a checkbox press and an inline edit write the file itself', async ($, on) => {
  mock.clock(on, { now: 600_000 })
  const { disk } = fakeHost(on)
  await $.tool.call({ tool: 'Write', file_path: PLAN, content: START } as never)
  await refreshPane($)

  const ui = await $.ui.mount({ plugin: 'sk-skills', surface: 'vscode', ...PANE })
  await ui.press({ key: 'check-4' })
  expect(disk.get(PLAN)!.text.split('\n')[4]).toBe('- [x] Keep finished tasks')

  await ui.press({ key: 'text-5' })
  await ui.input({ key: 'input-5', text: 'Colour status icons by state' })
  expect(disk.get(PLAN)!.text.split('\n')[5]).toBe('- [ ] Colour status icons by state')
  expect(disk.get(PLAN)!.text.split('\n').length).toBe(START.split('\n').length)

  await ui.input({ key: 'add-input-1. Rows', text: 'Show exit codes' })
  expect(disk.get(PLAN)!.text.split('\n').slice(-1)).toEqual(['- [ ] Show exit codes'])
  await ui.unmount()
})

test('an edit to a line that changed on disk asks instead of overwriting', async ($, on) => {
  mock.clock(on, { now: 600_000 })
  const { disk, put } = fakeHost(on)
  await $.tool.call({ tool: 'Write', file_path: PLAN, content: START } as never)
  await refreshPane($)

  const ui = await $.ui.mount({ plugin: 'sk-skills', surface: 'vscode', ...PANE })
  await ui.press({ key: 'text-4' })
  put(PLAN, START.replace('- [ ] Keep finished tasks', '- [x] Keep finished tasks'))
  await ui.input({ key: 'input-4', text: 'Keep finished tasks for 15 minutes' })
  expect(disk.get(PLAN)!.text.split('\n')[4]).toBe('- [x] Keep finished tasks')
  expect(await ui.find({ type: 'Text', text: /Changed on disk: \[x\] Keep finished tasks/ })).toBeDefined()

  await ui.press({ key: 'keep-mine' })
  expect(disk.get(PLAN)!.text.split('\n')[4]).toBe('- [x] Keep finished tasks for 15 minutes')
  await ui.unmount()
})
