import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { underSource } from '../state/voiceList'
import { includedInAll, profileGroups, readClosedSections, readGroupByProfile, readLeftOut, shownInAll, writeClosedSections, writeGroupByProfile, writeLeftOut } from '../state/profileGroups'
import { sectionRows, startOfDay, timeLabel, type ChatRow, type UnreadProfile } from '../state/chats'
import type { Bot } from '../state/bots'
import { BotAvatar } from './BotsHome'
import { t } from '@shared/i18n'
import { HideListButton } from './HideListButton'
import { Icon } from './icons'
import { UpdatingCapsule } from './UpdatingCapsule'
import { facetOf, isSourceKey, isStarred, isUnread, parseSelection, selectRows, settingFilter, type ChatFilterKey, type ChatMarks } from '../state/chatMarks'
import { sourceName, sourcesIn, type ChatSource } from '../state/chatSources'
import { contentRows, useContentSearch } from '../state/contentSearch'
import { arrangePinned, moved, usePinnedOrder } from '../state/pinnedOrder'
import { gateway } from '../gateway'
import type { HostBadge, OtherChatRow } from '../state/keptHosts'
import { HostBadgeMark } from './CombinedDashboards'
import { EMPTY_NESTING, ancestorsOf, descendants, nestRows, nestSummary } from '../state/chatNesting'
import { ChatFilterMenu, type FilterChoice } from './ChatFilterMenu'
import { MUTE_CHOICES, muteEnd } from '../state/chatMute'
import { filterProjects, hiddenNow, hiddenProjectsSlot, hidesChat, projectIndex, projectOf, readHiddenProjects, writeHiddenProjects, NO_PROJECT } from '../state/hiddenProjects'
import type { Project } from '../state/projects'
import { ProfileColumn } from './ProfileColumn'
import type { MixedTile } from '../state/botOrder'

const EXPANDED_NESTS = 'conduit.expanded-nests'
function readExpandedNests(): Set<string> {
  try {
    const saved = JSON.parse(localStorage.getItem(EXPANDED_NESTS) ?? '[]') as unknown
    return new Set(Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [])
  } catch {
    return new Set()
  }
}
function writeExpandedNests(ids: Set<string>): void {
  try {
    localStorage.setItem(EXPANDED_NESTS, JSON.stringify([...ids].slice(-200)))
  } catch {
    // Kept for this window only.
  }
}

/** The Filter menu's words for each choice. */
const FILTER_LABELS: Record<Exclude<ChatFilterKey, `source:${string}`>, () => string> = {
  starred: () => t('Starred'),
  unread: () => t('Unread'),
  running: () => t('Running'),
  waiting: () => t('Needs approval'),
  inprogress: () => t('In progress'),
  done: () => t('Done')
}
const STATUS_CHOICES = ['unread', 'running', 'waiting'] as const
const PROGRESS_CHOICES = ['inprogress', 'done'] as const

/** The Filter menu's choices, kept on this computer as the phone keeps its own. */
const FILTERS_KEY = 'conduit.chatFilters'
function readSelection(): ChatFilterKey[] {
  try {
    return parseSelection(JSON.parse(localStorage.getItem(FILTERS_KEY) ?? '[]'))
  } catch {
    return []
  }
}
function writeSelection(selection: readonly ChatFilterKey[]): void {
  try {
    if (selection.length) localStorage.setItem(FILTERS_KEY, JSON.stringify(selection))
    else localStorage.removeItem(FILTERS_KEY)
  } catch {
    // Kept for this window only.
  }
}

/** A section of the list: a date's (or Pinned), or a profile's when grouped by profile. */
interface ListSection {
  title: string
  rows: ChatRow[]
  profile?: string
  hidden?: number
  extra?: number
}

interface Props {
  rows: ChatRow[] | null
  /** Hides the list: the « at its top. */
  onHide?: () => void
  error: string | null
  /** Rows that may be out of date are being read again: the Updating… capsule. */
  updating?: boolean
  /** Only the gateway's own profile's chats are listed: this dashboard has no every-profile list (an older Hermes). */
  ownProfileOnly?: boolean
  /** Profiles whose chats Hermes couldn't read on the last list answer. */
  unread?: UnreadProfile[]
  selectedId: string | null
  runningIds: ReadonlySet<string>
  /** Chats Hermes waits on the user in (an approval or a question): Needs approval on the row. */
  waitingIds?: ReadonlySet<string>
  runningStatus?: string
  onSelect: (row: ChatRow) => void
  onNewChat: () => void
  /** The bots, for the profile column and the rows' bot names. */
  bots?: Bot[] | null
  /** The profile the list shows (null: every one). */
  profile?: string | null
  onProfile?: (profile: string | null) => void
  /** Edit profile from a face's right-click in the column. */
  onEditProfile?: (bot: Bot) => void
  /**
   * The column's faces: in a combined group every dashboard's profiles in the
   * group's order (state/botOrder mixedTiles); else this dashboard's bots.
   */
  profileTiles?: MixedTile[]
  /** A face's dashboard badge, in a combined group. */
  tileBadge?: (tile: MixedTile) => HostBadge | null
  /** What waits on the person in another dashboard's profile, read through its kept connection. */
  otherWaits?: (tile: MixedTile) => number
  /** Another dashboard's face: the list shows that profile's chats, with no switch. */
  onOtherProfile?: (tile: MixedTile) => void
  /** Another dashboard's profile the list shows, from its face; this dashboard's `profile` is null then. */
  otherProfile?: { host: string; name: string } | null
  /** A row's menu (right-click or ⋯): Pin or Unpin, Rename, Delete. */
  onPin?: (row: ChatRow) => void
  onRename?: (row: ChatRow, title: string) => void
  onDelete?: (row: ChatRow) => void
  /** Stars and read state, kept on this computer; the filter chips use them. */
  marks?: ChatMarks
  onStar?: (row: ChatRow) => void
  onToggleRead?: (row: ChatRow) => void
  /** Done chats, kept by the plugin: left out on a plugin that doesn't keep them. */
  isDone?: (row: ChatRow) => boolean
  /** A muted chat's mute (state/chatMute), null when it isn't; with onMute, the menu offers Mute Notifications. */
  muteOf?: (row: ChatRow) => { until: number | null } | null
  /** Mutes the chat for `seconds` (null: until unmuted), or unmutes it (0). */
  onMute?: (row: ChatRow, seconds: number | null) => void
  onDone?: (row: ChatRow) => void
  /** Opens Projects, the phone's Chats › Projects. */
  onProjects?: () => void
  /**
   * Filter › Projects: the profile the list shows and its project tree (null
   * while it's read); left out in All with several profiles, where projects
   * belong to no one profile.
   */
  projects?: { profile: string; list: Project[] | null }
  /** Filter › Needs you: every profile's waiting chats, where the list is served. */
  onNeedsYou?: () => void
  /** The host, so a Hermes without message search isn't asked again. */
  searchScope?: string
  /** Opens every pinned reply; left out while there are none. */
  onPinnedReplies?: () => void
  /** Move to Project: the projects a chat can move into (its profile's, each with its folder), read when asked. */
  moveTargets?: (row: ChatRow) => Promise<MoveTarget[]>
  onMove?: (row: ChatRow, target: MoveTarget) => void
  /** Open Beside: the row opens and the chat on screen stays beside it; only in a window wide enough for both. */
  onOpenBeside?: (row: ChatRow) => void
  canOpenBeside?: (row: ChatRow) => boolean
  /** Open in New Window: the chat in a window of its own, or its window to the front when it has one. */
  onOpenInWindow?: (row: ChatRow) => void
  /** The chats with windows of their own. */
  windowIds?: readonly string[]
  /** Combined dashboards: the other hosts' chats, only in All, each opening through a switch. */
  otherRows?: OtherChatRow[]
  badgeFor?: (url: string) => HostBadge | null
  onOpenOther?: (row: OtherChatRow) => void
}

export interface MoveTarget {
  id: string
  title: string
  path: string
}

/** Profiles In messages asks at most, one request each. */
const MAX_SEARCH_PROFILES = 8
const NONE: ReadonlySet<string> = new Set()
const NO_UNREAD: UnreadProfile[] = []
const NO_ROWS: OtherChatRow[] = []
/** Grouped by profile, another host's section shows its newest five until Show more. */
const OTHER_HOST_ROWS = 5
const isOther = (row: ChatRow): row is OtherChatRow => typeof (row as Partial<OtherChatRow>).host === 'string'
const searchHttp = (path: string) => gateway.http('GET', path)
const prefsHttp = (method: 'GET' | 'PUT', path: string, body?: unknown) => gateway.http(method, path, body)

/** A row's words for the search, lowercased once per row object (rows keep theirs across refreshes: keepSameRows). */
const searchTexts = new WeakMap<ChatRow, string>()
function searchText(row: ChatRow): string {
  let text = searchTexts.get(row)
  if (text === undefined) {
    text = `${row.title} ${row.preview ?? ''}`.toLowerCase()
    searchTexts.set(row, text)
  }
  return text
}

const sameProfile = (row: ChatRow, name: string) => (row.profile ?? 'default').toLowerCase() === name.toLowerCase()
const sameName = (a: string | undefined, b: string | undefined) => (a ?? 'default').toLowerCase() === (b ?? 'default').toLowerCase()

export function ChatList({
  rows,
  updating,
  error,
  ownProfileOnly = false,
  unread = NO_UNREAD,
  selectedId,
  runningIds,
  waitingIds = NONE,
  runningStatus,
  onSelect,
  onNewChat,
  bots,
  profile = null,
  onProfile,
  onEditProfile,
  profileTiles,
  tileBadge,
  otherWaits,
  onOtherProfile,
  otherProfile = null,
  onPin,
  onRename,
  onDelete,
  marks,
  onStar,
  onToggleRead,
  isDone,
  muteOf,
  onMute,
  onDone,
  onProjects,
  projects: projectTree,
  onNeedsYou,
  onPinnedReplies,
  searchScope = '',
  moveTargets,
  onMove,
  onOpenBeside,
  onOpenInWindow,
  windowIds,
  canOpenBeside,
  otherRows = NO_ROWS,
  badgeFor,
  onOpenOther,
  onHide
}: Props) {
  const [query, setQuery] = useState('')
  const [menu, setMenu] = useState<{ row: ChatRow; x: number; y: number } | null>(null)
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null)
  const hasActions = !!(onPin || onRename || onDelete || onStar)
  // Move to Project's targets: null while they're read.
  const [moving, setMoving] = useState<MoveTarget[] | null | false>(false)
  const canMove = !!onMove && !!moveTargets
  useEffect(() => setMoving(false), [menu])
  // Mute Notifications' durations, shown in place of the menu.
  const [muting, setMuting] = useState(false)
  useEffect(() => setMuting(false), [menu])
  async function startMove(row: ChatRow) {
    setMoving(null)
    const targets = await moveTargets!(row).catch(() => [])
    setMoving(current => (current === null ? targets : current))
  }
  /** The Filter menu's choices: none is All. */
  const [selection, setSelectionState] = useState<ChatFilterKey[]>(readSelection)
  const setSelection = (next: ChatFilterKey[]) => {
    setSelectionState(next)
    writeSelection(next)
  }
  const [filterOpen, setFilterOpen] = useState(false)
  // Filter › Projects, kept per dashboard and profile; only the projects listed now count.
  const projectsSlot = projectTree?.profile ?? null
  const projects = projectTree?.list
  const [keptHidden, setKeptHidden] = useState<{ slot: string; ids: string[] } | null>(null)
  const keptKey = projectsSlot ? hiddenProjectsSlot(searchScope, projectsSlot) : null
  const keptIds = useMemo(
    () => (!keptKey || !projectsSlot ? [] : keptHidden?.slot === keptKey ? keptHidden.ids : readHiddenProjects(searchScope, projectsSlot)),
    [keptKey, keptHidden, searchScope, projectsSlot]
  )
  const hiddenProjects = useMemo(() => (projectsSlot ? hiddenNow(keptIds, projects) : new Set<string>()), [projectsSlot, keptIds, projects])
  const setHiddenProjects = (ids: string[]) => {
    if (!keptKey) return
    setKeptHidden({ slot: keptKey, ids })
    writeHiddenProjects(searchScope, projectsSlot!, ids)
  }
  const projectsIndex = useMemo(() => projectIndex(projects), [projects])
  const homeTitle = projects?.find(p => p.isHome)?.title
  const projectChoices = useMemo(() => {
    const offered = projectsSlot ? filterProjects(projects) : []
    return offered.length
      ? { home: homeTitle, list: offered.map(p => ({ id: p.id, title: p.title })), hidden: hiddenProjects, onHidden: (ids: string[]) => setHiddenProjects(ids) }
      : undefined
    // setHiddenProjects reads keptKey, which projectsSlot and searchScope make.
  }, [projectsSlot, projects, homeTitle, hiddenProjects, searchScope])

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('click', close)
    window.addEventListener('keydown', onKey)
    window.addEventListener('blur', close)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('blur', close)
    }
  }, [menu])

  function finishRename(save: boolean) {
    if (!renaming) return
    const row = rows?.find(r => r.id === renaming.id)
    const title = renaming.title.trim()
    setRenaming(null)
    if (save && row && title && title !== row.title) onRename?.(row, title)
  }
  const pinOrder = usePinnedOrder(searchScope, rows, prefsHttp)
  // All profiles, grouped by profile: a section per profile with its pinned chats and five newest (issue 1560, #1571).
  // Offered under All with two or more profiles, as the profile strip is.
  const canGroup = !profile && !otherProfile && (bots?.length ?? 0) > 1
  const [groupByProfile, setGroupByProfile] = useState(readGroupByProfile)
  const grouped = canGroup && groupByProfile
  const [showingAll, setShowingAll] = useState<Set<string>>(() => new Set())
  const [closedSections, setClosedSections] = useState<string[]>(readClosedSections)
  const toggleSection = (p: string) => {
    const next = closedSections.includes(p) ? closedSections.filter(x => x !== p) : [...closedSections, p]
    setClosedSections(next)
    writeClosedSections(next)
  }
  const profileTitle = (p: string) => bots?.find(b => b.name.toLowerCase() === p)?.title ?? p
  // Show in All: the profiles All lists, kept by the names left out (the phone's sheet from the All chip).
  const [leftOut, setLeftOut] = useState<string[]>(readLeftOut)
  const [showInAll, setShowInAll] = useState(false)
  const botNames = useMemo(() => (bots ?? []).map(b => b.name), [bots])
  const allLeftOut = canGroup ? leftOut : []
  const includeInAll = (name: string, on: boolean) => {
    const next = on ? leftOut.filter(p => p.toLowerCase() !== name.toLowerCase()) : [...leftOut, name]
    setLeftOut(next)
    writeLeftOut(next)
  }
  const filterContext = useMemo(
    () => (marks ? { marks, running: runningIds, waiting: waitingIds, done: isDone ?? (() => false), underSource } : null),
    [marks, runningIds, waitingIds, isDone]
  )
  // The chats the list shows before any filter: the profile chosen's, or All's.
  const inShown = useMemo(
    () =>
      otherProfile
        ? []
        : profile
          ? (rows ?? []).filter(r => sameProfile(r, profile))
          : (rows ?? []).filter(r => shownInAll(r.profile, botNames, allLeftOut)),
    [rows, profile, otherProfile, botNames, allLeftOut]
  )
  // The Sources the menu offers: the ones the chats shown come from, so none lists nothing.
  const shownSources = useMemo(() => sourcesIn(inShown), [inShown])
  // What applies: without stars and read state nothing filters; In progress and Done sit out on a plugin that keeps
  // no Done marks, and a source none of the chats shown comes from sits out, rather than empty the list.
  const active = useMemo(
    () =>
      marks
        ? selection.filter(k => (isSourceKey(k) ? shownSources.length > 1 && shownSources.includes(k.slice(7) as ChatSource) : (k !== 'inprogress' && k !== 'done') || !!isDone))
        : [],
    [marks, selection, shownSources, isDone]
  )
  // A status, Starred, In progress or Done is a lookup, not a browse: every match, flat; a source alone is still a browse.
  const looksUp = active.some(k => !isSourceKey(k))
  // Pinned rows move while the list shows every pinned chat: not during a search or under a filter, nor grouped by profile.
  const canReorder = !query.trim() && !active.length
  // Only grouped by profile does the open chat change what's listed (its section keeps it past the cap), so a click elsewhere doesn't list again.
  const groupOpenId = grouped ? selectedId : null
  const { sections, listed, allowed, pinnedSection, nesting, hidesEverything } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const inProfile = otherProfile
      ? []
      : profile
      ? (rows ?? []).filter(r => sameProfile(r, profile))
      : allLeftOut.length
        ? (rows ?? []).filter(r => shownInAll(r.profile, botNames, allLeftOut))
        : (rows ?? [])
    const selected = marks && active.length ? selectRows(inProfile, active, filterContext!) : inProfile
    // A search looks through every chat, a hidden project's too; Needs approval keeps every wait, as the amber dot counts them.
    const listsWaits = active.includes('waiting')
    const sourced =
      q || !hiddenProjects.size
        ? selected
        : selected.filter(r => !hidesChat(projectOf(projectsIndex, r), r.pinned, listsWaits && waitingIds.has(r.id), hiddenProjects))
    const filtered = q ? sourced.filter(r => searchText(r).includes(q)) : sourced
    // Another combined host's chats, only in All with no filter: found by title or by the host's name. Another
    // dashboard's face shows only its profile's, and none of this dashboard's.
    const others = otherProfile
      ? otherRows.filter(r => r.host === otherProfile.host && sameProfile(r, otherProfile.name) && (!q || `${r.title} ${r.preview ?? ''}`.toLowerCase().includes(q)))
      : !profile && !active.length
        ? otherRows.filter(r => !q || `${r.title} ${r.preview ?? ''} ${badgeFor?.(r.host)?.name ?? ''}`.toLowerCase().includes(q))
        : []
    const sections = sectionRows(grouped ? filtered : [...filtered, ...others])
    // The Pinned section in the person's order, arranged from every pinned chat the profile shown has.
    const pinned = arrangePinned(sectionRows(inProfile.filter(r => r.pinned))[0]?.rows ?? [], pinOrder.orders)
    const shown = new Set(filtered.map(r => r.id))
    const arranged: ListSection[] = grouped
      ? profileGroups(
          filtered,
          includedInAll(botNames, allLeftOut),
          {
            // A search or a status or Starred filter lists every match; a source filter is still a browse.
            capped: !q && !looksUp,
            showsAll: p => showingAll.has(p),
            openId: groupOpenId,
            pinnedOrder: list => arrangePinned(list, pinOrder.orders)
          }
        ).map(group => ({ title: profileTitle(group.profile), rows: group.rows, profile: group.profile, hidden: group.hidden, extra: group.extra }))
      : sections.map(section => (section.rows[0]?.pinned ? { ...section, rows: pinned.filter(r => shown.has(r.id)) } : section))
    if (grouped) {
      // A section per other host, after this host's profiles.
      for (const host of [...new Set(others.map(r => r.host))]) {
        const key = `host:${host}`
        const all = others.filter(r => r.host === host).sort((a, b) => (b.activeAt ?? 0) - (a.activeAt ?? 0))
        const capped = !q && !showingAll.has(key) && all.length > OTHER_HOST_ROWS
        arranged.push({
          title: badgeFor?.(host)?.name ?? host,
          rows: capped ? all.slice(0, OTHER_HOST_ROWS) : all,
          profile: key,
          hidden: capped ? all.length - OTHER_HOST_ROWS : 0,
          extra: !capped && !q && all.length > OTHER_HOST_ROWS ? all.length - OTHER_HOST_ROWS : 0
        })
      }
    }
    // A job under the call or chat it came from, while the list is a browse: a search or a filter lists every row flat (the phone's nests).
    const nesting = !q && !active.length ? nestRows(arranged.flatMap(section => section.rows.filter(r => !isOther(r)))) : EMPTY_NESTING
    const nestedOut = nesting.nested.size
      ? arranged
          .map(section => ({ ...section, rows: section.rows.filter(r => isOther(r) || !nesting.nested.has(r.id)) }))
          .filter(section => section.profile !== undefined || section.rows.length)
      : arranged
    return {
      sections: nestedOut,
      listed: filtered,
      allowed: active.length ? sourced : undefined,
      pinnedSection: pinned,
      nesting,
      hidesEverything: !filtered.length && selected.length > 0 && !q
    }
  }, [rows, query, profile, marks, active, looksUp, filterContext, pinOrder.orders, grouped, showingAll, groupOpenId, bots, botNames, allLeftOut, otherRows, otherProfile, badgeFor, hiddenProjects, projectsIndex, waitingIds])
  /**
   * The pins a pinned row moves among: the Pinned section, or grouped by
   * profile its own section's, so a move there orders only that profile's
   * pins, as the phone's section does.
   */
  const pinsBeside = (row: ChatRow): ChatRow[] => {
    if (!grouped) return pinnedSection
    return sections.find(section => section.profile !== undefined && section.rows.some(r => r.id === row.id))?.rows.filter(r => r.pinned) ?? []
  }
  const movePinned = (row: ChatRow, to: number) => {
    const pins = pinsBeside(row)
    const from = pins.findIndex(r => r.id === row.id)
    const next = moved(pins, from, to)
    if (next !== pins) pinOrder.reorder(next)
  }
  const [expandedNests, setExpandedNests] = useState<Set<string>>(readExpandedNests)
  // The open chat's parents stay open, so its row shows.
  const openAncestors = useMemo(() => ancestorsOf(nesting, selectedId), [nesting, selectedId])
  const toggleNest = (id: string, open: boolean) =>
    setExpandedNests(current => {
      const next = new Set(current)
      if (open) next.add(id)
      else next.delete(id)
      writeExpandedNests(next)
      return next
    })
  type Item = { row: ChatRow; depth: number } | { nest: ChatRow; depth: number; open: boolean }
  const withNests = (list: ChatRow[]): Item[] => {
    if (!nesting.children.size) return list.map(row => ({ row, depth: 0 }))
    const out: Item[] = []
    const walk = (row: ChatRow, depth: number) => {
      out.push({ row, depth })
      if (!nesting.children.has(row.id)) return
      const open = expandedNests.has(row.id) || openAncestors.has(row.id)
      out.push({ nest: row, depth, open })
      if (open) for (const child of nesting.children.get(row.id)!) walk(child, depth + 1)
    }
    for (const row of list) walk(row, 0)
    return out
  }
  const [dragging, setDragging] = useState<string | null>(null)
  const [dropAt, setDropAt] = useState<{ id: string; after: boolean } | null>(null)
  // In messages: Hermes' full-text search, on the profile shown or every profile the list holds.
  // Another dashboard's face searches none of this one's (its chats aren't searchable from here).
  const searchProfiles = useMemo(
    () =>
      otherProfile
        ? []
        : profile
        ? [profile]
        : [...new Set((rows ?? []).filter(r => shownInAll(r.profile, botNames, allLeftOut)).map(r => r.profile || 'default'))].sort().slice(0, MAX_SEARCH_PROFILES),
    [rows, profile, otherProfile, botNames, allLeftOut]
  )
  const content = useContentSearch(query, rows ? searchProfiles : [], searchScope, searchHttp)
  const contentMatches = useMemo(
    () => (content.hits.length ? contentRows(content.hits, listed, rows ?? [], allowed).filter(m => !profile || sameProfile(m.row, profile)) : []),
    [content.hits, listed, rows, allowed, profile]
  )
  // The column: shown with two or more profiles, every combined dashboard's counted, as the phone's strip is.
  const tiles = useMemo<MixedTile[]>(
    () => profileTiles ?? (bots ?? []).map(bot => ({ key: bot.name, host: '', bot, own: true })),
    [profileTiles, bots]
  )
  const showColumn = !!onProfile && tiles.length > 1
  // Each of this dashboard's profiles: whether it has unread chats, and how many wait on the person.
  const profileMarks = useMemo(() => {
    const unread = new Set<string>()
    const waits = new Map<string, number>()
    for (const row of rows ?? []) {
      const p = (row.profile ?? 'default').toLowerCase()
      if (waitingIds.has(row.id)) waits.set(p, (waits.get(p) ?? 0) + 1)
      else if (marks && isUnread(marks, row)) unread.add(p)
    }
    return { unread, waits }
  }, [rows, waitingIds, marks])
  // The Filter menu's counts: each choice beside the other groups' choices, alone in its own (the phone's facet).
  const choice = (key: ChatFilterKey, label: string): FilterChoice => ({
    key,
    label,
    count: filterOpen && filterContext ? selectRows(inShown, facetOf(active, key), filterContext).length : 0
  })
  // The empty list's words: the phone's emptyStateFilter, Starred first, then In progress or Done, then a status.
  const emptyFilter =
    (active.includes('starred') ? 'starred' : null) ??
    active.find(k => k === 'inprogress' || k === 'done') ??
    active.find(k => k === 'unread' || k === 'running' || k === 'waiting') ??
    null
  // Why chats are missing, said above the rows in place of a misleading "No chats yet." (desktop#400):
  // the profiles shown whose chats Hermes couldn't read, and a list that holds the gateway's own profile's
  // chats alone, where only that profile ('default', as its rows go unnamed) has any to show.
  const unreadShown = otherProfile
    ? []
    : unread.filter(u => (profile ? sameName(u.profile, profile) : shownInAll(u.profile, botNames, allLeftOut)))
  const othersMissing =
    ownProfileOnly && !otherProfile && (profile ? !sameName(profile, 'default') : includedInAll(botNames, allLeftOut).length > 1)
  // When a note above says why nothing is listed, the empty list's own words would only mislead.
  const explained = unreadShown.length > 0 || othersMissing
  // The chip: the filters chosen, or All, then what Filter › Projects hides (Home by name, since its chats are in no project).
  const hiddenOthers = [...hiddenProjects].filter(id => id !== NO_PROJECT).length
  const chipParts = [
    ...active.map(k => (isSourceKey(k) ? sourceName(k.slice(7) as ChatSource) : FILTER_LABELS[k]())),
    ...(hiddenProjects.has(NO_PROJECT) ? [homeTitle ? t('{name} hidden', { name: homeTitle }) : t('Chats outside projects hidden')] : []),
    ...(hiddenOthers ? [hiddenOthers === 1 ? t('1 project hidden') : t('{count} projects hidden', { count: hiddenOthers })] : [])
  ]
  const waitingShown = useMemo(() => inShown.filter(r => waitingIds.has(r.id)).length, [inShown, waitingIds])
  const botName = (row: ChatRow) => {
    if (!row.profile || row.profile === 'default' || profile) return null
    return bots?.find(b => b.name === row.profile)?.title ?? row.profile
  }

  // Bring the open chat into view once its row is there: a chat just made
  // from the composer shows up a moment after its first send.
  const scroller = useRef<HTMLDivElement>(null)
  const revealed = useRef<string | null>(null)
  const present = !!selectedId && sections.some(s => s.rows.some(r => r.id === selectedId))
  useEffect(() => {
    if (!present || revealed.current === selectedId) return
    revealed.current = selectedId
    scroller.current?.querySelector('.row[aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [present, selectedId])

  // What a row's handlers read, so they keep one identity and memoized rows skip a redraw (desktop#199).
  const latest = useRef({ onSelect, dropAt, dragging, pinsBeside, movePinned, finishRename })
  latest.current = { onSelect, dropAt, dragging, pinsBeside, movePinned, finishRename }
  const rowHandlers = useMemo<RowHandlers>(
    () => ({
      select: row => latest.current.onSelect(row),
      dragStart: (row, e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', row.title)
        setDragging(row.id)
      },
      dragOver: (row, e) => {
        e.preventDefault()
        const box = e.currentTarget.getBoundingClientRect()
        const after = e.clientY > box.top + box.height / 2
        const at = latest.current.dropAt
        if (at?.id !== row.id || at.after !== after) setDropAt({ id: row.id, after })
      },
      drop: (row, e) => {
        e.preventDefault()
        const { dragging, dropAt, pinsBeside, movePinned } = latest.current
        const pins = pinsBeside(row)
        const moving = pins.find(r => r.id === dragging)
        const from = pins.findIndex(r => r.id === dragging)
        let to = pins.findIndex(r => r.id === row.id) + (dropAt?.after ? 1 : 0)
        if (from < to) to -= 1
        if (moving) movePinned(moving, to)
        setDragging(null)
        setDropAt(null)
      },
      dragEnd: () => {
        setDragging(null)
        setDropAt(null)
      },
      menuAt: (row, x, y) => setMenu({ row, x, y }),
      toggleMenu: (row, x, y) => setMenu(m => (m?.row.id === row.id ? null : { row, x, y })),
      rename: (id, title) => setRenaming({ id, title }),
      finishRename: save => latest.current.finishRename(save)
    }),
    []
  )
  const today = startOfDay(Date.now())

  return (
    <section className={`chatlist${showColumn ? ' has-column' : ''}`} aria-label={t('Chats')}>
      {showColumn ? (
        <div className="profile-column-wrap">
          <ProfileColumn
            tiles={tiles}
            profile={profile}
            otherProfile={otherProfile}
            onProfile={onProfile!}
            onOther={onOtherProfile}
            badgeFor={tileBadge}
            unread={tile => tile.own && profileMarks.unread.has(tile.bot.name.toLowerCase())}
            waits={tile => (tile.own ? (profileMarks.waits.get(tile.bot.name.toLowerCase()) ?? 0) : (otherWaits?.(tile) ?? 0))}
            onShowInAll={canGroup ? () => setShowInAll(true) : undefined}
            onEditProfile={onEditProfile}
          />
          {showInAll && bots ? (
            <ShowInAll
              bots={bots}
              leftOut={leftOut}
              onInclude={includeInAll}
              groupByProfile={groupByProfile}
              onGroupByProfile={on => {
                setGroupByProfile(on)
                writeGroupByProfile(on)
              }}
              onClose={() => setShowInAll(false)}
            />
          ) : null}
        </div>
      ) : null}
      <div className="chatlist-main">
      <div className="chatlist-head">
        <h1>{t('Chats')}</h1>
        {onPinnedReplies ? (
          <button className="round" aria-label={t('Pinned replies')} title={t('Pinned replies')} onClick={onPinnedReplies}>
            <Icon name="pin" />
          </button>
        ) : null}
        {onProjects ? (
          <button className="round" aria-label={t('Projects')} title={t('Projects')} onClick={onProjects}>
            <Icon name="folder" />
          </button>
        ) : null}
        <button
          className="round"
          aria-label={t('New chat')}
          title={window.conduit.platform === 'darwin' ? t('New chat (⌘N)') : t('New chat (Ctrl+N)')}
          onClick={onNewChat}
        >
          <Icon name="plus" />
        </button>
        {onHide ? <HideListButton onHide={onHide} /> : null}
      </div>
      <div className="chatlist-searchrow">
        <label className="chatlist-search">
          <Icon name="search" />
          <span className="sr-only">{t('Search chats')}</span>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('Search chats')} />
        </label>
        {/* Another dashboard's chats aren't filtered from here, so its face shows no Filter menu. */}
        {marks && !otherProfile ? (
          <ChatFilterMenu
            selection={active}
            allCount={inShown.length}
            starred={choice('starred', FILTER_LABELS.starred())}
            statuses={STATUS_CHOICES.map(key => choice(key, FILTER_LABELS[key]()))}
            progress={isDone ? PROGRESS_CHOICES.map(key => choice(key, FILTER_LABELS[key]())) : []}
            sources={shownSources.length > 1 ? shownSources.map(kind => choice(`source:${kind}`, sourceName(kind))) : []}
            waiting={waitingShown}
            onToggle={(key, on) => setSelection(settingFilter(selection, key, on))}
            onClear={() => setSelection([])}
            groupByProfile={groupByProfile}
            onGroupByProfile={
              canGroup
                ? on => {
                    setGroupByProfile(on)
                    writeGroupByProfile(on)
                  }
                : undefined
            }
            open={filterOpen}
            onOpen={setFilterOpen}
            onNeedsYou={onNeedsYou}
            projects={projectChoices}
          />
        ) : null}
      </div>
      {!otherProfile && (active.length || hiddenProjects.size) ? (
        <div className="filter-active">
          <button className="filter-active-chip" onClick={() => setFilterOpen(true)}>
            {chipParts.join(', ')}
          </button>
          <button
            className="filter-active-clear"
            aria-label={t('Clear')}
            title={t('Clear')}
            onClick={() => {
              setSelection([])
              if (hiddenProjects.size) setHiddenProjects([])
            }}
          >
            <Icon name="close" />
          </button>
        </div>
      ) : null}
      <div className="chatlist-scroll" ref={scroller}>
        {rows === null && !error ? <div className="empty">{t('Loading chats…')}</div> : null}
        {error ? <div className="empty">{t('Couldn’t load your chats: {error}', { error })}</div> : null}
        {othersMissing ? <div className="empty">{t('This version of Hermes lists the chats of one profile only. Update it on the host to see every profile’s chats.')}</div> : null}
        {unreadShown.map(u => (
          <div key={u.profile} className="empty">
            {u.corrupt
              ? t('Hermes couldn’t read {profile}’s chats: its chat history on the host is damaged.', { profile: u.profile })
              : u.error
                ? t('Hermes couldn’t read {profile}’s chats: {error}', { profile: u.profile, error: u.error })
                : t('Hermes couldn’t read {profile}’s chats.', { profile: u.profile })}
          </div>
        ))}
        {rows && sections.length === 0 && !query.trim() && !error && !(explained && emptyFilter === null) ? (
          <div className="empty">
            {hidesEverything && hiddenProjects.size
              ? t('The chats here are hidden in Filter > Projects. Tick them again to show them.')
              : emptyFilter === 'starred'
              ? t('No starred chats. Star one from its menu to keep it here.')
              : emptyFilter === 'unread'
                ? t('No unread chats.')
                : emptyFilter === 'running'
                  ? t('Nothing is running.')
                  : emptyFilter === 'waiting'
                    ? t('No chat is waiting on your answer.')
                    : emptyFilter === 'inprogress'
                      ? t('Every chat here is marked done.')
                      : emptyFilter === 'done'
                        ? t('No done chats. Mark one done from its menu.')
                        : t('No chats yet. Start one with the + button.')}
          </div>
        ) : null}
        {sections.map(section => (
          <div key={section.profile ?? section.title} role="group" aria-label={section.title}>
            {section.profile ? (
              <button className="sect sect-profile" aria-expanded={!closedSections.includes(section.profile)} onClick={() => toggleSection(section.profile!)}>
                <Icon name="chevronDown" className={closedSections.includes(section.profile) ? 'closed' : undefined} />
                {section.profile.startsWith('host:') && badgeFor?.(section.profile.slice(5)) ? <HostBadgeMark badge={badgeFor(section.profile.slice(5))!} /> : null}
                {section.title}
              </button>
            ) : (
              <div className="sect">{section.title}</div>
            )}
            {withNests(section.profile && closedSections.includes(section.profile) ? [] : section.rows).map(item => {
              if ('nest' in item) {
                const below = descendants(nesting, item.nest)
                const summary = nestSummary(
                  below,
                  r => runningIds.has(r.id),
                  r => waitingIds.has(r.id)
                )
                return (
                  <button
                    key={`nest:${item.nest.id}`}
                    className="nest-toggle"
                    style={{ paddingInlineStart: `${12 + item.depth * 16}px` }}
                    aria-expanded={item.open}
                    aria-label={`${item.nest.title}, ${summary}`}
                    onClick={() => toggleNest(item.nest.id, !item.open)}
                  >
                    <Icon name="chevronDown" className={item.open ? undefined : 'closed'} />
                    {summary}
                  </button>
                )
              }
              const row = item.row
              const depth = item.depth
              // A closed nest's unread reply shows on its parent, so it never hides.
              const nestUnread =
                !!marks && nesting.children.has(row.id) && !(expandedNests.has(row.id) || openAncestors.has(row.id)) && descendants(nesting, row).some(r => isUnread(marks, r) && r.id !== selectedId)
              if (isOther(row)) {
                const badge = badgeFor?.(row.host) ?? null
                return (
                  <div
                    key={`${row.host}\n${row.id}`}
                    className="row-wrap"
                    onContextMenu={
                      onOpenInWindow
                        ? e => {
                            e.preventDefault()
                            setMenu({ row, x: e.clientX, y: e.clientY })
                          }
                        : undefined
                    }
                  >
                    {/* Open in place (docked in the chat pane), it's marked as this dashboard's open chat is. */}
                    <button className="row" aria-current={row.id === selectedId ? 'true' : undefined} onClick={() => onOpenOther?.(row)}>
                      <span className="row-top">
                        <span className="row-title">
                          {badge ? <HostBadgeMark badge={badge} /> : null}
                          {row.title}
                        </span>
                        <span className="meta row-time">{timeLabel(row.activeAt, today)}</span>
                      </span>
                      {row.preview || (row.profile && row.profile !== 'default') ? (
                        <span className="meta">
                          {row.profile && row.profile !== 'default' ? `${row.profile} · ` : ''}
                          {row.preview ?? ''}
                        </span>
                      ) : null}
                    </button>
                  </div>
                )
              }
              const waits = waitingIds.has(row.id)
              const running = !waits && runningIds.has(row.id)
              const selected = row.id === selectedId
              return (
                <ChatRowItem
                  key={row.id}
                  row={row}
                  depth={depth}
                  today={today}
                  selected={selected}
                  waits={waits}
                  running={running}
                  status={running && selected ? runningStatus : undefined}
                  unread={(!!marks && isUnread(marks, row) && !selected) || nestUnread}
                  starred={!!marks && isStarred(marks, row)}
                  done={!!isDone?.(row)}
                  muted={!!muteOf?.(row)}
                  botName={botName(row)}
                  draggable={canReorder && row.pinned && !renaming}
                  dragging={dragging === row.id}
                  drop={dropAt?.id === row.id ? (dropAt.after ? 'after' : 'before') : null}
                  acceptsDrop={!!dragging && row.pinned && pinsBeside(row).some(r => r.id === dragging)}
                  renameTitle={renaming?.id === row.id ? renaming.title : null}
                  hasActions={hasActions}
                  on={rowHandlers}
                />
              )
            })}
            {section.profile && !closedSections.includes(section.profile) && (section.hidden || section.extra) ? (
              <button
                className="row show-more"
                onClick={() =>
                  setShowingAll(current => {
                    const next = new Set(current)
                    if (section.hidden) next.add(section.profile!)
                    else next.delete(section.profile!)
                    return next
                  })
                }
              >
                {section.hidden ? t('Show {count} more', { count: section.hidden }) : t('Show fewer')}
              </button>
            ) : null}
          </div>
        ))}
        {query.trim() && (contentMatches.length || content.searching) ? (
          <div role="group" aria-label={t('In messages')}>
            <div className="sect content-sect">
              {t('In messages')}
              {content.searching ? (
                <span className="content-spinner" role="status" aria-label={t('Searching messages')}>
                  <Icon name="spinner" />
                </span>
              ) : null}
            </div>
            {contentMatches.map(match => (
              <div key={match.key} className="row-wrap">
                <button className="row" aria-current={match.row.id === selectedId ? 'true' : undefined} onClick={() => onSelect(match.row)}>
                  <span className="row-top">
                    <span className="row-title">{match.row.title || t('Untitled conversation')}</span>
                    <span className="meta row-time">{timeLabel(match.row.activeAt, today)}</span>
                  </span>
                  <span className="meta content-snippet">
                    {botName(match.row) ? `${botName(match.row)} · ` : ''}
                    {match.snippet.map((run, i) => (run.match ? <mark key={i}>{run.text}</mark> : <span key={i}>{run.text}</span>))}
                  </span>
                </button>
              </div>
            ))}
          </div>
        ) : null}
        {rows && query.trim() && !sections.length && !contentMatches.length && !content.searching ? (
          <div className="empty">{t('No matching conversations')}</div>
        ) : null}
      </div>
      <UpdatingCapsule shown={!!updating && sections.length > 0} />
      {menu ? (
        <div
          className="host-menu row-menu"
          role="menu"
          style={{
            left: Math.min(menu.x, window.innerWidth - 220),
            top: Math.max(8, Math.min(menu.y, window.innerHeight - (moving ? 52 + 34 * Math.max(1, moving.length) : 220)))
          }}
        >
          {isOther(menu.row) ? (
            // Another dashboard's chat: its window, with no switch; everything else opens through a switch.
            <button role="menuitem" onClick={() => onOpenInWindow?.(menu.row)}>
              {windowIds?.includes(menu.row.id) ? t('Show Window') : t('Open in New Window')}
            </button>
          ) : muting && onMute ? (
            <>
              <button
                role="menuitem"
                onClick={e => {
                  e.stopPropagation()
                  setMuting(false)
                }}
              >
                ‹ {t('Mute Notifications')}
              </button>
              {MUTE_CHOICES.map(choice => (
                <button key={choice.key} role="menuitem" onClick={() => onMute(menu.row, choice.seconds)}>
                  {choice.label()}
                </button>
              ))}
            </>
          ) : moving !== false ? (
            <>
              <button
                role="menuitem"
                onClick={e => {
                  e.stopPropagation()
                  setMoving(false)
                }}
              >
                ‹ {t('Move to Project')}
              </button>
              {moving === null ? <div className="menu-note">{t('Loading projects…')}</div> : null}
              {moving && !moving.length ? <div className="menu-note">{t('No Projects')}</div> : null}
              {moving?.map(target => (
                <button key={target.id} role="menuitem" title={target.path} onClick={() => onMove?.(menu.row, target)}>
                  {target.title}
                </button>
              ))}
            </>
          ) : (
            <>
              {onOpenBeside && canOpenBeside?.(menu.row) ? (
                <button role="menuitem" onClick={() => onOpenBeside(menu.row)}>
                  {t('Open Beside')}
                </button>
              ) : null}
              {onOpenInWindow ? (
                <button role="menuitem" onClick={() => onOpenInWindow(menu.row)}>
                  {windowIds?.includes(menu.row.id) ? t('Show Window') : t('Open in New Window')}
                </button>
              ) : null}
              {onPin ? (
                <button
                  role="menuitem"
                  onClick={() => {
                    if (menu.row.pinned) pinOrder.drop(menu.row)
                    onPin(menu.row)
                  }}
                >
                  {menu.row.pinned ? t('Unpin') : t('Pin')}
                </button>
              ) : null}
              {canReorder && menu.row.pinned && pinsBeside(menu.row).length > 1
                ? (() => {
                    const pins = pinsBeside(menu.row)
                    const at = pins.findIndex(r => r.id === menu.row.id)
                    return (
                      <>
                        {at > 0 ? (
                          <button role="menuitem" onClick={() => movePinned(menu.row, at - 1)}>
                            {t('Move Earlier')}
                          </button>
                        ) : null}
                        {at >= 0 && at < pins.length - 1 ? (
                          <button role="menuitem" onClick={() => movePinned(menu.row, at + 1)}>
                            {t('Move Later')}
                          </button>
                        ) : null}
                      </>
                    )
                  })()
                : null}
              {onStar && marks ? (
                <button role="menuitem" onClick={() => onStar(menu.row)}>
                  {isStarred(marks, menu.row) ? t('Unstar') : t('Star')}
                </button>
              ) : null}
              {onDone && isDone ? (
                <button role="menuitem" onClick={() => onDone(menu.row)}>
                  {isDone(menu.row) ? t('Mark as Not Done') : t('Mark as Done')}
                </button>
              ) : null}
              {onMute && muteOf ? (
                (() => {
                  const mute = muteOf(menu.row)
                  return mute ? (
                    <button role="menuitem" onClick={() => onMute(menu.row, 0)}>
                      {mute.until === null
                        ? t('Unmute Notifications')
                        : t('Unmute (Muted Until {time})', { time: muteEnd(mute.until) })}
                    </button>
                  ) : (
                    <button
                      role="menuitem"
                      aria-haspopup="menu"
                      onClick={e => {
                        e.stopPropagation()
                        setMuting(true)
                      }}
                    >
                      {t('Mute Notifications')} ›
                    </button>
                  )
                })()
              ) : null}
              {onToggleRead && marks && menu.row.id !== selectedId ? (
                <button role="menuitem" onClick={() => onToggleRead(menu.row)}>
                  {isUnread(marks, menu.row) ? t('Mark as read') : t('Mark as unread')}
                </button>
              ) : null}
              {onRename ? (
                <button role="menuitem" onClick={() => setRenaming({ id: menu.row.id, title: menu.row.title })}>
                  {t('Rename')}
                </button>
              ) : null}
              {canMove ? (
                <button
                  role="menuitem"
                  aria-haspopup="menu"
                  onClick={e => {
                    e.stopPropagation()
                    void startMove(menu.row)
                  }}
                >
                  {t('Move to Project')} ›
                </button>
              ) : null}
              {onDelete ? (
                <button role="menuitem" className="danger" onClick={() => onDelete(menu.row)}>
                  {t('Delete')}
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
      </div>
    </section>
  )
}

/**
 * Show in All, from the All chip (right-click, or a click while All is
 * already chosen): which profiles All lists, and Group by profile. The last
 * profile left in can't be turned off, so All never lists nothing.
 */
function ShowInAll({
  bots,
  leftOut,
  onInclude,
  groupByProfile,
  onGroupByProfile,
  onClose
}: {
  bots: Bot[]
  leftOut: string[]
  onInclude: (name: string, on: boolean) => void
  groupByProfile: boolean
  onGroupByProfile: (on: boolean) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])
  const included = includedInAll(
    bots.map(b => b.name),
    leftOut
  )
  const isIn = (name: string) => included.some(p => p.toLowerCase() === name.toLowerCase())
  return (
    <div className="host-menu show-in-all" role="dialog" aria-label={t('Show in All')} ref={ref}>
      <strong>{t('Show in All')}</strong>
      <span className="meta">{t("All lists these profiles' chats together, newest first. A new chat asks which profile to use.")}</span>
      {bots.map(bot => (
        <label key={bot.name} className="show-in-all-row">
          <BotAvatar bot={bot} size={22} />
          <span className="show-in-all-name">{bot.title}</span>
          <input
            type="checkbox"
            checked={isIn(bot.name)}
            disabled={isIn(bot.name) && included.length === 1}
            aria-label={t('{name} profile', { name: bot.title })}
            onChange={e => onInclude(bot.name, e.target.checked)}
          />
        </label>
      ))}
      <label className="show-in-all-row group">
        <span className="show-in-all-name">{t('Group by profile')}</span>
        <input type="checkbox" checked={groupByProfile} onChange={e => onGroupByProfile(e.target.checked)} />
      </label>
    </div>
  )
}

interface RowHandlers {
  select: (row: ChatRow) => void
  dragStart: (row: ChatRow, e: React.DragEvent<HTMLDivElement>) => void
  dragOver: (row: ChatRow, e: React.DragEvent<HTMLDivElement>) => void
  drop: (row: ChatRow, e: React.DragEvent<HTMLDivElement>) => void
  dragEnd: () => void
  menuAt: (row: ChatRow, x: number, y: number) => void
  toggleMenu: (row: ChatRow, x: number, y: number) => void
  rename: (id: string, title: string) => void
  finishRename: (save: boolean) => void
}

/**
 * One chat's row. Memoized on plain values and the row itself, which keeps
 * its object while a refresh brings nothing new for it (keepSameRows), so a
 * click, a keystroke in the search or a running tick redraws only the rows
 * it changes (desktop#199).
 */
const ChatRowItem = memo(function ChatRowItem({
  row,
  depth,
  today,
  selected,
  waits,
  running,
  status,
  unread,
  starred,
  done,
  muted,
  botName,
  draggable,
  dragging,
  drop,
  acceptsDrop,
  renameTitle,
  hasActions,
  on
}: {
  row: ChatRow
  depth: number
  /** Today's start, so the time reads again when the day turns. */
  today: number
  selected: boolean
  waits: boolean
  running: boolean
  status?: string
  unread: boolean
  starred: boolean
  done: boolean
  muted: boolean
  botName: string | null
  draggable: boolean
  dragging: boolean
  drop: 'before' | 'after' | null
  acceptsDrop: boolean
  renameTitle: string | null
  hasActions: boolean
  on: RowHandlers
}) {
  return (
    <div
      style={depth ? { marginInlineStart: `${14 + (depth - 1) * 16}px` } : undefined}
      className={`row-wrap${depth ? ' nested' : ''}${dragging ? ' dragging' : ''}${drop ? (drop === 'after' ? ' drop-after' : ' drop-before') : ''}`}
      draggable={draggable ? true : undefined}
      onDragStart={draggable ? e => on.dragStart(row, e) : undefined}
      onDragOver={acceptsDrop ? e => on.dragOver(row, e) : undefined}
      onDrop={acceptsDrop ? e => on.drop(row, e) : undefined}
      onDragEnd={on.dragEnd}
      onContextMenu={
        hasActions
          ? e => {
              e.preventDefault()
              on.menuAt(row, e.clientX, e.clientY)
            }
          : undefined
      }
    >
      {renameTitle !== null ? (
        <input
          className="row-rename"
          aria-label={t('Rename')}
          autoFocus
          value={renameTitle}
          onChange={e => on.rename(row.id, e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') on.finishRename(true)
            else if (e.key === 'Escape') on.finishRename(false)
          }}
          onBlur={() => on.finishRename(true)}
        />
      ) : (
        <button className={done ? 'row done' : 'row'} aria-current={selected ? 'true' : undefined} onClick={() => on.select(row)}>
          <span className="row-top">
            <span className="row-title">
              {unread ? <span className="unread-dot" role="img" aria-label={t('Unread')} /> : null}
              {row.pinned ? <Icon name="pin" className="row-pin" /> : null}
              {starred ? <Icon name="star" className="row-pin row-star" /> : null}
              {done ? <Icon name="check" className="row-pin row-done" aria-label={t('Done')} /> : null}
              {muted ? (
                <span role="img" aria-label={t('Notifications muted')}>
                  <Icon name="bellSlash" className="row-pin" />
                </span>
              ) : null}
              {row.title}
            </span>
            {row.sourceKind && row.sourceKind !== 'chat' ? <span className="row-source">{sourceName(row.sourceKind)}</span> : null}
            <span className="meta row-time">{timeLabel(row.activeAt, today)}</span>
          </span>
          {waits ? (
            <span className="running waiting">{t('Needs approval')}</span>
          ) : running ? (
            <span className="running">
              {t('Running')}
              {status ? ` · ${status}` : ''}
            </span>
          ) : row.preview || botName ? (
            <span className="meta">
              {botName ? `${botName} · ` : ''}
              {row.preview ?? ''}
            </span>
          ) : null}
        </button>
      )}
      {hasActions && renameTitle === null ? (
        <button
          className="row-more"
          aria-label={t('More')}
          title={t('More')}
          aria-haspopup="menu"
          onClick={e => {
            e.stopPropagation()
            const box = e.currentTarget.getBoundingClientRect()
            on.toggleMenu(row, box.right, box.bottom)
          }}
        >
          <Icon name="more" />
        </button>
      ) : null}
    </div>
  )
})
