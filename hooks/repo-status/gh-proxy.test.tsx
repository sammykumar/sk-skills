import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const ok = (stdout: string) => ({ value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })

const host = (on: On, proxy: string | undefined, seen: Array<Record<string, string> | undefined>) => {
  on('session.start', () => ({ cwd: '/r' }) as never)
  on('command.register', () => ({ value: undefined }) as never)
  on('agent.list', () => ({ value: [] }))
  on('env.get', (_$, e) => ({ value: e.name === 'REPO_STATUS_GH_PROXY' ? proxy : '/home/u' }) as never)
  on('session.id', () => ({ value: 's' }) as never)
  on('session.cwd', () => ({ value: '/r' }) as never)
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('fs.exists', () => ({ value: false }) as never)
  on('fs.read', () => { throw new Error('ENOENT') })
  on('fs.write', () => ({ value: undefined }) as never)
  on('process.run', async (_$, e) => {
    if (e.argv[0] === 'gh') {
      seen.push(e.init?.env as Record<string, string> | undefined)
      return ok('[]')
    }
    if (e.argv.includes('status')) return ok('## main\n')
    return ok('/r/.git\n/r/.git\n')
  })
}

test('REPO_STATUS_GH_PROXY routes only the CI lookup through its proxy', async ($, on) => {
  const seen: Array<Record<string, string> | undefined> = []
  mock.clock(on, { now: 1_000_000 })
  host(on, 'http://127.0.0.1:9999', seen)
  await $.session.start({ source: 'startup', cwd: '/r' } as never)
  expect(seen.length).toBeGreaterThan(0)
  expect(seen[0]).toMatchObject({ HTTPS_PROXY: 'http://127.0.0.1:9999', http_proxy: 'http://127.0.0.1:9999' })
})

test('direct clears the proxy for the CI lookup', async ($, on) => {
  const seen: Array<Record<string, string> | undefined> = []
  mock.clock(on, { now: 1_000_000 })
  host(on, 'direct', seen)
  await $.session.start({ source: 'startup', cwd: '/r' } as never)
  expect(seen[0]).toMatchObject({ HTTPS_PROXY: '', https_proxy: '', HTTP_PROXY: '', http_proxy: '' })
})

test('without it, gh runs with the session environment untouched', async ($, on) => {
  const seen: Array<Record<string, string> | undefined> = []
  mock.clock(on, { now: 1_000_000 })
  host(on, undefined, seen)
  await $.session.start({ source: 'startup', cwd: '/r' } as never)
  expect(seen.length).toBeGreaterThan(0)
  expect(seen[0]).toBeUndefined()
})
