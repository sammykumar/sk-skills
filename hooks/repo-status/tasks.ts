/** One `- [ ]` / `- [x]` line of a task file, by its 0-based line number. */
export type TaskItem = {
  line: number
  raw: string
  indent: string
  checked: boolean
  text: string
}

/** A heading of the task file and the task lines under it (before the next heading). `key` is the title, so a fold survives lines moving. */
export type TaskGroup = {
  key: string
  title: string
  line: number
  items: TaskItem[]
}

const TASK = /^(\s*)[-*+] \[( |x|X)\] (.*)$/
const HEADING = /^#{1,6}\s+(.*?)\s*#*\s*$/

export const isTaskFile = (path: string, text: string): boolean => /\.md$/i.test(path) && text.split('\n').some(l => TASK.test(l))

/** The file's task lines grouped under their headings; groups without tasks are left out. */
export const parseTasks = (text: string): TaskGroup[] => {
  const groups: TaskGroup[] = [{ key: 'top', title: '', line: -1, items: [] }]
  const lines = text.split('\n')
  let inFence = false
  lines.forEach((raw, line) => {
    if (/^\s*(```|~~~)/.test(raw)) inFence = !inFence
    if (inFence) return
    const h = HEADING.exec(raw)
    if (h) {
      const title = h[1] ?? ''
      const same = groups.filter(g => g.title === title).length
      groups.push({ key: same === 0 ? title : `${title} (${same + 1})`, title, line, items: [] })
      return
    }
    const t = TASK.exec(raw)
    if (t) groups[groups.length - 1]!.items.push({ line, raw, indent: t[1] ?? '', checked: t[2] !== ' ', text: t[3] ?? '' })
  })
  return groups.filter(g => g.items.length > 0)
}

export const counts = (groups: readonly TaskGroup[]) => {
  const all = groups.flatMap(g => g.items)
  return { done: all.filter(i => i.checked).length, total: all.length }
}

/** The first open task in file order: what "next" means. */
export const nextOpen = (groups: readonly TaskGroup[]): TaskItem | null =>
  groups.flatMap(g => g.items).find(i => !i.checked) ?? null

/**
 * Which groups start collapsed: every fully done group, and every group after
 * the one holding the next open task. The person's own toggles override this.
 */
export const defaultCollapsed = (groups: readonly TaskGroup[]): Set<string> => {
  const next = nextOpen(groups)
  const out = new Set<string>()
  for (const g of groups) {
    const isDone = g.items.every(i => i.checked)
    const holdsNext = next !== null && g.items.includes(next)
    if (isDone || (!holdsNext && next !== null)) out.add(g.key)
  }
  return out
}

const lineAt = (text: string, line: number) => text.split('\n')[line]

const withLine = (text: string, line: number, next: string | null): string => {
  const lines = text.split('\n')
  if (next === null) lines.splice(line, 1)
  else lines[line] = next
  return lines.join('\n')
}

/**
 * Each edit takes the line as it was drawn and refuses (returns null) when the
 * file no longer has that exact line there: someone else changed it since.
 */
export const toggleLine = (text: string, line: number, expected: string): string | null => {
  const raw = lineAt(text, line)
  if (raw !== expected) return null
  const t = TASK.exec(raw)
  if (!t) return null
  return withLine(text, line, raw.replace(/\[( |x|X)\]/, t[2] === ' ' ? '[x]' : '[ ]'))
}

export const replaceLineText = (text: string, line: number, expected: string, value: string): string | null => {
  const raw = lineAt(text, line)
  if (raw !== expected) return null
  const t = TASK.exec(raw)
  if (!t) return null
  const clean = value.replace(/\s*\n\s*/g, ' ').trim()
  if (clean === '') return withLine(text, line, null)
  return withLine(text, line, `${t[1] ?? ''}- [${t[2] === ' ' ? ' ' : 'x'}] ${clean}`)
}

/** Adds an open task right after `afterLine` (the group's last task), at its indent. */
export const insertTask = (text: string, afterLine: number, indent: string, value: string): string => {
  const clean = value.replace(/\s*\n\s*/g, ' ').trim()
  if (clean === '') return text
  const lines = text.split('\n')
  lines.splice(afterLine + 1, 0, `${indent}- [ ] ${clean}`)
  return lines.join('\n')
}

/** The line's current task text, for a conflict: what is in the file now. */
export const textOfLine = (text: string, line: number): string | null => {
  const raw = lineAt(text, line)
  if (raw === undefined) return null
  const t = TASK.exec(raw)
  return t ? `${t[2] === ' ' ? '[ ]' : '[x]'} ${t[3] ?? ''}` : raw
}
