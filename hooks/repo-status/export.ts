/**
 * The session's repo-status state, published as a file so an editor extension
 * can draw the pane itself: ~/.claude/repo-status/<session id>.json. The
 * extension asks for prompts through <session id>.inbox.json and announces
 * itself with .extension.json, a heartbeat the mod reads to keep its own pane
 * closed while the extension draws one.
 */

export const EXPORT_DIR = (home: string) => `${home}/.claude/repo-status`
export const sessionFile = (dir: string, id: string) => `${dir}/${id}.json`
export const inboxFile = (dir: string, id: string) => `${dir}/${id}.inbox.json`
export const extensionFile = (dir: string) => `${dir}/.extension.json`

/** How long an extension heartbeat counts as live. */
export const EXTENSION_LIVE_MS = 30_000

/** The session title Claude Code shows on the session's tab: the latest custom (renamed) or AI title in the transcript. */
export const parseTitle = (grepOutput: string): string | null => {
  let title: string | null = null
  let custom: string | null = null
  for (const line of grepOutput.split('\n')) {
    try {
      const row = JSON.parse(line) as { type?: string; customTitle?: string; aiTitle?: string; title?: string }
      if (row.type === 'custom-title') custom = row.customTitle ?? row.title ?? custom
      if (row.type === 'ai-title') title = row.aiTitle ?? row.title ?? title
    } catch {
      // a partial line from the grep: skip it
    }
  }
  return custom ?? title
}

/** The prompts an extension queued, in order; anything malformed is dropped. */
export const parseInbox = (text: string): string[] => {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return []
  }
  const items = Array.isArray(raw) ? raw : [raw]
  return items.flatMap(i => (i && typeof i === 'object' && (i as { type?: unknown }).type === 'prompt' && typeof (i as { text?: unknown }).text === 'string' ? [(i as { text: string }).text] : []))
}

export const isExtensionLive = (heartbeatJson: string | null, now: number): boolean => {
  if (!heartbeatJson) return false
  try {
    const at = (JSON.parse(heartbeatJson) as { updatedAt?: number }).updatedAt
    return typeof at === 'number' && now - at < EXTENSION_LIVE_MS
  } catch {
    return false
  }
}
