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

declare module 'claude-code' {
  interface PluginState {
    'sk-skills': { repoStatus: RepoStatus | null; repoStatusPaneAutoOpened: boolean }
  }
}
