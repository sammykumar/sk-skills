import type { CiStatus } from '../../types'

type Run = { databaseId?: number; status?: string; conclusion?: string; workflowName?: string; createdAt?: string; url?: string }
type Job = { name?: string; status?: string; conclusion?: string }

const FAILED = new Set(['failure', 'timed_out', 'startup_failure', 'action_required'])

/** The state the pane shows for a run, from `gh run list --json status,conclusion`. */
export const stateOf = (run: Run): CiStatus['state'] => {
  if (run.status === 'queued' || run.status === 'waiting' || run.status === 'pending' || run.status === 'requested') return 'queued'
  if (run.status !== 'completed') return 'running'
  if (run.conclusion === 'success') return 'passed'
  if (run.conclusion && FAILED.has(run.conclusion)) return 'failed'
  return 'other'
}

/** Builds the status from the run list's first entry and, when fetched, that run's jobs. */
export const parseCi = (runListJson: string, jobsJson: string | null): CiStatus => {
  let runs: Run[] = []
  try {
    runs = JSON.parse(runListJson)
  } catch {
    runs = []
  }
  const run = runs[0]
  if (!run) return { state: 'none', workflow: '', startedAt: null, url: null, runId: null, jobsDone: 0, jobsTotal: 0, failedJobs: [], conclusion: null }
  let jobs: Job[] = []
  if (jobsJson) {
    try {
      jobs = (JSON.parse(jobsJson) as { jobs?: Job[] }).jobs ?? []
    } catch {
      jobs = []
    }
  }
  const startedAt = run.createdAt ? Date.parse(run.createdAt) : NaN
  return {
    state: stateOf(run),
    workflow: run.workflowName ?? '',
    startedAt: Number.isNaN(startedAt) ? null : startedAt,
    url: run.url ?? null,
    runId: run.databaseId ?? null,
    jobsDone: jobs.filter(j => j.status === 'completed').length,
    jobsTotal: jobs.length,
    failedJobs: jobs.filter(j => j.conclusion && FAILED.has(j.conclusion)).map(j => j.name ?? 'job'),
    conclusion: run.conclusion ?? null,
  }
}

/** One short line from gh's stderr: why there is no CI to show. */
export const ciReason = (stderr: string): string => {
  const text = stderr.toLowerCase()
  if (text.includes('ip allow list')) return 'blocked by the org IP allow list'
  if (text.includes('saml') || text.includes('oauth app access restrictions')) return 'org needs SSO or app approval for gh'
  if (text.includes('rate limit')) return 'GitHub rate limit'
  if (text.includes('http 403')) return 'GitHub denied access (403)'
  if (text.includes('http 401') || text.includes('bad credentials')) return 'gh token rejected (401)'
  if (text.includes('auth login') || text.includes('not logged')) return 'gh not signed in'
  if (text.includes('no git remote') || text.includes('none of the git remotes')) return 'no GitHub remote'
  if (text.includes('could not resolve') || text.includes('not found')) return 'repo not on GitHub'
  const first = stderr.split('\n').map(l => l.trim()).find(Boolean) ?? 'gh failed'
  return first.length > 40 ? `${first.slice(0, 39)}…` : first
}

export const unavailable = (reason: string): CiStatus => ({
  state: 'unavailable', workflow: reason, startedAt: null, url: null, runId: null, jobsDone: 0, jobsTotal: 0, failedJobs: [], conclusion: null,
})

export const STATE_WORD: Record<CiStatus['state'], string> = {
  passed: 'passed',
  failed: 'failed',
  running: 'running',
  queued: 'queued',
  none: 'no runs',
  other: 'done',
  unavailable: 'unavailable',
}

/** The quiet second line: failing jobs, else jobs done/total while running, else the workflow. */
export const ciDetail = (ci: CiStatus): string => {
  if (ci.state === 'failed' && ci.failedJobs.length > 0) return ci.failedJobs.join(', ')
  if (ci.state === 'running' && ci.jobsTotal > 0) return `${ci.workflow} · ${ci.jobsDone}/${ci.jobsTotal}`
  if (ci.state === 'other' && ci.conclusion) return `${ci.workflow} · ${ci.conclusion}`
  if (ci.state === 'none') return 'this branch'
  if (ci.state === 'unavailable') return ci.workflow
  return ci.workflow
}

/** Whether to ask GitHub again now: often while a run moves, rarely once it settled. */
export const isDue = (ci: CiStatus | null, lastFetchAt: number, now: number, branchChanged: boolean): boolean => {
  if (branchChanged || ci === null) return true
  const every = ci.state === 'running' || ci.state === 'queued' ? 15_000 : 120_000
  return now - lastFetchAt >= every
}
