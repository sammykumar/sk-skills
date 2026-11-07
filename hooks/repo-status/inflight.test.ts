import { expect, test } from 'claude-code/testing'

import type { InFlightTask } from '../../types'
import { describeTask, elapsed, lastLine, ordered, parseBackgroundStart, parseNotifications } from './inflight'

test('reads a background shell start from the tool result', async () => {
  const text = 'Command running in background with ID: bzqycd2z8. Output is being written to: /tmp/s/tasks/bzqycd2z8.output. You will be notified when it completes.'
  expect(parseBackgroundStart(text)).toEqual({ id: 'bzqycd2z8', outputFile: '/tmp/s/tasks/bzqycd2z8.output' })
  expect(parseBackgroundStart('hello')).toBe(null)
})

test('falls back to the output file name for the id', async () => {
  expect(parseBackgroundStart('Monitor started. Output is being written to: /tmp/tasks/m42.output')).toEqual({ id: 'm42', outputFile: '/tmp/tasks/m42.output' })
})

test('reads every task notification in a delivery', async () => {
  const text = [
    '<task-notification>\n<task-id>b1</task-id>\n<status>completed</status>\n<summary>done</summary>\n</task-notification>',
    '<task-notification>\n<task-id>b2</task-id>\n<status>failed</status>\n</task-notification>',
  ].join('\n')
  expect(parseNotifications(text)).toEqual([
    { id: 'b1', status: 'completed' },
    { id: 'b2', status: 'failed' },
  ])
})

test('last line skips colour codes, blanks and progress bars, and is bounded', async () => {
  expect(lastLine('Build\n\x1b[32mlint: passed\x1b[0m\n\n----\n')).toBe('lint: passed')
  expect(lastLine('\n\n')).toBe(null)
  expect(lastLine('x'.repeat(200), 10)).toBe('xxxxxxxxx…')
})

test('elapsed reads as seconds, minutes, then hours', async () => {
  expect(elapsed(42_000)).toBe('42s')
  expect(elapsed(13 * 60_000)).toBe('13m')
  expect(elapsed(65 * 60_000)).toBe('1h05m')
})

const task = (over: Partial<InFlightTask>): InFlightTask => ({
  id: 'x', kind: 'shell', label: 'Wait for master CI', startedAt: 0, outputFile: null, lastLine: null, status: null, ...over,
})

test('a row names how long, what kind, what, and the latest output', async () => {
  expect(describeTask(task({ lastLine: 'build: in_progress' }), 13 * 60_000)).toBe('13m  shell  Wait for master CI  ·  build: in_progress')
  expect(describeTask(task({ kind: 'agent', label: 'Find demo page', status: 'waiting' }), 90_000)).toBe('1m  agent  Find demo page (waiting)')
  expect(describeTask(task({ kind: 'wakeup', label: 'watching CI', startedAt: 300_000 }), 0)).toBe('in 5m  check-in  watching CI')
})

test('running work comes oldest first, check-ins last', async () => {
  const rows = ordered([task({ id: 'w', kind: 'wakeup', startedAt: 1 }), task({ id: 'b', startedAt: 20 }), task({ id: 'a', startedAt: 10 })])
  expect(rows.map(t => t.id)).toEqual(['a', 'b', 'w'])
})
