import { expect, test } from 'claude-code/testing'

import { counts, defaultCollapsed, insertTask, isTaskFile, nextOpen, parseTasks, replaceLineText, textOfLine, toggleLine } from './tasks'

const FILE = [
  '# Plan',
  '',
  '## 1. Basics',
  '- [x] One',
  '- [x] Two',
  '',
  '## 2. Rows',
  'Some prose.',
  '- [x] Three',
  '- [ ] Four with `code`',
  '  - [ ] Four point one',
  '```',
  '- [ ] not a task, inside a fence',
  '```',
  '## 3. Later',
  '- [ ] Five',
].join('\n')

test('groups task lines under their headings, skipping fences and task-less headings', async () => {
  const groups = parseTasks(FILE)
  expect(groups.map(g => [g.title, g.items.length])).toEqual([['1. Basics', 2], ['2. Rows', 3], ['3. Later', 1]])
  expect(groups[1]!.items[2]).toMatchObject({ line: 10, indent: '  ', checked: false, text: 'Four point one' })
  expect(counts(groups)).toEqual({ done: 3, total: 6 })
  expect(nextOpen(groups)?.text).toBe('Four with `code`')
  expect(isTaskFile('plan.md', FILE)).toBe(true)
  expect(isTaskFile('plan.txt', FILE)).toBe(false)
  expect(isTaskFile('notes.md', '# just notes')).toBe(false)
})

test('done groups and groups after the next task start collapsed', async () => {
  const collapsed = defaultCollapsed(parseTasks(FILE))
  expect([...collapsed].sort()).toEqual(['1. Basics', '3. Later'])
})

test('a toggle flips only its line, and refuses when the line changed on disk', async () => {
  const toggled = toggleLine(FILE, 9, '- [ ] Four with `code`')
  expect(toggled?.split('\n')[9]).toBe('- [x] Four with `code`')
  expect(toggled?.split('\n').length).toBe(FILE.split('\n').length)
  expect(toggleLine(FILE, 9, '- [ ] Something else')).toBe(null)
})

test('an inline edit keeps the box and indent; empty deletes the line; stale is refused', async () => {
  expect(replaceLineText(FILE, 10, '  - [ ] Four point one', 'Four point two')?.split('\n')[10]).toBe('  - [ ] Four point two')
  expect(replaceLineText(FILE, 3, '- [x] One', '  ')?.split('\n')[3]).toBe('- [x] Two')
  expect(replaceLineText(FILE, 3, '- [ ] One', 'x')).toBe(null)
  expect(textOfLine(FILE, 3)).toBe('[x] One')
})

test('adding a task inserts an open line after the group\'s last task', async () => {
  const added = insertTask(FILE, 15, '', 'Six')
  expect(added.split('\n').slice(-2)).toEqual(['- [ ] Five', '- [ ] Six'])
  expect(insertTask(FILE, 15, '', '   ')).toBe(FILE)
})
