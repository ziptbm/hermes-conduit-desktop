/**
 * The chat list: rows from the dashboard (`/api/profiles/sessions`, every
 * profile, newest activity first), with the gateway's `session.list` as the
 * fallback an older dashboard needs, grouped the way the phone groups them.
 */
import { formatDate, t } from '../../../shared/i18n'
import { cleanTitle, previewText } from './text'
import { silenceShown } from './silence'
import { classifySource, type ChatSource } from './chatSources'

export interface ChatRow {
  id: string
  title: string
  preview?: string
  /** Last activity, in milliseconds. */
  activeAt?: number
  profile?: string
  pinned: boolean
  /** The conversation's first session, which a compacted chat keeps: its pin id. */
  lineageRoot?: string
  /** Hermes' shared read flag (Hermes Desktop's Mark as unread sets it). */
  unread?: boolean
  source?: string
  /** Where the chat came from, for its badge and the Sources filter. */
  sourceKind?: ChatSource
  messageCount?: number
  /** Hermes' auto-archive stamp: archived by a sweep (the plugin's voice archiving), not by the user. */
  autoArchived?: boolean
  /** Hermes' end_reason for an ended row. */
  endReason?: string
  /** A voice call was kept with this chat, so it's under Voice too. */
  hasVoiceCalls?: boolean
  /** The call or chat a voice job started from: it nests under that row. */
  nestUnder?: string
}

export interface ChatSection {
  title: string
  rows: ChatRow[]
}

/** Sessions that aren't chats, as the phone's list leaves them out (cron runs have their own list). */
export const CHAT_LIST_EXCLUDED_SOURCES = 'cron,kanban,oneshot,tool'

/**
 * A Kanban worker Hermes stored before it tagged workers `kanban`, as the
 * phone tells one (Models.swift isLegacyKanbanWorker): a `cli` row (`local`
 * after a peer refresh) whose preview is the dispatcher's one-line prompt,
 * "work kanban task <id>". A Telegram or cron row that only reads the same
 * is a chat.
 */
export function isLegacyKanbanWorker(source: string | undefined, preview: string | undefined): boolean {
  if (!['cli', 'local'].includes((source ?? '').toLowerCase())) return false
  const text = (preview ?? '').trim().toLowerCase()
  const prompt = 'work kanban task '
  if (!text.startsWith(prompt)) return false
  const task = text.slice(prompt.length)
  return task !== '' && !/\s/.test(task)
}

/** Rows per page of the chat list. */
export const CHAT_LIST_PAGE = 200

/** Pages read at most, so a host with years of chats doesn't read them all at once. */
export const CHAT_LIST_MAX_PAGES = 25

export function chatListPath(offset = 0, archived: 'exclude' | 'only' = 'exclude'): string {
  return `/api/profiles/sessions?limit=${CHAT_LIST_PAGE}&offset=${offset}&min_messages=1&archived=${archived}&order=recent&exclude_sources=${CHAT_LIST_EXCLUDED_SOURCES}`
}

export const CHAT_LIST_PATH = chatListPath(0)

/** How many sessions a response held before any were left out, to tell a full page from the last one. */
export function responseCount(body: unknown): number {
  if (Array.isArray(body)) return body.length
  const sessions = body && typeof body === 'object' ? (body as { sessions?: unknown }).sessions : undefined
  return Array.isArray(sessions) ? sessions.length : 0
}

/** A profile whose chats the every-profile list couldn't read. */
export interface UnreadProfile {
  profile: string
  /** Why its store wouldn't open, in Hermes' words; left out when Hermes gave none. */
  error?: string
  /** Hermes latched its store as damaged (structurally corrupt), so what it lists may be partial. */
  corrupt?: boolean
}

/**
 * The profiles the every-profile list couldn't read chats from (desktop#400).
 * Hermes' /api/profiles/sessions answers 200 with a profile's rows simply
 * gone when its store wouldn't open: it names the profile in `errors`, and
 * in `storage` when it latched the store as corrupt. Unread, such a profile
 * looks like one with no chats.
 */
export function unreadProfiles(body: unknown): UnreadProfile[] {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return []
  const { errors, storage } = body as { errors?: unknown; storage?: unknown }
  const found = new Map<string, UnreadProfile>()
  if (Array.isArray(errors)) {
    for (const entry of errors) {
      if (!entry || typeof entry !== 'object') continue
      const { profile, error } = entry as { profile?: unknown; error?: unknown }
      // One that names a profile is kept, with its reason when it has one: Hermes writes the reason from the
      // exception's message, which can be empty, and the profile's chats are gone from the answer all the same.
      if (typeof profile !== 'string' || !profile) continue
      found.set(profile, { profile, ...(typeof error === 'string' && error ? { error } : {}) })
    }
  }
  if (storage && typeof storage === 'object' && !Array.isArray(storage)) {
    for (const [profile, state] of Object.entries(storage as Record<string, unknown>)) {
      if (profile && state === 'corrupt') found.set(profile, { profile, corrupt: true, ...(found.get(profile) ?? {}) })
    }
  }
  return [...found.values()]
}

/**
 * A fresh first page over the rows already read: the page wins for the
 * newest chats, and the older pages stay as they were read.
 */
export function refreshFirstPage(existing: ChatRow[], page: ChatRow[], pageWasFull: boolean): ChatRow[] {
  if (!pageWasFull) return page
  const ids = new Set(page.map(r => r.id))
  const oldest = Math.min(...page.map(r => r.activeAt ?? 0))
  return [...page, ...existing.filter(r => !ids.has(r.id) && (r.activeAt ?? 0) < oldest)]
}

/** Adds a later page's rows, keeping the first copy of a chat that moved between pages. */
export function mergeRows(existing: ChatRow[], page: ChatRow[]): ChatRow[] {
  const seen = new Set(existing.map(r => r.id))
  return [...existing, ...page.filter(r => !seen.has(r.id))]
}

/** Whether two rows say the same, field by field (rows hold only plain values). */
export function sameRow<T extends object>(a: T, b: T): boolean {
  if (a === b) return true
  // A key left out and one set to undefined are the same: the saved list's JSON drops the undefined ones.
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof T>
  for (const k of keys) if (a[k] !== b[k]) return false
  return true
}

/**
 * A fresh read over the rows already shown: each row that says the same
 * keeps its object, and the whole list keeps its array when nothing changed,
 * so a refresh that brings nothing new redraws nothing (desktop#199).
 */
export function keepSameRows<T extends { id: string }>(previous: readonly T[] | null, next: T[]): T[] {
  if (!previous?.length) return next
  const before = new Map(previous.map(r => [r.id, r]))
  let changed = previous.length !== next.length
  const kept = next.map((row, i) => {
    const old = before.get(row.id)
    const same = old && sameRow(old, row) ? old : row
    if (same !== previous[i]) changed = true
    return same
  })
  return changed ? kept : (previous as T[])
}

const ACTIVITY_KEYS = ['last_active', 'updated_at', 'last_message_at', 'started_at', 'created_at'] as const

/** Seconds, milliseconds, micro- or nanoseconds to milliseconds. */
export function toMillis(value: unknown): number | undefined {
  let n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isFinite(n) || n <= 0) return undefined
  while (n > 4e10) n /= 1000 // anything past year 3300 in seconds is a finer unit
  return n * 1000
}

export function rowsFromResponse(body: unknown): ChatRow[] {
  const list = Array.isArray(body)
    ? body
    : body && typeof body === 'object' && Array.isArray((body as { sessions?: unknown }).sessions)
      ? (body as { sessions: unknown[] }).sessions
      : []
  const rows: ChatRow[] = []
  const seen = new Set<string>()
  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue
    const obj = raw as Record<string, unknown>
    const id = typeof obj.id === 'string' ? obj.id : typeof obj.session_id === 'string' ? obj.session_id : null
    if (!id || seen.has(id)) continue
    seen.add(id)
    const source = typeof obj.source === 'string' ? obj.source : undefined
    if (source && CHAT_LIST_EXCLUDED_SOURCES.split(',').includes(source.toLowerCase())) continue
    if (isLegacyKanbanWorker(source, typeof obj.preview === 'string' ? obj.preview : undefined)) continue
    const title = typeof obj.title === 'string' ? cleanTitle(obj.title) : ''
    const preview = typeof obj.preview === 'string' ? previewText(silenceShown(obj.preview)) : ''
    let activeAt: number | undefined
    for (const key of ACTIVITY_KEYS) {
      activeAt = toMillis(obj[key])
      if (activeAt) break
    }
    rows.push({
      id,
      title: title || preview || t('Untitled chat'),
      preview: title && preview && preview !== title ? preview : undefined,
      activeAt,
      profile: typeof obj.profile === 'string' ? obj.profile : undefined,
      pinned: obj.pinned === true || obj.pinned === 1,
      lineageRoot: typeof obj._lineage_root_id === 'string' && obj._lineage_root_id.trim() ? obj._lineage_root_id.trim() : undefined,
      unread: obj.unread === true || obj.unread === 1 || undefined,
      source,
      sourceKind: classifySource(obj),
      messageCount: typeof obj.message_count === 'number' ? obj.message_count : undefined,
      autoArchived: obj.auto_archived === true || obj.auto_archived === 1 || undefined,
      endReason: typeof obj.end_reason === 'string' && obj.end_reason ? obj.end_reason : undefined
    })
  }
  return rows
}

export function startOfDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function sectionRows(rows: ChatRow[], now = Date.now()): ChatSection[] {
  const today = startOfDay(now)
  const yesterday = today - 86_400_000
  const week = today - 6 * 86_400_000
  const buckets: Record<string, ChatRow[]> = { Pinned: [], Today: [], Yesterday: [], 'Previous 7 days': [], Older: [] }
  const sorted = [...rows].sort((a, b) => (b.activeAt ?? 0) - (a.activeAt ?? 0))
  for (const row of sorted) {
    const at = row.activeAt ?? 0
    const bucket = row.pinned ? 'Pinned' : at >= today ? 'Today' : at >= yesterday ? 'Yesterday' : at >= week ? 'Previous 7 days' : 'Older'
    buckets[bucket]!.push(row)
  }
  const titles: Record<string, string> = {
    Pinned: t('Pinned'),
    Today: t('Today'),
    Yesterday: t('Yesterday'),
    'Previous 7 days': t('Previous 7 days'),
    Older: t('Older')
  }
  return Object.entries(buckets)
    .filter(([, list]) => list.length > 0)
    .map(([bucket, list]) => ({ title: titles[bucket]!, rows: list }))
}

/** 8:07 AM today, a weekday this week, else a short date. */
export function timeLabel(ms: number | undefined, now = Date.now()): string {
  if (!ms) return ''
  const today = startOfDay(now)
  if (ms >= today) return formatDate(ms, { hour: 'numeric', minute: '2-digit' })
  if (ms >= today - 6 * 86_400_000) return formatDate(ms, { weekday: 'short' })
  return formatDate(ms, { month: 'short', day: 'numeric' })
}
