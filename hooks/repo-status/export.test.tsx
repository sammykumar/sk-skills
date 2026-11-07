import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { isExtensionLive, parseInbox, parseTitle } from './export'

test('the tab title is the latest rename, else the latest AI title', async () => {
  const ai = '{"type":"ai-title","aiTitle":"First"}\n{"type":"ai-title","aiTitle":"Pure prompt shell setup"}'
  expect(parseTitle(ai)).toBe('Pure prompt shell setup')
  expect(parseTitle(`${ai}\n{"type":"custom-title","customTitle":"My name"}\n{"type":"ai-title","aiTitle":"Later"}`)).toBe('My name')
  expect(parseTitle('{"type":"ai-ti')).toBe(null)
})

test('the inbox yields prompts and drops anything else', async () => {
  expect(parseInbox('[{"type":"prompt","text":"a"},{"type":"x","text":"b"},{"type":"prompt"}]')).toEqual(['a'])
  expect(parseInbox('{"type":"prompt","text":"solo"}')).toEqual(['solo'])
  expect(parseInbox('nope')).toEqual([])
})

test('an extension counts as live for 30s after its heartbeat', async () => {
  expect(isExtensionLive('{"updatedAt":1000}', 20_000)).toBe(true)
  expect(isExtensionLive('{"updatedAt":1000}', 40_000)).toBe(false)
  expect(isExtensionLive(null, 0)).toBe(false)
})

const ok = (stdout: string) => ({ value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
const DIR = '/home/u/.claude/repo-status'

const host = (on: On, files: Map<string, string>, opened: string[], submitted: string[]) => {
  on('session.start', () => ({ cwd: '/r' }) as never)
  on('command.register', () => ({ value: undefined }) as never)
  on('agent.list', () => ({ value: [] }))
  on('env.get', () => ({ value: '/home/u' }) as never)
  on('session.id', () => ({ value: 'sess-1' }) as never)
  on('session.cwd', () => ({ value: '/r' }) as never)
  on('ui.open', (_$, e) => {
    opened.push(e.id)
    return { value: { isPlaced: true } }
  })
  on('ui.close', () => ({ value: undefined }) as never)
  on('fs.exists', (_$, e) => ({ value: files.has(e.path) }) as never)
  on('fs.read', (_$, e) => {
    if (!files.has(e.path)) throw new Error('ENOENT')
    return { value: files.get(e.path) } as never
  })
  on('fs.write', (_$, e) => {
    files.set(e.path, e.text)
    return { value: undefined } as never
  })
  on('prompt.submit', (_$, e) => {
    submitted.push(e.text)
    return { text: e.text }
  })
  on('process.run', async (_$, e) => {
    const a = e.argv
    if (a[0] === 'find') return ok('/home/u/.claude/projects/-r/sess-1.jsonl\n')
    if (a[0] === 'grep') return ok('{"type":"ai-title","aiTitle":"Ship the pane"}\n')
    if (a[0] === 'rm') {
      files.delete(a[2] ?? '')
      return ok('')
    }
    if (a[0] === 'gh') return { value: { exitCode: 1, stdout: '', stderr: 'no git remotes found', isStdoutTruncated: false, isStderrTruncated: false } }
    if (a.includes('status')) return ok('## main\n')
    return ok('/r/.git\n/r/.git\n')
  })
}

test('each session publishes its state with its tab title, and takes prompts from the inbox', async ($, on) => {
  const files = new Map<string, string>()
  const opened: string[] = []
  const submitted: string[] = []
  const clock = mock.clock(on, { now: 100_000 })
  host(on, files, opened, submitted)

  await $.session.start({ source: 'startup', cwd: '/r' } as never)
  const doc = JSON.parse(files.get(`${DIR}/sess-1.json`) ?? '{}')
  expect(doc).toMatchObject({ sessionId: 'sess-1', cwd: '/r', title: 'Ship the pane', interactedAt: 0 })
  expect(doc.state.repo.branch).toBe('main')
  expect(opened).toEqual(['repo-status'])

  files.set(`${DIR}/sess-1.inbox.json`, '[{"type":"prompt","text":"Check CI"}]')
  await clock.advance(1_000)
  expect(submitted).toEqual(['Check CI'])
  await clock.advance(1_000)
  expect(JSON.parse(files.get(`${DIR}/sess-1.json`) ?? '{}').interactedAt).toBeGreaterThan(100_000)
  expect(files.has(`${DIR}/sess-1.inbox.json`)).toBe(false)
})

test('while an editor extension is live, the built-in pane stays closed', async ($, on) => {
  const files = new Map<string, string>([[`${DIR}/.extension.json`, '{"updatedAt":99000}']])
  const opened: string[] = []
  mock.clock(on, { now: 100_000 })
  host(on, files, opened, [])

  await $.session.start({ source: 'startup', cwd: '/r' } as never)
  expect(files.has(`${DIR}/sess-1.json`)).toBe(true)
  expect(opened).toEqual([])
})
