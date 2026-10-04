import type { RepoStatus } from '../../types'

export const parseStatus = (porcelain: string, gitDir: string, commonDir: string): RepoStatus => {
  const [header = '', ...rest] = porcelain.split('\n')
  const branchPart = header.replace(/^## /, '')
  const branch = branchPart.startsWith('HEAD (no branch)')
    ? 'detached'
    : branchPart.replace(/^No commits yet on /, '').split('...')[0]!.split(' ')[0]!
  const ahead = Number(/ahead (\d+)/.exec(branchPart)?.[1] ?? 0)
  const behind = Number(/behind (\d+)/.exec(branchPart)?.[1] ?? 0)
  const isWorktree = gitDir.replace(/\/$/, '') !== commonDir.replace(/\/$/, '')
  const worktreeName = isWorktree ? (gitDir.split('/worktrees/')[1]?.split('/')[0] ?? null) : null
  const taskId = /(?:^|[-_/])cu-([0-9a-z]+)/i.exec(branch)?.[1] ?? null

  return {
    branch,
    isWorktree,
    worktreeName,
    dirty: rest.filter(line => line.trim() !== '').length,
    ahead,
    behind,
    hasUpstream: branchPart.includes('...'),
    taskId,
  }
}

export const describe = (s: RepoStatus): string[] => {
  const parts = [`⎇ ${s.branch}`, s.isWorktree ? `worktree${s.worktreeName ? ` ${s.worktreeName}` : ''}` : 'main checkout']
  parts.push(s.dirty === 0 ? 'clean' : `${s.dirty} uncommitted`)
  if (!s.hasUpstream) parts.push('no upstream')
  else if (s.ahead || s.behind) parts.push([s.ahead && `↑${s.ahead}`, s.behind && `↓${s.behind}`].filter(Boolean).join(' '))
  if (s.taskId) parts.push(`CU ${s.taskId}`)
  return parts
}
