import type { InFlightTask } from '../../types'

/** Background work states the agent list still counts as in flight. */
export const ACTIVE_AGENT = new Set(['pending', 'running', 'waiting'])

/** How many in-flight rows the band above the prompt shows before folding the rest. */
export const BAND_ROWS = 3

/** A background shell or monitor's start, read from the tool result the model sees. */
export const parseBackgroundStart = (text: string): { id: string; outputFile: string | null } | null => {
  const outputFile = /Output is being written to: (\S+?\.output)\b/.exec(text)?.[1] ?? null
  const id = /background with ID: ([A-Za-z0-9_-]+)/.exec(text)?.[1] ?? outputFile?.split('/').pop()?.replace(/\.output$/, '') ?? null
  return id ? { id, outputFile } : null
}

/** Every `<task-notification>` in a delivery: the task it ends and how it ended. */
export const parseNotifications = (text: string): { id: string; status: string }[] =>
  [...text.matchAll(/<task-notification>([\s\S]*?)<\/task-notification>/g)].flatMap(([, body = '']) => {
    const id = /<task-id>([^<]+)<\/task-id>/.exec(body)?.[1]?.trim()
    const status = /<status>([^<]+)<\/status>/.exec(body)?.[1]?.trim() ?? 'completed'
    return id ? [{ id, status }] : []
  })

const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]/g

/** The last line of output worth showing: no colour codes, no blank or progress-bar lines, one bounded line. */
export const lastLine = (output: string, max = 80): string | null => {
  const line = output
    .replace(ANSI, '')
    .split(/\r?\n|\r/)
    .map(l => l.trim())
    .filter(l => l !== '' && /[A-Za-z0-9]/.test(l))
    .pop()
  if (!line) return null
  return line.length > max ? `${line.slice(0, max - 1)}…` : line
}

export const elapsed = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}m`
}

const KIND_LABEL: Record<InFlightTask['kind'], string> = { shell: 'shell', monitor: 'monitor', agent: 'agent', wakeup: 'check-in' }

/** One in-flight row: how long, what kind, what it is, and its latest output line. */
export const describeTask = (t: InFlightTask, now: number): string => {
  const when = t.kind === 'wakeup' ? `in ${elapsed(t.startedAt - now)}` : elapsed(now - t.startedAt)
  const status = t.kind === 'agent' && t.status && t.status !== 'running' ? ` (${t.status})` : ''
  const tail = t.lastLine ? `  ·  ${t.lastLine}` : ''
  return `${when}  ${KIND_LABEL[t.kind]}  ${t.label}${status}${tail}`
}

/** The tasks ordered for display: running work oldest first, check-ins last. */
export const ordered = (tasks: readonly InFlightTask[]): InFlightTask[] =>
  [...tasks].sort((a, b) => Number(a.kind === 'wakeup') - Number(b.kind === 'wakeup') || a.startedAt - b.startedAt)

export const summary = (tasks: readonly InFlightTask[]): string => {
  const busy = tasks.filter(t => t.kind !== 'wakeup').length
  return busy === 0 ? 'nothing running' : `${busy} running`
}
