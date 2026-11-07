import { expect, test } from 'claude-code/testing'

import { ciDetail, ciReason, isDue, parseCi, unavailable } from './ci'

const run = (o: Record<string, unknown>) => JSON.stringify([{ databaseId: 7, workflowName: 'Build & test', createdAt: '2026-11-07T12:00:00Z', url: 'https://example.test/runs/7', ...o }])
const jobs = JSON.stringify({ jobs: [
  { name: 'lint', status: 'completed', conclusion: 'failure' },
  { name: 'unit', status: 'completed', conclusion: 'success' },
  { name: 'e2e', status: 'in_progress', conclusion: '' },
] })

test('reads the run state and the job tally', async () => {
  const running = parseCi(run({ status: 'in_progress' }), jobs)
  expect(running).toMatchObject({ state: 'running', jobsDone: 2, jobsTotal: 3, failedJobs: ['lint'] })
  expect(ciDetail(running)).toBe('Build & test · 2/3')
  expect(parseCi(run({ status: 'queued' }), null).state).toBe('queued')
  expect(parseCi(run({ status: 'completed', conclusion: 'success' }), null).state).toBe('passed')
  const failed = parseCi(run({ status: 'completed', conclusion: 'failure' }), jobs)
  expect(failed.state).toBe('failed')
  expect(ciDetail(failed)).toBe('lint')
  expect(parseCi(run({ status: 'completed', conclusion: 'cancelled' }), null).state).toBe('other')
})

test('no runs and bad JSON read as no runs', async () => {
  expect(parseCi('[]', null).state).toBe('none')
  expect(parseCi('not json', null).state).toBe('none')
})

test('polls often while a run moves, rarely once settled, at once on a new branch', async () => {
  const running = parseCi(run({ status: 'in_progress' }), null)
  const passed = parseCi(run({ status: 'completed', conclusion: 'success' }), null)
  expect(isDue(running, 0, 16_000, false)).toBe(true)
  expect(isDue(passed, 0, 16_000, false)).toBe(false)
  expect(isDue(passed, 0, 121_000, false)).toBe(true)
  expect(isDue(passed, 0, 1, true)).toBe(true)
})

test('a failed gh call becomes a short reason instead of a blank', async () => {
  expect(ciReason('To get started with GitHub CLI, please run:  gh auth login')).toBe('gh not signed in')
  expect(ciReason('no git remotes found')).toBe('no GitHub remote')
  expect(ciDetail(unavailable('gh not found'))).toBe('gh not found')
})
