import type { NextAction } from '../../types'

export const MAX_ACTIONS = 3

/**
 * Asked of a fork of the session after each answered turn: the fork sees the
 * whole conversation, so it can name what was just offered or left open.
 */
export const SUGGEST_PROMPT = [
  'Stop. Do not continue the task. Answer this one question only.',
  'Looking at where this conversation stands right now, what are the next prompts the user is most likely to send you?',
  `List at most ${MAX_ACTIONS}, most likely first. Include only concrete actions you could carry out in this session: a step you just offered, the obvious follow-up, or a check of work still running. If there is no clear next step, answer [].`,
  'Answer with JSON only, no prose and no code fence:',
  '[{"label": "<2 to 5 words, starting with a verb>", "prompt": "<the exact prompt the user would send, written as the user, specific enough to act on alone>"}]',
].join('\n')

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s)

/** The actions in a fork's reply: the first JSON array in it, kept to well-formed, distinct entries. */
export const parseNextActions = (reply: string): NextAction[] => {
  const start = reply.indexOf('[')
  const end = reply.lastIndexOf(']')
  if (start === -1 || end <= start) return []
  let raw: unknown
  try {
    raw = JSON.parse(reply.slice(start, end + 1))
  } catch {
    return []
  }
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: NextAction[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const { label, prompt } = item as Record<string, unknown>
    if (typeof label !== 'string' || typeof prompt !== 'string') continue
    const l = label.trim().replace(/\s+/g, ' ')
    const p = prompt.trim()
    if (l === '' || p === '' || seen.has(l.toLowerCase())) continue
    seen.add(l.toLowerCase())
    out.push({ label: clip(l, 40), prompt: clip(p, 1000) })
    if (out.length === MAX_ACTIONS) break
  }
  return out
}
