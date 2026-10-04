import { expect, test } from 'claude-code/testing'

import { describe, parseStatus } from './parse'

const MAIN = '/repo/.git'

test('main checkout, clean, in sync', async () => {
  const s = parseStatus('## master...origin/master\n', MAIN, MAIN)
  expect(describe(s)).toEqual(['⎇ master', 'main checkout', 'clean'])
})

test('worktree with ClickUp branch, dirty, ahead and behind', async () => {
  const s = parseStatus(
    '## feat/second-chance-call-in-cu-86bc9ct1k...origin/feat/second-chance-call-in-cu-86bc9ct1k [ahead 2, behind 1]\n M a.ts\n?? b.ts\n',
    '/repo/.git/worktrees/feat-second-chance-call-in-cu-86bc9ct1k',
    MAIN,
  )
  expect(s.isWorktree).toBe(true)
  expect(s.taskId).toBe('86bc9ct1k')
  expect(describe(s)).toEqual([
    '⎇ feat/second-chance-call-in-cu-86bc9ct1k',
    'worktree feat-second-chance-call-in-cu-86bc9ct1k',
    '2 uncommitted',
    '↑2 ↓1',
    'CU 86bc9ct1k',
  ])
})

test('new branch without upstream', async () => {
  const s = parseStatus('## fix/thing\n', MAIN, MAIN)
  expect(describe(s)).toEqual(['⎇ fix/thing', 'main checkout', 'clean', 'no upstream'])
})
