export type RepoStatus = {
  branch: string
  isWorktree: boolean
  worktreeName: string | null
  dirty: number
  ahead: number
  behind: number
  hasUpstream: boolean
  taskId: string | null
}

/**
 * One piece of background work the session started and has not heard back from:
 * a background shell, a monitor, a subagent, or a scheduled check-in.
 * `startedAt` is when it started; for a check-in, when it fires.
 */
export type InFlightTask = {
  id: string
  kind: 'shell' | 'monitor' | 'agent' | 'wakeup'
  label: string
  startedAt: number
  outputFile: string | null
  lastLine: string | null
  status: string | null
}

/** A task that ended in the last few minutes, kept so its result stays in view. */
export type FinishedTask = {
  id: string
  kind: InFlightTask['kind']
  label: string
  startedAt: number
  endedAt: number
  status: string
  lastLine: string | null
}

/** A suggested next prompt: the button's text and what pressing it submits. */
export type NextAction = {
  label: string
  prompt: string
}

/** The latest CI run for the current branch, as `gh run list` reports it. */
export type CiStatus = {
  state: 'passed' | 'failed' | 'running' | 'queued' | 'none' | 'other'
  workflow: string
  startedAt: number | null
  url: string | null
  runId: number | null
  jobsDone: number
  jobsTotal: number
  failedJobs: string[]
  conclusion: string | null
}

/** A markdown file with `- [ ]` lines that this session wrote (`isCreated`) or edited. */
export type TaskFileCandidate = {
  path: string
  isCreated: boolean
  at: number
}

/** The picked task file as last read from disk. The file is the only copy; this is a cache of it. */
export type TaskFile = {
  path: string
  mtimeMs: number
  text: string
}

/** The Tasks section's view state: which groups the person folded, and the line being edited. */
export type TasksUi = {
  toggled: string[]
  editing: { line: number; raw: string } | null
  conflict: { line: number; raw: string; mine: string; theirs: string } | null
  isSource: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'sk-skills': {
      repoStatus: RepoStatus | null
      inFlight: InFlightTask[]
      inFlightNow: number
      finished: FinishedTask[]
      nextActions: NextAction[]
      ci: CiStatus | null
      taskCandidates: TaskFileCandidate[]
      taskFile: TaskFile | null
      tasksUi: TasksUi
    }
  }
}
