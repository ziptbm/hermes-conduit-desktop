import { useCallback, useEffect, useRef, useState } from 'react'
import { gateway } from '../gateway'
import { SAVED_ROWS, saveChatList, savedChatList } from './savedChatList'
import {
  CHAT_LIST_MAX_PAGES,
  CHAT_LIST_PAGE,
  chatListPath,
  keepSameRows,
  mergeRows,
  refreshFirstPage,
  responseCount,
  rowsFromResponse,
  unreadProfiles,
  type ChatRow,
  type UnreadProfile
} from './chats'

/**
 * A read that failed is tried again after this, as the phone's list tries a
 * change's failed read again (hermes-conduit#2488).
 */
const RETRY_MS = 5_000
/** Failures in a row before the list waits for the next change or reconnect, as the phone's quiet wait does. */
const RETRIES = 3

const sameUnread = (a: UnreadProfile[], b: UnreadProfile[]) =>
  a.length === b.length && a.every((x, i) => {
    const y = b[i]
    return y !== undefined && x.profile === y.profile && x.error === y.error && x.corrupt === y.corrupt
  })

/** A retry a failed read left waiting is dropped: this read, a disconnect or the list's end answers for it. */
function dropRetry(retry: { current: ReturnType<typeof setTimeout> | null }) {
  if (retry.current) clearTimeout(retry.current)
  retry.current = null
}

/**
 * The chat list, read when the connection opens and again when Hermes says
 * the sessions changed. `host`'s saved list stands in from launch until the
 * first read, saying Updating….
 *
 * Every profile's chats come from the dashboard's every-profile list. Only a
 * dashboard without it (an older Hermes, which answers 404) is read through
 * the gateway's own `session.list`, which holds the gateway's own profile's
 * chats alone (`ownProfileOnly`); any other failure fails the read, to be
 * tried again, rather than passing that list off as everyone's (desktop#400).
 */
export function useChatList(connected: boolean, host = '') {
  const [saved] = useState(() => savedChatList(host))
  const [rows, setRows] = useState<ChatRow[] | null>(saved)
  const [error, setError] = useState<string | null>(null)
  /** Archived rows Hermes stamped auto-archived: voice's (see voiceList.ts) are listed with the chats. */
  const [archived, setArchived] = useState<ChatRow[]>([])
  /** The list is the gateway's own profile's: this dashboard has no every-profile list. */
  const [ownProfileOnly, setOwnProfileOnly] = useState(false)
  /** The profiles the last every-profile answer couldn't read chats from. */
  const [unread, setUnread] = useState<UnreadProfile[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** False once a read on this connection found no every-profile list here. */
  const dashboardList = useRef(true)

  const generation = useRef(0)
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null)
  const failures = useRef(0)

  const rowsRef = useRef<ChatRow[] | null>(saved)
  /**
   * Updating… (issue 2706): rows read before the connection dropped may be
   * out of date, so the read after it says so until its first page lands.
   * The list's own refreshes over a current list say nothing; a failed read
   * stops saying it and leaves the rows stale for the next one.
   */
  const stale = useRef(!!saved)
  const [updating, setUpdating] = useState(false)

  /**
   * The first page at once, then (on a full load) the rest page by page
   * behind it. A refresh reads only the first page, over the rows it has.
   */
  const load = useCallback(async (full = true) => {
    const ticket = ++generation.current
    let shown = false
    // This read answers for the one a failed read left waiting.
    dropRetry(retry)
    // A full read opens a connection: it asks the every-profile list first, whatever an earlier one found.
    if (full) dashboardList.current = true
    setUpdating(stale.current && !!rowsRef.current?.length)
    try {
      // Which list this read found the dashboard to have: its own finding until, still the current read, it sets
      // the shared one. A stale read that found no every-profile list must not decide that for a newer read.
      let everyProfile = dashboardList.current
      let body: unknown
      if (everyProfile) {
        try {
          body = await gateway.http('GET', chatListPath(0))
        } catch (e) {
          // Only a dashboard without the every-profile list (an older Hermes) is read through the gateway's
          // own, which holds its own profile's chats alone: it answers 404. A timeout or a refused read is no
          // such answer (desktop#400), and a timeout's abort carries a code of its own, so 404 alone counts.
          if ((e as { code?: unknown } | null)?.code !== 404) throw e
          everyProfile = false
        }
      }
      if (!everyProfile) body = await gateway.rpc('session.list', { limit: CHAT_LIST_PAGE })
      if (ticket !== generation.current) return
      dashboardList.current = everyProfile
      const first = rowsFromResponse(body)
      const pageWasFull = everyProfile && responseCount(body) >= CHAT_LIST_PAGE
      let all = keepSameRows(rowsRef.current, !full && rowsRef.current ? refreshFirstPage(rowsRef.current, first, pageWasFull) : first)
      // A refresh that brings nothing new keeps the list as it is, and its saved copy.
      if (all !== rowsRef.current) {
        rowsRef.current = all
        setRows(all)
        saveChatList(host, all)
      }
      setError(null)
      setOwnProfileOnly(!everyProfile)
      const found = everyProfile ? unreadProfiles(body) : []
      setUnread(current => (sameUnread(current, found) ? current : found))
      stale.current = false
      setUpdating(false)
      shown = true
      failures.current = 0
      if (!everyProfile) return
      void readArchived(ticket, full)
      if (!full) return
      for (let page = 1; page < CHAT_LIST_MAX_PAGES && responseCount(body) >= CHAT_LIST_PAGE; page++) {
        body = await gateway.http('GET', chatListPath(page * CHAT_LIST_PAGE))
        if (ticket !== generation.current) return
        const merged = mergeRows(all, rowsFromResponse(body))
        if (merged.length === all.length) continue
        all = merged
        rowsRef.current = all
        setRows(all)
        if (page * CHAT_LIST_PAGE < SAVED_ROWS) saveChatList(host, all)
      }
    } catch (e) {
      // A later page that fails leaves the chats already shown; the next refresh tries again.
      if (ticket !== generation.current || shown) return
      setUpdating(false)
      setError(e instanceof Error ? e.message : String(e))
      // The list says why it couldn't be read, and reads again in a while: RETRIES times in a row at most, so a
      // dashboard that stays down isn't asked without end, and then at the next change or reconnect.
      if (failures.current >= RETRIES) return
      failures.current++
      retry.current = setTimeout(() => {
        retry.current = null
        void load(full)
      }, RETRY_MS)
    }
  }, [host])

  /** The archived pages' auto-archived rows, as deep as the list reads; a refresh reads the first page only. */
  const archivedRef = useRef<ChatRow[]>([])
  const readArchived = async (ticket: number, full: boolean) => {
    try {
      let found: ChatRow[] = []
      for (let page = 0; page < (full ? CHAT_LIST_MAX_PAGES : 1); page++) {
        const body = await gateway.http('GET', chatListPath(page * CHAT_LIST_PAGE, 'only'))
        if (ticket !== generation.current) return
        found = [...found, ...rowsFromResponse(body).filter(r => r.autoArchived)]
        if (responseCount(body) < CHAT_LIST_PAGE) break
      }
      const next = keepSameRows(archivedRef.current, full ? found : mergeRows(archivedRef.current, found))
      if (next === archivedRef.current) return
      archivedRef.current = next
      setArchived(next)
    } catch {
      // Voice's archived rows wait for the next read.
    }
  }

  const refreshSoon = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void load(false), 400)
  }, [load])

  useEffect(() => {
    if (!connected) {
      // What's listed now predates the drop: the read once it's back says Updating….
      if (rowsRef.current) stale.current = true
      generation.current++
      setUpdating(false)
      // Nothing is read while disconnected; the read once it's back starts the retries over.
      dropRetry(retry)
      failures.current = 0
      return
    }
    void load()
    const off = window.conduit.onEvent(event => {
      if (event.type === 'sessions.changed' || event.type === 'session.title' || event.type === 'message.complete') {
        refreshSoon()
      }
    })
    return () => {
      off()
      if (timer.current) clearTimeout(timer.current)
      dropRetry(retry)
    }
  }, [connected, load, refreshSoon])

  /** Shows a row's change at once (a pin, a rename), ahead of the list Hermes sends next. */
  const patchRow = useCallback((id: string, patch: Partial<ChatRow> | null) => {
    const current = rowsRef.current
    if (!current) return
    const next = patch === null ? current.filter(r => r.id !== id) : current.map(r => (r.id === id ? { ...r, ...patch } : r))
    rowsRef.current = next
    setRows(next)
    // A refresh that confirms it changes nothing, so the saved copy takes it now.
    saveChatList(host, next)
  }, [host])

  return { rows, archived, error, updating, ownProfileOnly, unread, refresh: refreshSoon, patchRow }
}
