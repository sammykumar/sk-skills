import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

import { parseNextActions } from './next-actions'

test('reads the actions out of a reply, skipping junk and duplicates, capped at three', async () => {
  const reply = 'Sure:\n[{"label":"Push and open PR","prompt":"Push the branch and open a PR"},{"label":"push and open pr","prompt":"dup"},{"label":7},{"label":"Run tests","prompt":"Run the tests"},{"label":"Check CI","prompt":"Check CI"},{"label":"Fourth","prompt":"x"}]'
  expect(parseNextActions(reply)).toEqual([
    { label: 'Push and open PR', prompt: 'Push the branch and open a PR' },
    { label: 'Run tests', prompt: 'Run the tests' },
    { label: 'Check CI', prompt: 'Check CI' },
  ])
  expect(parseNextActions('[]')).toEqual([])
  expect(parseNextActions('no json here')).toEqual([])
  expect(parseNextActions('[{"label": broken')).toEqual([])
})

const PANE = {
  component: 'Pane',
  requestId: 'repo-status',
  props: { title: 'Repo status', isFocused: false, bodyColumns: 80, placement: 'inline', scroll: { offset: 0, bodyRows: 10 }, view: {} },
} as const

const ok = (stdout: string) => ({ value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })

const OPEN_PR = '[{"label":"Open the PR","prompt":"Push the branch and open a PR to master"}]'

const fakeHost = (on: On, submitted: string[], forkReply: () => Promise<string> = async () => OPEN_PR) => {
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('agent.list', () => ({ value: [] }))
  on('process.run', async (_$, e) => ok(e.argv.includes('status') ? '## main...origin/main\n' : '/r/.git\n'))
  on('model.fork', async () => ({ value: { isAnswered: true, text: await forkReply(), usage: {} } }) as never)
  on('turn.complete', () => ({ text: 'Done. Want me to open the PR?' }))
  on('prompt.submit', (_$, e) => {
    submitted.push(e.text)
    return { text: e.text }
  })
}

const answerTurn = ($: Engine) =>
  $.turn.complete({ reason: 'answer', answer: 'Done. Want me to open the PR?', durationMs: 1000, isAborted: false, turnId: 't1' } as never)

test('after an answered turn the suggestion is a button, and pressing it submits its prompt', async ($, on) => {
  const submitted: string[] = []
  const clock = mock.clock(on, { now: 1_000_000 })
  fakeHost(on, submitted)

  await answerTurn($)
  await clock.advance(1)

  for (const surface of ['terminal', 'vscode', 'desktop', 'mobile'] as const) {
    const ui = await $.ui.mount({ plugin: 'sk-skills', surface, ...PANE })
    expect(await ui.find({ type: 'Button', key: 'next-0' })).toBeDefined()
    await ui.unmount()
  }

  const ui = await $.ui.mount({ plugin: 'sk-skills', surface: 'terminal', ...PANE })
  await ui.press({ key: 'next-0' })
  expect(submitted).toEqual(['Push the branch and open a PR to master'])
  await ui.unmount()

  const after = await $.ui.mount({ plugin: 'sk-skills', surface: 'terminal', ...PANE })
  expect(await after.find({ type: 'Button', key: 'next-0' })).toBeUndefined()
  await after.unmount()
})

test('a prompt typed before the suggestion lands drops it', async ($, on) => {
  const submitted: string[] = []
  const clock = mock.clock(on, { now: 1_000_000 })
  let release = () => {}
  const held = new Promise<void>(r => { release = r })
  fakeHost(on, submitted, async () => {
    await held
    return '[{"label":"Stale","prompt":"stale"}]'
  })

  await answerTurn($)
  await clock.advance(1)
  await $.prompt.submit({ text: 'something else' } as never)
  release()
  await clock.advance(1)

  const ui = await $.ui.mount({ plugin: 'sk-skills', surface: 'terminal', ...PANE })
  expect(await ui.find({ type: 'Button', key: 'next-0' })).toBeUndefined()
  await ui.unmount()
})
