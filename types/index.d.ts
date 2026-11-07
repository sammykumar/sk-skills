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

/** A suggested next prompt: the button's text and what pressing it submits. */
export type NextAction = {
  label: string
  prompt: string
}

declare module 'claude-code' {
  interface PluginState {
    'sk-skills': {
      repoStatus: RepoStatus | null
      inFlight: InFlightTask[]
      inFlightNow: number
      nextActions: NextAction[]
    }
  }
}
