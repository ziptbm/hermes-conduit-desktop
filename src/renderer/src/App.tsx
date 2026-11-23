import { ROOM_RULES_CAPABILITY } from './state/roomChoices'
import { ROOM_LEAVE_CAPABILITY } from './state/roomCopies'
import { ROOM_FILES_CAPABILITY, ROOM_FILES_LINKED_CAPABILITY, ROOM_FILE_PICTURES_CAPABILITY } from './state/roomFiles'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type ComponentProps, type RefObject } from 'react'
import { gateway } from './gateway'
import { draftAgents, type OwnHermesBot } from './state/roomDrafts'
import { arrange, farBotFor, mixedTiles, orderedBots, useBotOrder, useMixedBotOrder, useSyncedOrder, type MixedTile } from './state/botOrder'
import { STATUS_PATH as PLUGIN_STATUS_PATH, pluginStatus } from './state/plugin'
import { hostName, rememberHostNames } from './state/hostNames'
import { HOST_NAME_MAX } from '@shared/hostNames'
import type { ConnectionStatus, HostSummary, LanguageChoice, MenuAction } from '@shared/ipc'
import { BotsHome, useReplyFace, type BotAction, type BotsDraft } from './components/BotsHome'
import { ProjectsPane } from './components/ProjectsPane'
import { ChatList, type MoveTarget } from './components/ChatList'
import { PROFILE_COLUMN_WIDTH } from './components/ProfileColumn'
import { SettingsProfileCard, settingsProfileTile } from './components/SettingsProfile'
import { Composer } from './components/Composer'
import { ModelPicker } from './components/ModelPicker'
import { ContextPanel } from './components/ContextPanel'
import { RoomView } from './components/RoomView'
import { Tasks } from './components/Tasks'
import { PulseHostChips, PulsePage } from './components/PulsePage'
import { FilesPanel } from './components/FilesPanel'
import { ColumnDivider } from './components/ColumnDivider'
import { LastCallTrace } from './components/LastCallTrace'
import { CrashReportBanner, DeviceReportsSetting } from './components/DeviceReports'
import { UpdatesSetting } from './components/UpdatesSetting'
import { GlowContext, useGlowColors } from './components/GlowColors'
import { useVoiceList, withVoice } from './state/voiceList'
import { setCatalogHost } from './state/modelCatalog'
import { setTurnSurfaceHost } from './state/turnSurface'
import { useDashboardProfiles } from './state/useDashboardProfiles'
import { setDesktopCardsHost } from './state/desktopCards'
import { setKanbanHost } from './state/useKanban'
import { setPictureHost } from './state/gatewayPictures'
import { LIST_COLUMN, PANEL_COLUMN, besideChatFits, readListHidden, readWidth, shownListWidth, shownPanelWidth, writeListHidden, writeWidth } from './state/columnWidths'
import { BesideChatPane, type BesideChat } from './components/BesideChat'
import { CHAT_WINDOW_LIMIT } from '@shared/chatWindows'
import { absolutePath, pathForDraft } from './state/workspace'
import { FileLinks } from './components/Markdown'
import { WorkLinks, type WorkLinkActions } from './components/WorkLinkCard'
import { usePulse } from './state/usePulse'
import { Icon } from './components/icons'
import { useMouseBack } from './state/mouseBack'
import { NeedsYou } from './components/NeedsYou'
import { SignIn } from './components/SignIn'
import { TitleBar } from './components/TitleBar'
import { setRunningCall, switchEndingCall } from './state/callSwitch'
import { LiveTranscript, prefillRequest, quoteRequest, revealMessage } from './components/Transcript'
import { useTranscriptValue } from './state/transcriptStore'
import { lastReplyOf } from './state/transcriptReads'
import { useRevealRow } from './state/revealRow'
import { forgetSummaries } from './state/stepSummaries'
import { WAKE_EVENT, wakeBindings, wakeChat, wakeProfiles, type WakeBinding } from './state/wakeSettings'
import { forgetChatLists } from './state/savedChatList'
import { forgetKeptAnswers, setKeptAnswersHost } from './state/keptAnswers'
import { forgetHostCaches } from './state/hostCaches'
import { keepTabs, launchPage, syncedTabs } from './state/launchTab'
import { PREFS_PATH } from './state/pinnedOrder'
import { useFollowUps, usePredictions } from './state/usePredictions'
import { SummaryHost } from './state/useStepSummaries'
import { chatDraft, composerDrafts } from './state/composerDrafts'
import { openElsewhereMessage, owner } from './state/chatTakeover'
import type { Bot } from './state/bots'
import type { ChatRow } from './state/chats'
import { forgetAvatars, setAvatarHost, useBots } from './state/useBots'
import { mentionCandidates, withMentionNote, withoutMentionNote } from './state/botMentions'
import type { Room } from './state/groups'
import { useRooms } from './state/useGroups'
import { useChat } from './state/useChat'
import { useChatList } from './state/useChatList'
import { askedInChat, chatIdsOf, unmatchedWaiting, type WaitingRow } from './state/needsYou'
import { useRequests, useWaiting } from './state/useNeedsYou'
import { clearExpired, useExpiredQuestions } from './state/expiredQuestions'
import {
  askNotification,
  inviteNotification,
  isWatching,
  newlyArrived,
  notificationsEnabled,
  requestNotification,
  setNotificationsEnabled,
  turnNotification,
  type ChatRef,
  type NotificationSpec
} from './state/notifications'
import { cleanTitle } from './state/text'
import { askerLine } from './state/presented'
import type { StagedAttachment } from './state/attachments'
import type { QuoteRequest } from './state/quote'
import { isResetCommand, looksLikeSlashCommand } from './state/slash'
import { UsagePage } from './components/UsagePage'
import { ModelsPage } from './components/ModelsPage'
import { HostActions } from './components/HostActions'
import { hostReachable, updateBanner, useHostActions } from './state/hostActions'
import { ArtifactsPanel } from './components/ArtifactsPanel'
import { CapabilitiesPage } from './components/CapabilitiesPage'
import { onAppsDirectory, type AppsRequest } from './state/appsDirectory'
import { onModelsSettings, type ModelsRequest } from './state/modelsLink'
import { MemoryPage } from './components/MemoryPage'
import { PlanDock } from './components/PlanDock'
import { AgentsDock } from './components/AgentsDock'
import { ControlDock } from './components/ControlDock'
import { useAgents } from './state/useAgents'
import { planFromChecklist } from './state/plan'
import { BotEditor } from './components/BotEditor'
import { TakeoverSettings } from './components/TakeoverSettings'
import { ConnectionActionsContext } from './components/ConnectionCardView'
import { NewBot, type NewBotDashboard } from './components/NewBot'
import { useChatDisplay } from './state/display'
import { ConfigPage } from './components/ConfigPage'
import { ConduitPluginPage } from './components/ConduitPluginPage'
import { VaultPage } from './components/VaultPage'
import { AppearancePage } from './components/AppearancePage'
import { ReadAloudVoiceSetting } from './components/ReadAloudVoiceSetting'
import { MultiplayerPage } from './components/MultiplayerPage'
import { RoomInviteCard } from './components/RoomInviteCard'
import { useRoomInvites } from './state/useRoomInvites'
import { useRoomCopies } from './state/useRoomCopies'
import { useRoomDrafts } from './state/useRoomDrafts'
import { NewGroupChat } from './components/NewGroupChat'
import { RoomDraftCard } from './components/RoomDraftCard'
import { canLeave as canLeaveCopy, copyApprovals, copyRoom, isOver } from './state/roomCopies'
import { LOOKS_READ_MS } from './state/roomLooks'
import { useRoomLooks, type PersonPicture } from './state/useRoomLooks'
import { usePresented } from './state/usePresented'
import { ConfirmPanel } from './components/ConfirmPanel'
import { everyWhileVisible } from './state/visibility'
import { ROOM_LINKS_CAPABILITY } from './state/roomLinks'
import { ChatQueueDock } from './components/ChatQueueDock'
import { AppLockSetting, LockedScreen } from './components/AppLock'
import { AskDashboardSetting, DashboardChoice } from './components/AskDashboard'
import { CombineDashboardsSetting, HostBadgeMark } from './components/CombinedDashboards'
import {
  hostBadge,
  keptStateLabel,
  showProfileAfterSwitch,
  type HostBadge,
  openRoomAfterSwitch,
  newBotAfterSwitch,
  takeNewBotAfterSwitch,
  type NewBotCarry,
  otherHostsChats,
  otherHostsWaiting,
  takeBotAfterSwitch,
  takeProfileAfterSwitch,
  keptWorkKey,
  takeRoomAfterSwitch,
  useKeptBots,
  useKeptWork,
  useKeptRooms,
  keptChatsRead,
  dropKeptCopy,
  combinedRooms,
  type OtherRoom,
  useKeptChats,
  useKeptPulse,
  pulseChips,
  useKeptHosts,
  useKeptWaiting,
  writeLastHost,
  type KeptWaitingRow,
  type OtherBot,
  type OtherChatRow
} from './state/keptHosts'
import { StepSummarySettings } from './components/StepSummarySettings'
import { PredictiveSettings } from './components/PredictiveSettings'
import { advancedSections, chatSections, workspaceSections } from './state/profileConfig'
import { canDelete, duplicateBot, writeMeta } from './state/botActions'
import { AskedQuestionBar, WorkPanel } from './components/WorkPanel'
import { PanelTabs, workCount, type PanelTab } from './components/PanelTabs'
import { ChatHeader } from './components/ChatHeader'
import { useChatCall } from './components/ChatCall'
import { screenKey } from '@shared/screenWindows'
import { useWork, useWorkSessions } from './state/useWork'
import { shownTitle, type WorkItem } from './state/work'
import { HermesCallSettings } from './components/HermesCallSettings'
import { WakePhraseSettings } from './components/WakePhraseSettings'
import { IncomingCall } from './components/IncomingCall'
import { declineOnHost, useRings, type Ring } from './state/rings'
import { VoiceModeSettings } from './components/VoiceModeSettings'
import { readAloud, readsRepliesAloud, setReadsRepliesAloud } from './state/readAloud'
import { READ_ALOUD_SPEEDS, readAloudSpeed, setReadAloudSpeed, speedLabel } from './state/classicVoice'
import { useCommands } from './state/useCommands'
import { authorityMutation, moveChat, mutateSession } from './state/chatActions'
import { branchPlan } from './state/branch'
import { ROOM_CHATS_CAPABILITY, wrapUpPrompt, type RoomChatAgent } from './state/roomChats'
import { openRoomChatHere } from './state/roomChatOpen'
import { DockedRoomFrame } from './components/DockedRoom'
import type { DockedRoomRequest } from '@shared/chatWindows'
import { parseProjects, type Project, type ProjectChat } from './state/projects'
import { useLiveStatus } from './state/liveStatus'
import { loadPins, newPin, pinsOfChat, savePins, withoutChat, type PinnedReply } from './state/pinnedReplies'
import { PinnedRepliesSheet, type PinControls } from './components/PinnedReplies'
import { loadMarks, markRead, markUnread, saveMarks, toggleStar, isUnread, type ChatMarks } from './state/chatMarks'
import { isDone, useChatDone } from './state/chatDone'
import { muteOf, muteOfTarget, turnNotifies, useChatMute, type MuteTarget } from './state/chatMute'
import { GO_TO, SCALES, applyScale, glyphs, nextScale, readScale, shortcutFor } from './state/shortcuts'
import { ShortcutsSheet } from './components/ShortcutsSheet'
import { CallTranscriptSheet } from './components/CallTranscriptSheet'
import { loadChatCalls, type CallTranscript, type ChatCall } from './state/voiceCalls'
import { LANGUAGES, LANGUAGE_NAMES, t } from '@shared/i18n'
import { ask, askText, tell } from './state/dialogs'
import { Select } from './components/Select'
import { KeptPane } from './components/KeptPane'
import { DockedChatPane, tellDockedShown, type DockedChat, type DockedFrame } from './components/DockedChat'
import { DockedPulseFrame } from './components/DockedPulse'
import { botSideScroll, ScrollPane, useBackScroll, useShownAgain } from './state/keptScroll'

/** A call's transcript while no call reads it. */

/** The host's synced preferences, for the bots' order. */
const prefsHttp = (method: 'GET' | 'PUT', path: string, body?: unknown) => gateway.http(method, path, body)

export function App() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)

  useEffect(() => {
    const off = window.conduit.onStatus(s => {
      rememberHostNames(s.hosts)
      setStatus(s)
    })
    void window.conduit.status().then(s => {
      rememberHostNames(s.hosts)
      setStatus(current => current ?? s)
    })
    return off
  }, [])

  const [adding, setAdding] = useState(false)
  // Edit Connection: the open host's address and sign-in, on the sign-in card.
  const [editing, setEditing] = useState<HostSummary | null>(null)
  // Repair Connection: a host that can't connect, changed in its place. It
  // stays up through its own sign-in's connecting until the host opens.
  const [repairing, setRepairing] = useState<HostSummary | null>(null)
  // A new host signed in (or the sign-in screen otherwise left): back to the app.
  const url = status?.url
  useEffect(() => setAdding(false), [url])
  // The launch list's combined row opens the member used last.
  useEffect(() => {
    if (url) writeLastHost(url)
  }, [url])
  // Model pickers open on the catalog kept from this host's last answer, never another host's.
  setCatalogHost(url ?? '')
  setKeptAnswersHost(url ?? '')
  setTurnSurfaceHost(url ?? '')
  setDesktopCardsHost(url ?? '')
  setKanbanHost(url ?? '')
  setPictureHost(url ?? '')
  const phase = status?.phase
  // A host Hermes signed out opens on Repair; one that opens needs none.
  useEffect(() => {
    if (phase === 'open') setRepairing(null)
    else if (phase === 'failed' && url) setRepairing(current => (current?.url === url ? current : savedHost(status?.hosts, url)))
  }, [phase, url]) // eslint-disable-line react-hooks/exhaustive-deps
  // Whether this dashboard's plugin reads ?conduit_profile= for another profile's routes, or an older one keeps ?profile=.
  useDashboardProfiles(phase, url)
  // A host signed out or removed takes the summaries of its runs of steps, and its saved chat list, with it.
  const hostList = status?.hosts?.map(h => h.url).join('\n')
  useEffect(() => {
    if (hostList === undefined) return
    forgetSummaries(hostList ? hostList.split('\n') : [])
    forgetChatLists(hostList ? hostList.split('\n') : [])
    forgetKeptAnswers(hostList ? hostList.split('\n') : [])
    forgetHostCaches(hostList ? hostList.split('\n') : [])
  }, [hostList])

  if (!status) return <div className="app" />
  const signedOut = status.phase === 'signed-out' || (status.phase === 'failed' && !status.url)
  return (
    <div className="app">
      <TitleBar
        subtitle={signedOut ? undefined : status.hostLabel}
        hosts={status.hosts}
        currentUrl={status.url}
        onSwitch={async url => {
          if (!(await switchEndingCall(hostName(url)))) return
          setRepairing(null)
          void window.conduit.switchHost(url)
        }}
      />
      {status.phase === 'locked' ? (
        <LockedScreen />
      ) : editing ? (
        <SignIn editing={editing} onCancel={() => setEditing(null)} onDone={() => setEditing(null)} />
      ) : adding ? (
        <SignIn onCancel={() => setAdding(false)} />
      ) : repairing && status.phase !== 'open' ? (
        <SignIn
          key={repairing.url}
          editing={repairing}
          repairing
          notice={status.phase === 'failed' ? status.error : undefined}
          onCancel={status.phase === 'reconnecting' ? () => setRepairing(null) : undefined}
          onDone={() => setRepairing(null)}
        />
      ) : status.phase === 'signed-out' && status.choosing && status.hosts?.length ? (
        <DashboardChoice hosts={status.hosts} onAdd={() => setAdding(true)} />
      ) : signedOut || status.phase === 'failed' ? (
        <SignIn notice={status.error} />
      ) : (
        // Each host gets a fresh window state: its chats, bots and rooms are its own.
        <SummaryHost.Provider value={status.url ?? ''}>
          <Shell
            key={status.url}
            status={status}
            onAddHost={() => void switchEndingCall(null).then(ok => ok && setAdding(true))}
            onEditHost={host => void switchEndingCall(null).then(ok => ok && setEditing(host))}
            onRepair={() => status.url && setRepairing(savedHost(status.hosts, status.url))}
          />
        </SummaryHost.Provider>
      )}
    </div>
  )
}

type Section = 'bots' | 'room' | 'chats' | 'tasks' | 'pulse' | 'artifacts' | 'needs' | 'settings'

const REOPEN_SECTION = 'conduit.reopen-section'

/** Comes back to Settings once a page that takes the whole window (Connection Setup, Add another Hermes) closes. */
function reopenSettings(): void {
  try {
    sessionStorage.setItem(REOPEN_SECTION, 'settings')
  } catch {
    // Opens on the first tab instead.
  }
}

/**
 * Settings after a language change reloads the window; else the first tab the phone's layout shows.
 */
function reopenedSection(host: string): Section {
  try {
    const saved = sessionStorage.getItem(REOPEN_SECTION)
    sessionStorage.removeItem(REOPEN_SECTION)
    if (saved === 'settings') return 'settings'
  } catch {
    // A launch.
  }
  return launchPage(host)
}

/** The saved host at `url`, or its address alone when the list doesn't have it yet. */
function savedHost(hosts: HostSummary[] | undefined, url: string): HostSummary {
  return hosts?.find(host => host.url === url) ?? { url, method: 'password' }
}

/** The connection banner's words while an update started here has Hermes away (state/hostActions' updateBanner). */
function updateAwayText(away: NonNullable<ReturnType<typeof updateBanner>>): string {
  if (away === 'updating') return `${t('Updating Hermes…')} ${t("Conduit reconnects when it's back.")}`
  if (away === 'restarting') return `${t('Hermes is restarting on the new version…')} ${t("Conduit reconnects when it's back.")}`
  if (away === 'notBack') return `${t("Hermes hasn't come back after its update.")} ${t('The update may have stopped. If Hermes stays away, start it on the host.')}`
  return `${t("Couldn't update Hermes")}. ${t('The update may have stopped. If Hermes stays away, start it on the host.')}`
}

function Shell({
  status,
  onAddHost,
  onEditHost,
  onRepair
}: {
  status: ConnectionStatus
  onAddHost: () => void
  onEditHost: (host: HostSummary) => void
  onRepair: () => void
}) {
  // Before any picture is read for this host: its pictures are kept under it.
  useState(() => setAvatarHost(status.url ?? ''))
  const connected = status.phase === 'open'
  const [section, setSection] = useState<Section>(() => reopenedSection(status.url ?? ''))
  // A bot opened from Bots home keeps the bots, and its workstreams, in the sidebar (as the iPad's Bots column
  // stays beside an open Bot Chat) until Chats in the rail asks for the sessions list.
  const [botsSide, setBotsSide] = useState(false)
  /** Chats has been open: from then on its pane stays mounted, only hidden. */
  const [chatsSeen, setChatsSeen] = useState(section === 'chats')
  if (section === 'chats' && !chatsSeen) setChatsSeen(true)
  const chatsShown = chatsSeen || section === 'chats'
  // `folder`: a new chat started in a project works there.
  /** The dashboard on screen, for a chat coming back from a window of its own. */
  const statusUrlRef = useRef(status.url)
  statusUrlRef.current = status.url
  const [selected, setSelected] = useState<{ id: string | null; profile?: string; title?: string; botChat?: boolean; folder?: string }>({ id: null })
  /**
   * Another combined dashboard's chat opened in place, in the chat pane (the
   * phone's no-switch open, stage 2). It shows over the chat it was opened
   * over: anything that opens a chat here (a row, a bot, New Chat, a call)
   * sets `selected` again, which closes it.
   */
  const [docked, setDocked] = useState<{ chat: DockedChat; over: typeof selected; fromWindow?: boolean } | null>(null)
  const dockedChat = docked && docked.over === selected ? docked.chat : null
  const dockedRef = useRef(dockedChat)
  dockedRef.current = dockedChat
  // The docked chat's frame, told from here when Chats shows or goes: the pane sits in Chats' KeptPane, which
  // doesn't render it again while another section shows, so it couldn't tell the frame itself.
  const dockedFrame = useRef<DockedFrame | null>(null)
  const dockedShown = useRef(true)
  const closeDocked = useCallback(() => setDocked(null), [])
  // A call in the docked chat, which runs it in its page on its own dashboard (Eric, 2026-11-22).
  const [dockedCalling, setDockedCalling] = useState(false)
  dockedShown.current = section === 'chats'
  const dockedHost = dockedChat?.host
  useEffect(() => {
    if (dockedHost) tellDockedShown(dockedFrame.current, section === 'chats')
  }, [section, dockedHost])
  const [projectsOpen, setProjectsOpen] = useState(false)
  const list = useChatList(connected, status.url ?? '')
  const {
    transcriptStore,
    chat,
    loading,
    error,
    send,
    stop,
    command,
    notice,
    setModel,
    setReasoning,
    setSpeed,
    setYolo,
    noteCorrection,
    takeover,
    takeOver,
    respondConnection,
    reissueConnection,
    wakeConnection,
    queue,
    cancelQueued,
    editQueued,
    sendQueuedNow,
    discardLost,
    resendLost,
    react: reactTo
  } = useChat(selected.id, selected.profile, status.sessionAuthority === true, connected, selected.botChat === true, selected.id ? undefined : selected.folder, status.url ?? '')
  // What this window shows of the transcript; the transcript itself is drawn by LiveTranscript, so a streaming
  // reply runs that, not App, once a frame (desktop#212).
  const running = useTranscriptValue(transcriptStore, state => state.running)
  const runningStatus = useTranscriptValue(transcriptStore, state => state.status)
  const transcriptPlan = useTranscriptValue(transcriptStore, state => state.plan)

  // The chat list's profile: a new chat starts in it.
  const [chatProfile, setChatProfile] = useState<string | null>(null)
  const chatProfileRef = useRef(chatProfile)
  const chatPane = useRef<HTMLElement>(null)
  chatProfileRef.current = chatProfile
  const newChat = useCallback(() => {
    setSection('chats')
    setSelected({ id: null, profile: chatProfileRef.current ?? undefined })
  }, [])

  // The Mac's menu bar sends its shortcuts; elsewhere the window reads Ctrl and the same key.
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), [])
  const [chatScale, setChatScale] = useState(readScale)
  useEffect(() => applyScale(chatScale), [chatScale])
  // A chat's apps card opens Settings > Capabilities > Browse Apps.
  const [appsRequest, setAppsRequest] = useState<AppsRequest | null>(null)
  useEffect(
    () =>
      onAppsDirectory(request => {
        setAppsRequest(request)
        setSection('settings')
      }),
    []
  )
  // Group Settings' router model opens Settings > Models for the default profile.
  const [modelsRequest, setModelsRequest] = useState<ModelsRequest | null>(null)
  useEffect(
    () =>
      onModelsSettings(request => {
        setModelsRequest(request)
        setSection('settings')
      }),
    []
  )
  // A Link invite opened from another app opens in Settings > Multiplayer, as on the phone.
  const [linkRequest, setLinkRequest] = useState<{ url: string; at: number } | null>(null)
  useEffect(() => {
    const open = (url: string | null) => {
      if (!url) return
      setLinkRequest({ url, at: Date.now() })
      setSection('settings')
    }
    void window.conduit.takeLinkUrl().then(open).catch(() => undefined)
    return window.conduit.onLinkUrl(open)
  }, [])
  const runShortcut = useRef<(action: MenuAction) => void>(() => {})
  runShortcut.current = action => {
    if (action === 'new-chat') newChat()
    else if (action === 'needs-you') setSection('needs')
    else if (action === 'settings') setSection('settings')
    else if (action === 'shortcuts') setShortcutsOpen(open => !open)
    else if (action === 'text-bigger') setChatScale(s => nextScale(s, 1))
    else if (action === 'text-smaller') setChatScale(s => nextScale(s, -1))
    else if (action === 'text-normal') setChatScale(1)
    else if (action === 'stop') {
      if (section === 'chats' && running && !dockedRef.current) void stop()
    } else if (action === 'toggle-sidebar') {
      if (section === 'chats' || section === 'room' || section === 'bots') hideList(!listHidden)
      else {
        setSection('chats')
        hideList(false)
      }
    } else if (action === 'search') {
      setSection('chats')
      hideList(false)
      // The list mounts with Chats.
      setTimeout(() => document.querySelector<HTMLInputElement>('.chatlist-search input')?.focus(), 0)
    } else if (action.startsWith('go-')) {
      const target = GO_TO[Number(action.slice(3)) - 1]
      if (target) setSection(target)
    }
  }
  useEffect(() => {
    const offMenu = window.conduit.onMenu(action => runShortcut.current(action))
    const offOpen = window.conduit.onOpenChat(ref => {
      // Another combined dashboard's chat (back from its window, a docked chat's notification, a docked Pulse card) docks here.
      if (ref.host && ref.host !== statusUrlRef.current) {
        const fresh = ref.fresh === true || !ref.storedId
        openDockedRef.current({
          host: ref.host,
          id: fresh ? `new-${Date.now()}` : ref.storedId,
          profile: ref.profile,
          title: ref.title,
          ...(ref.botChat ? { botChat: true } : {}),
          ...(ref.draft ? { draft: ref.draft } : {}),
          ...(fresh ? { fresh: true } : {})
        }, ref.fromWindow === true)
        return
      }
      setSelected({ id: ref.storedId, profile: ref.profile, title: ref.title, ...(ref.botChat ? { botChat: true } : {}) })
      setSection('chats')
    })
    if (window.conduit.platform === 'darwin') {
      return () => {
        offMenu()
        offOpen()
      }
    }
    const onKey = (event: KeyboardEvent) => {
      const action = shortcutFor(event, false)
      if (!action) return
      event.preventDefault()
      runShortcut.current(action)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      offMenu()
      offOpen()
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const roster = useBots(connected, status.url ?? '')
  // The phone's tab layout, kept for this dashboard's next launch (not this one: the page is already open).
  useEffect(() => {
    if (!connected || !status.url) return
    const host = status.url
    prefsHttp('GET', PREFS_PATH).then(
      response => keepTabs(host, syncedTabs(response)),
      () => undefined
    )
  }, [connected, status.url])
  // The bots in the person's order (synced as bots.order), which every list of bots follows.
  const botOrder = useBotOrder(status.url ?? '', connected, prefsHttp)
  const roomOrder = useSyncedOrder(status.url ?? '', connected, prefsHttp, 'rooms')
  const orderedRoster = useMemo(() => (roster.bots ? orderedBots(roster.bots, botOrder.order) : null), [roster.bots, botOrder.order])
  const glowBots = useMemo(() => [...(roster.bots ?? []), ...roster.hidden], [roster.bots, roster.hidden])
  // Thinking and Tool cards as the profile's settings say; read again after a visit to Settings.
  const chatDisplay = useChatDisplay(selected.profile, connected, section === 'chats')
  const chatBot = roster.bots?.find(b => b.name === (selected.profile ?? 'default'))
  const botTitle = chatBot?.title ?? 'Hermes'
  const chatFace = useReplyFace(chatBot)
  const [quote, setQuote] = useState<QuoteRequest | null>(null)
  // A quote lands in the composer it was made for, not again on the way back to Chats.
  useEffect(() => {
    if (section !== 'chats') setQuote(null)
  }, [section])
  const pulse = usePulse(connected, section === 'pulse')
  // The Folder beside the chat: open until closed, for whichever chat has a folder.
  const [filesOpen, setFilesOpen] = useState(() => {
    try {
      return localStorage.getItem('conduit.filesOpen') === '1'
    } catch {
      return false
    }
  })
  const showFiles = useCallback((open: boolean) => {
    setFilesOpen(open)
    try {
      localStorage.setItem('conduit.filesOpen', open ? '1' : '0')
    } catch {
      // Kept for this window only.
    }
  }, [])
  // A file path in a reply opens in the Folder.
  const [reveal, setReveal] = useState<{ path: string; id: number } | null>(null)
  const cwd = chat.cwd
  const openPath = useMemo(
    () =>
      cwd
        ? (path: string) => {
            setReveal(current => ({ path: absolutePath(path, cwd), id: (current?.id ?? 0) + 1 }))
            lastTab.current = 'files'
            setArtifactsOpen(false)
            setWorkOpen(false)
            showFiles(true)
          }
        : null,
    [cwd, showFiles]
  )
  // Each reply's end reads the open folders again: the agent may have changed files.
  const [turnsDone, setTurnsDone] = useState(0)
  // The chat's call (components/ChatCall.tsx), drawn over the chat below.
  const chatCall = useChatCall({
    profile: selected.profile,
    chatId: selected.id,
    liveId: chat.liveId,
    connected,
    store: transcriptStore,
    running,
    turnsDone,
    onStop: () => void stop(),
    onCorrected: noteCorrection,
    tell: message => void tell(message)
  })
  const calling = chatCall.calling
  const endCall = chatCall.end
  // A dashboard switch ends the call, so a pick asks first (state/callSwitch.ts); the docked chat's ends as its pane closes.
  useEffect(() => {
    if (!calling && !dockedCalling) return
    setRunningCall(calling ? endCall : closeDocked)
    return () => setRunningCall(null)
  }, [calling, dockedCalling, endCall, closeDocked])
  const nextMode = chatCall.nextMode
  // Resume call, from a saved call's card: a live call in its chat that continues it, on the mode picked now.
  const resumeCall = (callId: string, saved: CallTranscript) => {
    setOpenCall(null)
    chatCall.resume(callId, saved)
  }
  // The open chat's saved voice calls, read again once a call here ends (its save lands a moment later).
  const [chatCallList, setChatCallList] = useState<ChatCall[]>([])
  const [openCall, setOpenCall] = useState<string | null>(null)
  useEffect(() => {
    setChatCallList([])
    setOpenCall(null)
    const id = selected.id
    if (!id || calling) return
    let live = true
    const read = () =>
      void loadChatCalls(selected.profile, id).then(calls => {
        if (live) setChatCallList(calls)
      })
    read()
    const later = window.setTimeout(read, 3000)
    return () => {
      live = false
      window.clearTimeout(later)
    }
  }, [selected.id, selected.profile, calling])
  /** Edit Bot, open over Bots home. */
  const [editingBot, setEditingBot] = useState<Bot | null>(null)
  const [newBot, setNewBot] = useState(false)
  /** A group chat being started from the Bots list: kept here, so leaving Bots for another section and coming back keeps it (desktop#336). */
  const [botsDraft, setBotsDraft] = useState<BotsDraft | null>(null)
  // New Bot made on another combined dashboard: the sheet's words, carried over the switch.
  const [carriedBot, setCarriedBot] = useState<NewBotCarry | null>(null)
  const [botNotice, setBotNotice] = useState<string | null>(null)
  // A call is the open chat's: another chat, or another screen, ends it. A
  // new chat getting its id from the call's first message is the same chat.
  const callChat = useRef(selected.id)
  useEffect(() => {
    const was = callChat.current
    callChat.current = selected.id
    if (was !== null && was !== selected.id) endCall()
  }, [selected.id])
  useEffect(() => endCall(), [selected.profile, section])
  // A call from Hermes answered here: its chat opens, then the call starts in it (after the resets above).
  const answeredCall = useRef<string | null>(null)
  useEffect(() => {
    if (!answeredCall.current || answeredCall.current !== selected.id || section !== 'chats') return
    answeredCall.current = null
    chatCall.start()
  }, [selected.id, selected.profile, section])
  // Edit Bot closes when another section opens.
  /** Edit profile from Settings or the profile strip: the section to go back to, and a switch to Bots that keeps the editor. */
  const profileEditReturn = useRef<Section | null>(null)
  const keepEditor = useRef(false)
  useEffect(() => {
    if (keepEditor.current) keepEditor.current = false
    else {
      setEditingBot(null)
      profileEditReturn.current = null
    }
  }, [section])
  /** The phone's Profiles card Edit (and Settings > Edit profile): Edit Bot for any profile, Bots or not, then back where it was opened. */
  const editProfile = (bot: Bot) => {
    setNewBot(false)
    setCarriedBot(null)
    if (section !== 'bots') {
      profileEditReturn.current = section
      keepEditor.current = true
      setSection('bots')
    }
    setEditingBot(bot)
  }
  /** New Bot from the bots sidebar: it opens on Bots wherever the sidebar is. */
  const newBotFromSide = () => {
    setEditingBot(null)
    setCarriedBot(null)
    profileEditReturn.current = null
    if (section !== 'bots') setSection('bots')
    setNewBot(true)
  }
  const closeBotEditor = () => {
    setEditingBot(null)
    const back = profileEditReturn.current
    profileEditReturn.current = null
    if (back) setSection(back)
  }
  // Read replies aloud: the open chat's reply, as its turn ends, unless a call speaks it.
  const readTurn = useRef(turnsDone)
  useEffect(() => {
    if (readTurn.current === turnsDone) return
    readTurn.current = turnsDone
    const reply = lastReplyOf(transcriptStore.get().items)
    if (!calling && !dockedCalling && readsRepliesAloud() && reply && document.hasFocus()) void readAloud(`turn-${turnsDone}`, reply, selected.profile).catch(() => undefined)
  }, [turnsDone])
  const wasRunning = useRef(false)
  useEffect(() => {
    if (wasRunning.current && !running) setTurnsDone(n => n + 1)
    wasRunning.current = running
  }, [running])
  const pulseChat = pulse.feed?.homeChatId || null
  // Pulse's own chat stays behind its screen, as on the phone.
  // Workstreams' chats stay with their bots, as on the phone.
  const botNames = useMemo(() => (roster.bots ?? []).map(bot => bot.name), [roster.bots])
  const { sessions: workSessions, byBot: workByBot } = useWorkSessions(botNames, connected)
  // Voice's rows: calls, Classic's chats and voice jobs under Voice, the plugin's archived ones listed again.
  const voiceProfiles = useMemo(() => [...new Set((list.rows ?? []).map(r => r.profile ?? ''))].sort(), [list.rows])
  const voice = useVoiceList(connected, voiceProfiles, `${list.rows?.length ?? 0}\t${list.archived.length}\t${list.rows?.[0]?.activeAt ?? 0}`)
  const listedRows = useMemo(() => {
    const rows = list.rows ? withVoice(list.rows, list.archived, voice) : list.rows
    return rows && (pulseChat || workSessions.size) ? rows.filter(row => row.id !== pulseChat && !workSessions.has(row.id)) : rows
  }, [list.rows, list.archived, voice, pulseChat, workSessions])
  // The open chat's bot's work: its Bot Chat shows a line under its title, and a workstream's chat goes back to it.
  const [workOpen, setWorkOpen] = useState(false)
  const openBotChat = selected.id ? roster.bots?.find(bot => bot.botChatId === selected.id) : undefined
  // The bots sidebar shows while the chat on screen is a bot's: its Bot Chat (or a new one) or one of its workstreams.
  const botsSideShown =
    botsSide && !!roster.bots?.length && (dockedChat ? dockedChat.botChat === true : selected.botChat === true || !!openBotChat || workSessions.has(selected.id ?? ''))
  // Wherever the bots list shows: beside a bot's chat, a group chat, or New Bot and Edit Bot.
  const botsListShown = section === 'bots' || section === 'room' || (section === 'chats' && botsSideShown)
  const work = useWork(selected.profile, connected, section === 'chats' && (workOpen || botsSideShown || !!openBotChat || workSessions.has(selected.id ?? '')))
  // A resolved workstream is on the bot's Resolved page, so its chat keeps its title line, as the phone's does.
  const openWorkItem = selected.id ? work.snapshot?.items.find(item => item.kind === 'workstream' && item.sessionId === selected.id) : undefined
  const workItem: WorkItem | undefined =
    openWorkItem ?? (selected.id ? work.resolved?.find(item => item.kind === 'workstream' && item.sessionId === selected.id) : undefined)
  const readResolvedForChat = work.readResolved
  const resolvedChatOpen = !!selected.id && !!work.snapshot && !openWorkItem && workSessions.has(selected.id)
  useEffect(() => {
    if (resolvedChatOpen) readResolvedForChat()
  }, [resolvedChatOpen, readResolvedForChat])
  // A workstream's checklist is its chat's plan, ahead of Hermes' own todo list there.
  const workChecklist = workItem?.checklist
  const shownPlan = useMemo(() => (workChecklist?.length ? planFromChecklist(workChecklist) : transcriptPlan), [workChecklist, transcriptPlan])
  const delegates = useAgents(chat.liveId, connected, running)
  const [drafting, setDrafting] = useState(false)
  const followedUp = useFollowUps(transcriptStore, connected && !calling ? (chat.liveId ?? undefined) : undefined, selected.profile, !drafting)
  const predictions = usePredictions(transcriptStore, connected && !calling ? (chat.liveId ?? undefined) : undefined)
  // Hermes may have changed the goal, loop or heartbeat: a turn ended or a command answered.
  const outputs = useTranscriptValue(transcriptStore, state => state.items.filter(item => item.kind === 'output').length)
  const controlPulse = turnsDone + outputs
  const workBot = roster.bots?.find(bot => bot.name === (selected.profile ?? 'default'))
  // A bot's chat (its Bot Chat, one not resolved yet, or a workstream's) offers its work once the host answers with some.
  const workHere = !!openBotChat || !!workItem || selected.botChat === true
  const showWork = workOpen && workHere && (!!work.snapshot || !!work.error)
  // A reply's links to its work and to other chats (workLinks): a card or a link opens the chat here, as on the phone.
  const workSnapshot = work.snapshot
  const listRows = list.rows
  const workResolved = work.resolved
  const readResolvedWork = work.readResolved
  const inBotChat = !!openBotChat || selected.botChat === true
  // A Bot Chat names resolved work too: its Resolved page gives those refs their chats.
  useEffect(() => {
    if (inBotChat) readResolvedWork()
  }, [inBotChat, readResolvedWork])
  const workLinkActions = useMemo<WorkLinkActions>(() => {
    // The open list first, then the Resolved page, as the phone's cards read them.
    const known = [...(workSnapshot?.items ?? []), ...(workResolved ?? [])]
    const workstream = (ref: string) => known.find(item => item.kind === 'workstream' && item.ref === ref && !!item.sessionId)
    const ofSession = (sessionId: string) => known.find(i => i.sessionId === sessionId)
    return {
      open: (sessionId, profile) => {
        const item = ofSession(sessionId)
        const row = listRows?.find(r => r.id === sessionId)
        setSelected({ id: sessionId, profile: profile ?? selected.profile, title: item ? shownTitle(item) : row?.title })
        setSection('chats')
      },
      item: workstream,
      missing: readResolvedWork,
      chatOf: inBotChat
        ? ref => {
            const item = workstream(ref)
            return item ? { sessionId: item.sessionId, profile: selected.profile } : undefined
          }
        : undefined,
      titleOf: sessionId => {
        const item = ofSession(sessionId)
        return item ? shownTitle(item) : listRows?.find(r => r.id === sessionId)?.title || undefined
      }
    }
  }, [workSnapshot, workResolved, readResolvedWork, listRows, inBotChat, selected.profile])
  // The bot's screen (Hermes' Bot Screen), offered only where the host can have one, as the phone checks.
  const screenProfile = selected.profile ?? 'default'
  // It opens in a window of its own, so the chat's text and tool output stay in view (Eric, 2026-11-21).
  const [screenWindows, setScreenWindows] = useState<string[]>([])
  useEffect(() => {
    const off = window.conduit.onScreenWindows(setScreenWindows)
    void window.conduit.screenWindows().then(setScreenWindows)
    return off
  }, [])
  const screenOpen = screenWindows.includes(screenKey(status.url ?? undefined, screenProfile))
  const [screenHosts, setScreenHosts] = useState<Record<string, boolean>>({})
  useEffect(() => setScreenHosts({}), [status.url])
  useEffect(() => {
    if (!connected || screenHosts[screenProfile] !== undefined) return
    let live = true
    gateway
      .rpc<{ supported?: unknown }>('display.status', { profile: screenProfile })
      .then(answer => live && setScreenHosts(all => ({ ...all, [screenProfile]: answer?.supported === true })))
      .catch(() => live && setScreenHosts(all => ({ ...all, [screenProfile]: false })))
    return () => {
      live = false
    }
  }, [connected, screenProfile, screenHosts])
  // The chat's artifacts beside it, after the phone's In This Chat sheet.
  const [artifactsOpen, setArtifactsOpen] = useState(false)
  // The side panel's tabs (Eric, 2026-11-20, option C, softer): the bot's Work, In This Chat and the chat's Files, where the chat has them, one open at a time.
  const panelTabs: PanelTab[] = [
    ...(workHere && (work.snapshot || work.error) ? (['work'] as const) : []),
    ...(selected.id ? (['chat'] as const) : []),
    ...(chat.cwd ? (['files'] as const) : [])
  ]
  const shownTab: PanelTab | null = artifactsOpen && selected.id ? 'chat' : showWork ? 'work' : filesOpen && chat.cwd ? 'files' : null
  const lastTab = useRef<PanelTab>('work')
  const openTab = (tab: PanelTab | null) => {
    if (tab) lastTab.current = tab
    setArtifactsOpen(tab === 'chat')
    setWorkOpen(tab === 'work')
    showFiles(tab === 'files')
  }
  const workDot = workHere ? workCount(work.snapshot) : null
  // The tabs show where there's more than one to pick between.
  const panelTabBar = shownTab && panelTabs.length > 1 ? <PanelTabs tabs={panelTabs} shown={shownTab} onPick={openTab} work={work.snapshot} /> : null
  // The list's and the side panel's widths, dragged by the lines beside them and kept on this device.
  const [listStored, setListStored] = useState(() => readWidth(LIST_COLUMN))
  const [panelStored, setPanelStored] = useState(() => readWidth(PANEL_COLUMN))
  const [listLive, setListLive] = useState<number | null>(null)
  const [panelLive, setPanelLive] = useState<number | null>(null)
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth)
  useEffect(() => {
    const resized = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', resized)
    return () => window.removeEventListener('resize', resized)
  }, [])
  // The chat list hidden (the « at its top, ⌘\ or Ctrl+\, or a drag past its least width) until the » atop the rail brings it back.
  const [listHidden, setListHidden] = useState(readListHidden)
  const hideList = useCallback((hidden: boolean) => {
    setListHidden(hidden)
    writeListHidden(hidden)
  }, [])
  // Hidden, the Bots sidebar lost its scroll (display: none); shown again, it goes back to its spot.
  useShownAgain(listHidden, () => botSideScroll.opened())
  // Combined dashboards: the other hosts kept connected beside this one...
  const keptHosts = useKeptHosts(status.url ?? '')
  // ...their bots, on Bots Home and in the chat list's profile column (Eric, 2026-11-21: Chats held only this dashboard's).
  // Settings too: its profile dropdown lists every combined dashboard's profiles. So does Scheduled's column (Eric, 2026-11-22).
  const otherBots = useKeptBots(keptHosts, botsListShown || section === 'chats' || section === 'settings' || section === 'tasks')
  // ...with their pills, from their work read there (Eric, 2026-11-21: another host's "needs you" didn't show).
  const otherWork = useKeptWork(otherBots, botsListShown || section === 'chats')
  // The chat list's profile column, beside the list's own width: the list gives way to it before the chat does.
  // The same tiles ChatList draws (profileTiles below): none until this host's roster is read, other dashboards' once it has an address.
  const columnTiles = orderedRoster ? orderedRoster.length + (status.url ? otherBots.length : 0) : 0
  const columnShown = section === 'chats' && !listHidden && !projectsOpen && !botsSideShown && columnTiles > 1
  const listColumn = columnShown ? PROFILE_COLUMN_WIDTH : 0
  const listWidth = shownListWidth(listLive ?? listStored, windowWidth - listColumn)
  const listTaken = (section === 'chats' || section === 'room' || section === 'bots') && listHidden ? 0 : (listWidth ?? Math.min(320, Math.max(240, windowWidth * 0.28))) + listColumn
  const panelWidth = shownPanelWidth(panelLive ?? panelStored, windowWidth, listTaken)
  // A chat beside the open one: only where both fit, else the pane hides until the window widens.
  const [beside, setBeside] = useState<BesideChat | null>(null)
  const besideBot = beside ? roster.bots?.find(b => b.name === (beside.profile ?? 'default')) : undefined
  const besideFace = useReplyFace(besideBot)
  const besideFits = besideChatFits(windowWidth, listTaken)
  const sameProfileAs = (a?: string, b?: string) => (a ?? 'default').toLowerCase() === (b ?? 'default').toLowerCase()
  // The chats in windows of their own (up to three), from the main process.
  const [chatWindowIds, setChatWindowIds] = useState<string[]>([])
  const chatWindowIdsRef = useRef(chatWindowIds)
  chatWindowIdsRef.current = chatWindowIds
  useEffect(() => {
    const off = window.conduit.onChatWindows(setChatWindowIds)
    void window.conduit.chatWindows().then(setChatWindowIds)
    return off
  }, [])
  // A call started in place (a wake phrase or a ring on the chat on screen) brings back the chat that has its controls.
  useEffect(() => {
    if (calling) setDocked(null)
  }, [calling])
  // A docked chat closes when its dashboard is no longer kept beside this one (out of the group, signed out of) and
  // when it moves to a window of its own (its pane's Open in New Window). Open in Main Window docks the chat before
  // its own window has closed, so only that window is let be until it goes.
  const windowsAtDock = useRef<string[]>([])
  useEffect(() => {
    windowsAtDock.current = docked?.fromWindow ? [docked.chat.id] : []
  }, [docked])
  useEffect(() => {
    if (!docked) return
    const windowed = chatWindowIds.includes(docked.chat.id) && !windowsAtDock.current.includes(docked.chat.id)
    if (!keptHosts.some(h => h.url === docked.chat.host) || windowed) setDocked(null)
    // Its old window gone, a window opened again later closes the pane.
    windowsAtDock.current = windowsAtDock.current.filter(id => chatWindowIds.includes(id))
  }, [docked, keptHosts, chatWindowIds])
  // A chat opened here closes its window of its own.
  useEffect(() => {
    if (selected.id && chatWindowIds.includes(selected.id)) window.conduit.closeChatWindows([selected.id])
  }, [selected.id, chatWindowIds])
  // Bots home: a bot opens its Bot Chat (or a new chat in its profile); Ask sends there once it's open.
  const lastBot = useRef<string | null>(null)
  const openBot = useCallback((bot: Bot) => {
    lastBot.current = bot.name
    setSelected({ id: bot.botChatId ?? null, profile: bot.name, title: bot.title, botChat: true })
    setSection('chats')
    setBotsSide(true)
  }, [])
  /**
   * Open in New Window, from a row's menu or the chat's header (Eric,
   * 2026-11-21): the chat gets a window of its own, a whole chat for its own
   * bot, or its window comes to the front when it has one. The chat on screen
   * moves there, and this window starts a new chat in its bot; the pane's
   * Open in New Window moves its chat the same way, and the pane closes.
   */
  const popOut = useCallback(
    async (target: { id: string; profile?: string; title?: string; botChat?: boolean; host?: string }) => {
      const far = !!target.host && target.host !== status.url
      const bot = far ? undefined : roster.bots?.find(b => sameProfileAs(b.name, target.profile))
      const onScreen = !far && (target.id === selected.id || target.id === chat.storedId)
      // A call in the chat on screen would end with it: the header says so, and a row's menu does the same.
      // So would one in the docked chat, which a new window of its own would close (one it has already only comes forward).
      const dockedHere = dockedCalling && !!docked && docked.chat.id === target.id && (docked.chat.host === (target.host ?? status.url)) && !chatWindowIds.includes(target.id)
      if ((onScreen && calling) || dockedHere) {
        void tell(t('End the call to move this chat to a window of its own'))
        return
      }
      // Away first, so the main window isn't still showing it when its window opens (which would close it).
      // A Bot Chat's place is the bots sidebar, so this window stays on Bots with another bot's Bot Chat (one
      // with no window of its own, or a first one for a bot that has none); a new chat here would be Chats, and a
      // new Bot Chat for the same bot a second one.
      const nextBot =
        onScreen && (target.botChat || bot?.botChatId === target.id)
          ? (orderedRoster ?? roster.bots ?? [])
              .filter(b => !sameProfileAs(b.name, target.profile) && (!b.botChatId || (b.botChatId !== target.id && !chatWindowIds.includes(b.botChatId))))
              .sort((a, b) => (b.lastActive ?? 0) - (a.lastActive ?? 0))[0]
          : undefined
      if (nextBot) openBot(nextBot)
      else if (onScreen) setSelected({ id: null, profile: selected.profile })
      const opened = await window.conduit.openChatWindow({
        id: target.id,
        profile: target.profile,
        title: target.title,
        author: bot?.title ?? 'Hermes',
        host: target.host ?? status.url,
        ...(target.botChat ? { botChat: true } : {})
      })
      if (!opened) {
        if (onScreen)
          setSelected(current =>
            // Back only if nothing else was opened meanwhile.
            (nextBot ? current.id === (nextBot.botChatId ?? null) && sameProfileAs(current.profile, nextBot.name) : current.id === null && current.profile === selected.profile)
              ? { id: target.id, profile: target.profile, title: target.title, botChat: target.botChat }
              : current
          )
        // At the limit, say so; otherwise its dashboard went (a sign-out, a switch) as it opened.
        if (chatWindowIdsRef.current.length >= CHAT_WINDOW_LIMIT) void tell(t('Up to {count} chats can have windows of their own. Close one to open another.', { count: CHAT_WINDOW_LIMIT }))
        else void tell(t('The chat didn’t open. Try again.'))
        return
      }
      setBeside(current => (current?.id === target.id ? null : current))
    },
    [roster.bots, orderedRoster, openBot, selected.id, selected.profile, chat.storedId, status.url, calling, dockedCalling, docked, chatWindowIds]
  )
  /** A row whose chat has a window of its own brings that window to the front; any other opens here. */
  const selectRow = useCallback(
    (row: ChatRow) => {
      if (chatWindowIds.includes(row.id)) void window.conduit.openChatWindow({ id: row.id, profile: row.profile, title: row.title })
      else setSelected({ id: row.id, profile: row.profile, title: row.title })
    },
    [chatWindowIds]
  )
  // Opening the pane's chat in the chat's column, or a chat of another profile, closes it.
  useEffect(() => {
    if (beside && (selected.id === beside.id || !sameProfileAs(selected.profile, beside.profile))) setBeside(null)
  }, [beside, selected.id, selected.profile])
  /** Open Beside: the row opens, and the chat on screen stays in the pane (an ordinary chat of the same profile only). */
  const openBeside = (row: ChatRow) => {
    const keeps = !!selected.id && !selected.botChat && selected.id !== row.id
    setSelected({ id: row.id, profile: row.profile, title: row.title })
    setBeside(keeps ? { id: selected.id!, profile: selected.profile, title: chat.title ?? selected.title } : null)
  }
  const swapBeside = () => {
    if (!beside) return
    setBeside(selected.id && !selected.botChat ? { id: selected.id, profile: selected.profile, title: chat.title ?? selected.title } : null)
    setSelected({ id: beside.id, profile: beside.profile, title: beside.title })
  }
  const commitList = (width: number | null) => {
    setListLive(null)
    setListStored(width)
    writeWidth(LIST_COLUMN, width)
  }
  const commitPanel = (width: number | null) => {
    setPanelLive(null)
    setPanelStored(width)
    writeWidth(PANEL_COLUMN, width)
  }
  // An artifact's Show in Chat (state/revealRow.ts).
  const showInChat = useRevealRow(transcriptStore, selected.id, chat.storedId, key => requestAnimationFrame(() => revealMessage(chatPane.current, key)))
  const [modelOpen, setModelOpen] = useState(false)
  const closeModel = useCallback(() => setModelOpen(false), [])
  const [contextOpen, setContextOpen] = useState(false)
  const closeContext = useCallback(() => setContextOpen(false), [])
  useEffect(() => {
    setModelOpen(false)
    setContextOpen(false)
  }, [selected.id])
  // Pinned replies: on this computer, per host, as the phone keeps them per device.
  const pinHost = status.url ?? ''
  const [pins, setPins] = useState<PinnedReply[]>(() => loadPins(pinHost))
  useEffect(() => setPins(loadPins(pinHost)), [pinHost])
  const updatePins = useCallback(
    (change: (current: PinnedReply[]) => PinnedReply[]) =>
      setPins(current => {
        const next = change(current)
        if (next !== current) savePins(pinHost, next)
        return next
      }),
    [pinHost]
  )
  const [pinSheet, setPinSheet] = useState<{ scope: 'chat' | 'all'; editing?: string } | null>(null)
  const [pinReveal, setPinReveal] = useState<{ pin: PinnedReply; expires: number } | null>(null)
  /** A row's Pin, Rename or Delete: shown at once, put back with the reason when Hermes refuses it. */
  const chatAction = useCallback(
    async (row: ChatRow, patch: { pinned?: boolean; title?: string } | null) => {
      list.patchRow(row.id, patch)
      if (patch === null && (selected.id === row.id || chat.storedId === row.id)) newChat()
      if (patch === null) setBeside(current => (current?.id === row.id ? null : current))
      if (patch === null) window.conduit.closeChatWindows([row.id])
      // A deleted chat's pins go with it.
      if (patch === null) updatePins(current => withoutChat(current, row.profile, row.id))
      try {
        await mutateSession(gateway.http, row.id, row.profile, patch)
      } catch (e) {
        void tell(t('Couldn’t change “{title}”: {reason}', { title: row.title, reason: e instanceof Error ? e.message : String(e) }))
      }
      list.refresh()
    },
    [list, selected.id, chat.storedId, newChat, updatePins]
  )
  // Filter › Projects: the project tree of the profile the list shows (with one profile, All is that one), read again as
  // turns end, as Projects closes (a project made, renamed or deleted there) and after Move to Project.
  const [projectsChanged, setProjectsChanged] = useState(0)
  const filterProfile = chatProfile ?? (roster.bots?.length === 1 ? roster.bots[0].name : null)
  const [filterTree, setFilterTree] = useState<{ key: string; list: Project[] } | null>(null)
  const filterTreeKey = filterProfile && connected && status.url ? `${status.url}\t${filterProfile}` : null
  useEffect(() => {
    if (!filterTreeKey || section !== 'chats') return
    let live = true
    const profile = filterProfile && filterProfile !== 'default' ? filterProfile : undefined
    gateway
      .rpc('projects.tree', profile ? { preview_limit: 3, profile } : { preview_limit: 3 })
      .then(response => live && setFilterTree({ key: filterTreeKey, list: parseProjects(response, filterProfile ?? undefined) }))
      // A Hermes without projects offers none.
      .catch(() => live && setFilterTree({ key: filterTreeKey, list: [] }))
    return () => {
      live = false
    }
  }, [filterTreeKey, filterProfile, section, turnsDone, projectsOpen, projectsChanged])
  const projectFilter = useMemo(
    () => (filterProfile && filterTreeKey ? { profile: filterProfile, list: filterTree?.key === filterTreeKey ? filterTree.list : null } : undefined),
    [filterProfile, filterTreeKey, filterTree]
  )
  // Move to Project: the chat's profile's projects with a folder, as the phone offers them.
  const moveTargets = useCallback(async (row: ChatRow): Promise<MoveTarget[]> => {
    const profile = row.profile && row.profile !== 'default' ? row.profile : undefined
    const response = await gateway.rpc('projects.tree', profile ? { preview_limit: 0, profile } : { preview_limit: 0 })
    return parseProjects(response).flatMap(p => (!p.isHome && p.path ? [{ id: p.id, title: p.title, path: p.path }] : []))
  }, [])
  const moveToProject = useCallback(
    async (row: ChatRow, target: MoveTarget) => {
      try {
        await moveChat(gateway.rpc, gateway.http, row.id, row.profile, target.path, status.sessionAuthority === true)
        setProjectsChanged(n => n + 1)
      } catch (e) {
        void tell(
          t('Couldn’t move “{title}” to {project}: {reason}', { title: row.title, project: target.title, reason: e instanceof Error ? e.message : String(e) })
        )
      }
    },
    [status.sessionAuthority]
  )
  // Stars and read state: on this computer, per host. Hermes' own unread flag is cleared too.
  const markHost = status.url ?? ''
  // Done chats, kept by the plugin for every Conduit (state/chatDone): read again as the list changes.
  const doneProfiles = useMemo(() => [...new Set((list.rows ?? []).map(r => r.profile ?? 'default'))].sort(), [list.rows])
  const doneHttp = useCallback((method: 'GET' | 'POST', path: string, body?: unknown) => gateway.http(method, path, body), [])
  const chatDone = useChatDone(doneHttp, connected, doneProfiles, `${list.rows?.length ?? 0}\t${list.rows?.[0]?.activeAt ?? 0}`, markHost)
  const isRowDone = useCallback((row: ChatRow) => isDone(chatDone.marks, row), [chatDone.marks])
  // Muted chats, kept by the plugin, which skips their pushes on every device (state/chatMute).
  const muteHttp = useCallback((method: 'GET' | 'PUT', path: string, body?: unknown) => gateway.http(method, path, body), [])
  const muteFailed = useCallback((reason: string) => void tell(t('Couldn’t change this chat’s notifications: {reason}', { reason })), [])
  const chatMute = useChatMute(muteHttp, connected, doneProfiles, `${list.rows?.length ?? 0}\t${list.rows?.[0]?.activeAt ?? 0}`, markHost, muteFailed)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- tick: a timed mute that ended reads again
  const rowMute = useCallback((row: ChatRow) => muteOf(chatMute.mutes, row), [chatMute.mutes, chatMute.tick])
  // A muted chat's finished turn doesn't notify here either, as the plugin
  // doesn't push it; approvals and questions still do, as on the phone.
  // The chat an event names, as a mute knows it: its stored id and profile from
  // an open chat, else from Needs you's row (a chat this window never opened),
  // else the id the event carries, whose profile no one knows: its mute is
  // looked for under every listed profile (muteOfTarget).
  const muteRowRef = useRef<(sessionId: string) => MuteTarget>(id => ({ id, title: '', pinned: false, profileUnknown: true }))
  muteRowRef.current = (sessionId: string) => {
    const ref = chats.current.get(sessionId)
    const waitingRows = waitingRowsRef.current
    const waitingRow = ref ? undefined : waitingRows.find(row => row.sessionIds.includes(sessionId))
    const id = ref?.storedId ?? (waitingRow ? chatIdsOf(sessionId, null, waitingRows)[0] : undefined) ?? sessionId
    const listed = (list.rows ?? []).find(r => r.id === id)
    if (listed) return listed
    const profile = ref?.profile ?? waitingRow?.profile
    return { id, title: '', pinned: false, profile, profileUnknown: !ref && !waitingRow && !profile }
  }
  const mutedRef = useRef<(sessionId: string) => boolean>(() => false)
  mutedRef.current = (sessionId: string) => !!muteOfTarget(chatMute.mutes, muteRowRef.current(sessionId))
  const chatMuteRef = useRef(chatMute.mutes)
  chatMuteRef.current = chatMute.mutes
  // A chat whose profile isn't known is asked of every profile: those the
  // list shows and every bot's, so one with no listed rows is asked too
  // (hermes-conduit #3143).
  const muteProfilesRef = useRef<string[]>([])
  muteProfilesRef.current = [...new Set([...doneProfiles, ...glowBots.map(b => b.name || 'default')])].sort()
  const [marks, setMarks] = useState<ChatMarks>(() => loadMarks(markHost))
  useEffect(() => setMarks(loadMarks(markHost)), [markHost])
  const updateMarks = useCallback(
    (change: (current: ChatMarks) => ChatMarks) =>
      setMarks(current => {
        const next = change(current)
        if (next !== current) saveMarks(markHost, next)
        return next
      }),
    [markHost]
  )
  const writeUnread = useCallback((row: ChatRow, unread: boolean) => {
    void mutateSession(gateway.http, row.id, row.profile, { unread }).catch(() => undefined)
  }, [])
  const openId = chat.storedId ?? selected.id
  const openRow = openId ? list.rows?.find(row => row.id === openId) : undefined
  useEffect(() => {
    if (!openRow) return
    updateMarks(current => markRead(current, openRow))
    if (openRow.unread) writeUnread(openRow, false)
  }, [openRow?.id, openRow?.activeAt, openRow?.unread, updateMarks, writeUnread])
  const toggleRead = useCallback(
    (row: ChatRow) => {
      const unread = isUnread(marks, row)
      updateMarks(current => (unread ? markRead(current, row) : markUnread(current, row)))
      if (unread ? row.unread : !row.unread) writeUnread(row, !unread)
    },
    [marks, updateMarks, writeUnread]
  )
  const connectionActions = useMemo(
    () => ({ respond: respondConnection, reissue: reissueConnection, wake: wakeConnection }),
    [respondConnection, reissueConnection, wakeConnection]
  )
  /** Bumped when a tapped takeover makes the chat Conduit's: the composer sends what's in it. */
  const [sendNow, setSendNow] = useState(0)
  const commands = useCommands(selected.profile ?? chatProfile ?? undefined, connected)
  const onSend = useCallback(
    async (text: string, attachments: StagedAttachment[] = [], options: { takeOver?: boolean; spoken?: boolean } = {}) => {
      let created: string | null | false
      // A bot's one chat never resets: /new compacts it, and a compaction carries no attachments.
      const botChat = selected.botChat === true || !!openBotChat
      if (botChat && attachments.length && isResetCommand(text)) {
        notice(t('This bot chat never resets. Remove the attachments to compact it instead.'), 'error')
        return false
      }
      if (looksLikeSlashCommand(text) && !attachments.length) {
        const outcome = await command(text, commands, { botChat })
        if (outcome.kind === 'unsent') return false
        if (outcome.kind === 'new') return newChat()
        if (outcome.kind === 'model') setModelOpen(true)
        if (outcome.kind === 'prefill') setQuote(prefillRequest(withoutMentionNote(outcome.text), botTitle))
        created = outcome.created
      } else {
        created = await send(withMentionNote(text, roster.bots, selected.profile ?? 'default'), attachments, undefined, options)
        if (created === false) return false
        // The message answers the questions Hermes stopped waiting for here.
        clearExpired(chat.liveId)
      }
      if (created) {
        setSelected(s => ({ ...s, id: created }))
        void list.refresh()
      }
      return true
    },
    [send, command, notice, commands, newChat, list, botTitle, roster.bots, selected.profile, selected.botChat, openBotChat, chat.liveId]
  )
  // The bots a chat can tag, in their order: every shown bot but the chat's own.
  const mentionBots = useMemo(() => mentionCandidates(orderedRoster, '', selected.profile ?? 'default'), [orderedRoster, selected.profile])

  // A Bot Chat goes by its bot's name: Hermes titles every one "Bot Chat".
  const title = workItem
    ? shownTitle(workItem)
    : selected.botChat && selected.title
      ? selected.title
      : cleanTitle(chat.title || selected.title || '') || (selected.id ? '' : t('New chat'))

  /**
   * ⋯'s Branch on a reply, as the phone's: a new chat with the turns through
   * it, titled "Branch of …", made in this chat's profile and opened. The
   * authority branches its own rows (through the reply's row); `hermes
   * dashboard` makes a chat from a copy of them.
   */
  const branching = useRef(false)
  const branchFrom = useCallback(
    async (key: string) => {
      const parent = chat.liveId
      if (!parent || branching.current) return
      const plan = branchPlan(transcriptStore.get().items, key)
      if (!plan) return notice(t('There is no message history to branch from.'), 'error')
      const profile = selected.profile
      const scoped = profile && profile !== 'default' ? { profile } : {}
      const branchTitle = t('Branch of {title}', { title: title || t('New chat') })
      branching.current = true
      try {
        let id: string
        if (status.sessionAuthority) {
          // Without the reply's row the branch would keep what came after it too.
          if (!plan.rowId && !plan.newest) throw new Error(t('Open the chat again to branch from this reply.'))
          const result = await authorityMutation<{ branched_session_id?: string }>(gateway.rpc, gateway.http, parent, profile, 'branch', {
            title: branchTitle,
            ...(plan.rowId ? { through_message_id: plan.rowId } : {})
          })
          if (!result?.branched_session_id) throw new Error(t('The chat didn’t open. Try again.'))
          id = result.branched_session_id
        } else {
          const made = await gateway.rpc<{ session_id?: string; stored_session_id?: string | null }>('session.create', {
            cols: 96,
            source: 'desktop',
            // The stored chat: Hermes keeps the branch under it, and a runtime id names no stored row.
            parent_session_id: chat.storedId ?? selected.id ?? parent,
            title: branchTitle,
            messages: plan.messages,
            ...scoped,
            ...(chat.cwd ? { cwd: chat.cwd } : {})
          })
          if (!made?.session_id) throw new Error(t('The chat didn’t open. Try again.'))
          await gateway.rpc('session.title', { session_id: made.session_id, title: branchTitle, ...scoped }).catch(() => undefined)
          // Hermes resumes a chat by its stored id, never the runtime one.
          id = made.stored_session_id || made.session_id
        }
        setSelected({ id, profile, title: branchTitle })
        void list.refresh()
      } catch (e) {
        notice(t('Could not branch conversation: {error}', { error: e instanceof Error ? e.message : String(e) }), 'error')
      } finally {
        branching.current = false
      }
    },
    [chat.liveId, chat.storedId, chat.cwd, transcriptStore, selected.id, selected.profile, title, status.sessionAuthority, notice, list]
  )
  // Pinned replies in the open chat: ⋯'s Pin reply, the bar, and the list from the bar or the Chats list.
  const pinChat = chat.storedId ?? selected.id
  const chatPins = useMemo(() => pinsOfChat(pins, selected.profile, pinChat), [pins, selected.profile, pinChat])
  const revealPin = pinReveal && pinReveal.expires > Date.now() && pinReveal.pin.chat === pinChat ? pinReveal.pin : null
  const clearPinReveal = useCallback(() => setPinReveal(null), [])
  const refreshPins = useCallback(
    (next: PinnedReply[]) => {
      const byId = new Map(next.map(p => [p.id, p]))
      updatePins(current => current.map(p => byId.get(p.id) ?? p))
    },
    [updatePins]
  )
  const pinControls: PinControls | undefined =
    pinChat && !workItem
      ? {
          list: chatPins,
          pin: (item, passage) =>
            updatePins(current => [...current, newPin({ kind: 'assistant', ...item }, pinChat, selected.profile, title || t('Chat'), Date.now(), passage)]),
          unpin: pin => updatePins(current => current.filter(p => p.id !== pin.id)),
          label: pin => setPinSheet({ scope: 'chat', editing: pin.id }),
          showAll: () => setPinSheet({ scope: 'chat' }),
          refresh: refreshPins,
          reveal: revealPin,
          onRevealed: clearPinReveal
        }
      : undefined
  const pinChatTitle = (pin: PinnedReply) =>
    cleanTitle(list.rows?.find(r => r.id === pin.chat && (r.profile ?? 'default').toLowerCase() === pin.profile.toLowerCase())?.title ?? '') ||
    pin.chatTitle ||
    t('Chat')
  const openPin = (pin: PinnedReply) => {
    setPinSheet(null)
    setPinReveal({ pin, expires: Date.now() + 20_000 })
    if (pin.chat !== pinChat || (pin.profile || 'default').toLowerCase() !== (selected.profile || 'default').toLowerCase())
      setSelected({ id: pin.chat, profile: pin.profile === 'default' ? undefined : pin.profile, title: pinChatTitle(pin) })
    setSection('chats')
  }

  // Picking a bot on the strip opens its newest listed chat, or a new chat when it has none, so the open chat
  // matches the list. Never its Bot Chat, which the list leaves out: that's the bots sidebar's, and opening it
  // here took Chats over to Bots. Chats stays Chats, as the phone's chip only switches the profile the list shows.
  const chooseProfile = useCallback(
    (next: string | null) => {
      // Any change of profile closes the chat kept beside; chat windows stay, each a chat of its own bot (Eric, 2026-11-21).
      setChatProfile(next)
      if (next) setBeside(current => (current && !sameProfileAs(current.profile, next) ? null : current))
      if (!next) return
      const same = (name: string | undefined) => (name ?? 'default').toLowerCase() === next.toLowerCase()
      if (same(selected.profile) && !selected.botChat) return
      // A chat with a window of its own stays there: shown here, its window would close.
      const newest = (listedRows ?? [])
        .filter(row => same(row.profile) && !chatWindowIds.includes(row.id))
        .sort((a, b) => (b.activeAt ?? 0) - (a.activeAt ?? 0))[0]
      setBotsSide(false)
      setSelected(newest ? { id: newest.id, profile: newest.profile, title: newest.title } : { id: null, profile: next })
    },
    [selected.profile, selected.botChat, listedRows, chatWindowIds]
  )
  // A bot row's menu: Pin, Duplicate, Hide, Show and Delete. Answers what went wrong, if anything.
  const botAction = useCallback(
    async (kind: BotAction, bot: Bot): Promise<string | null> => {
      const rpc = (method: string, params?: Record<string, unknown>) => gateway.rpc(method, params)
      try {
        if (kind === 'pin' || kind === 'unpin') {
          if (!(await writeMeta(rpc, bot, { pinned: kind === 'pin' ? true : undefined }))) return t('Couldn’t save that change. Try again.')
        } else if (kind === 'hide' || kind === 'show') {
          if (!(await writeMeta(rpc, bot, { hidden: kind === 'hide' ? true : undefined }))) return t('Couldn’t save that change. Try again.')
        } else if (kind === 'duplicate') {
          const taken = [...(roster.bots ?? []), ...roster.hidden].map(b => b.name)
          const copy = await duplicateBot(rpc, bot, taken)
          if (!copy.lookSaved) return t('The bot was created, but its picture or look was not saved. Edit the bot to try again.')
        } else if (kind === 'delete') {
          if (!canDelete(bot)) return null
          if (
            !(await ask(
              `${t('Delete {name}?', { name: bot.title })}\n\n${t("This permanently removes the bot's profile, chats, memory and skills from the gateway.")}`,
              { confirm: t('Delete'), destructive: true }
            ))
          )
            return null
          await gateway.http('DELETE', `/api/profiles/${encodeURIComponent(bot.name)}`, undefined, 30000)
          forgetAvatars()
        }
        return null
      } catch (e) {
        return t('Couldn’t save that change: {error}', { error: e instanceof Error ? e.message : String(e) })
      } finally {
        void roster.refresh()
      }
    },
    [roster]
  )
  const pendingAsk = useRef<{ text: string; storedId: string | null; profile: string; resumed?: boolean } | null>(null)
  const askBot = useCallback(
    (bot: Bot, text: string) => {
      pendingAsk.current = { text, storedId: bot.botChatId ?? null, profile: bot.name }
      openBot(bot)
    },
    [openBot]
  )
  useEffect(() => {
    const ask = pendingAsk.current
    if (!ask || ask.profile !== selected.profile || ask.storedId !== selected.id) return
    if (ask.storedId) {
      // A Bot Chat waits until it has resumed (this render may still hold the chat open before it).
      if (loading) {
        ask.resumed = true
        return
      }
      if (error && ask.resumed) {
        pendingAsk.current = null
        return
      }
      if (!chat.liveId || (chat.storedId !== ask.storedId && !ask.resumed)) return
    }
    pendingAsk.current = null
    void onSend(ask.text)
  }, [selected, loading, error, chat.liveId, chat.storedId, onSend])
  const groupRooms = useRooms(connected, status.url ?? '')
  // The group chats in the person's order (synced as groups.order), a room it doesn't name first.
  const orderedRooms = useMemo(() => (groupRooms.rooms ? arrange(groupRooms.rooms, roomOrder.order, r => r.roomId, 'rooms') : groupRooms.rooms), [groupRooms.rooms, roomOrder.order])
  const roomInvites = useRoomInvites(connected, status.url ?? '')
  const [openInvite, setOpenInvite] = useState<string | null>(null)
  const shownInvite = openInvite ? roomInvites.invites.find(i => i.id === openInvite) : undefined
  const roomCopies = useRoomCopies(connected, status.url ?? '', roomInvites.capabilities)
  const roomDrafts = useRoomDrafts(connected, status.url ?? '', roomInvites.capabilities)
  const [newGroupOpen, setNewGroupOpen] = useState(false)
  const [openDraft, setOpenDraft] = useState<string | null>(null)
  const shownDraft = openDraft ? roomDrafts.drafts.find(d => d.id === openDraft) : undefined
  const refreshDraft = useCallback(
    async (started: boolean) => {
      await roomDrafts.refresh()
      if (started) await groupRooms.refresh()
    },
    [roomDrafts.refresh, groupRooms.refresh]
  )
  const [openRoom, setOpenRoom] = useState<Room | null>(null)
  /** Another combined dashboard's profile the Chats list shows, picked by its face in the column. */
  const [otherProfile, setOtherProfile] = useState<{ host: string; name: string } | null>(null)
  /** Another combined dashboard's group chat, open in place in the room pane (a frame on its kept connection). */
  const [dockedRoom, setDockedRoom] = useState<(DockedRoomRequest & { roomId: string }) | null>(null)
  const dockedRoomRef = useRef(dockedRoom)
  dockedRoomRef.current = dockedRoom
  /** The open room when someone else hosts it: read from this Hermes' copy, by its Link and room. */
  const [openCopy, setOpenCopy] = useState<string | null>(null)
  const shownCopy = openCopy ? roomCopies.copies.find(c => c.id === openCopy) : undefined
  const shownCopyRoom = useMemo(() => (shownCopy ? copyRoom(shownCopy) : null), [shownCopy])
  const shownCopyApprovals = useMemo(
    () => (shownCopy ? copyApprovals(roomCopies.approvals, shownCopy, roomCopies.copies) : []),
    [shownCopy, roomCopies.approvals, roomCopies.copies]
  )
  const copiesWaiting = useMemo(
    () => new Set(roomCopies.copies.filter(c => copyApprovals(roomCopies.approvals, c, roomCopies.copies).length).map(c => c.id)),
    [roomCopies.approvals, roomCopies.copies]
  )
  const showRoom = useCallback((room: Room) => {
    setOpenRoom(room)
    setOpenCopy(null)
    setSection('room')
  }, [])
  /** A draft that started: its card closes and its room opens. */
  const openDraftRoom = useCallback(
    (room: Room) => {
      setOpenDraft(null)
      showRoom(room)
    },
    [showRoom]
  )
  const runningProfiles = useMemo(() => {
    const names = new Set<string>()
    if (running && selected.profile) names.add(selected.profile)
    return names
  }, [running, selected.profile])

  // Needs you: the requests this window holds, and every profile's waiting list.
  const requests = useRequests()
  const profiles = useMemo(() => [...new Set((list.rows ?? []).map(r => r.profile ?? ''))].sort(), [list.rows])
  const waiting = useWaiting(connected, profiles)
  const waitingRows = useMemo(() => unmatchedWaiting(waiting.rows, requests), [waiting.rows, requests])
  // The open chat's questions that wait past their turn, drawn over its transcript.
  const askedHere = useMemo(
    () => askedInChat(waiting.rows, selected.profile, [chat.storedId, selected.id, chat.liveId]),
    [waiting.rows, selected.profile, selected.id, chat.storedId, chat.liveId]
  )
  // ...and their waits, badged, each opening through a switch.
  const keptWaiting = useKeptWaiting(keptHosts)
  const otherWaiting = useMemo(() => otherHostsWaiting(keptWaiting, waiting.rows), [keptWaiting, waiting.rows])
  const savedHosts = status.hosts
  const badgeFor = useCallback((url: string) => hostBadge(savedHosts ?? [], url, hostName), [savedHosts])
  // ...and their chats, in All.
  const keptChats = useKeptChats(keptHosts, section === 'chats')
  const otherChats = useMemo(() => otherHostsChats(keptChats, list.rows ?? null), [keptChats, list.rows])
  // ...mixed with this host's in one order the person arranges, kept on this computer.
  const combinedCount = savedHosts ? savedHosts.filter(h => h.combined).length : null
  const mixedBotOrder = useMixedBotOrder(combinedCount === null ? null : combinedCount > 1)
  const savedHostUrls = useMemo(() => (savedHosts ?? []).map(h => h.url), [savedHosts])
  // The chat list's column, in Bots Home's order: in a combined group every dashboard's profiles, in the group's.
  const profileTiles = useMemo<MixedTile[] | undefined>(
    () =>
      !orderedRoster
        ? undefined
        : otherBots.length && status.url
          ? mixedTiles(status.url, orderedRoster, otherBots, savedHostUrls, mixedBotOrder.order)
          : orderedRoster.map(bot => ({ key: bot.name, host: status.url ?? '', bot, own: true })),
    [otherBots, status.url, orderedRoster, savedHostUrls, mixedBotOrder.order]
  )
  const tileBadge = useCallback((tile: MixedTile) => badgeFor(tile.own ? (status.url ?? '') : tile.host), [badgeFor, status.url])
  // The profile Settings edits, resolved once so its card, Edit profile and every page below name the same one:
  // the open chat's, matched case-insensitively, else the main profile when it's gone or hidden.
  const settingsBot = settingsProfileTile(profileTiles ?? [], selected.profile ?? 'default')?.bot ?? null
  const settingsProfile = settingsBot?.name ?? selected.profile ?? 'default'
  const otherWaits = useCallback((tile: MixedTile) => otherWork.get(keptWorkKey(tile.host, tile.bot.name))?.needsYou ?? 0, [otherWork])
  // A room started by dragging across dashboards brings the other's bots over your own Link to it.
  const farFor = useCallback(
    (host: string, name: string) =>
      farBotFor(
        name,
        otherBots.filter(o => o.host === host).map(o => o.bot.name),
        roomDrafts.ownBots
      ),
    [otherBots, roomDrafts.ownBots]
  )
  const hasOtherBots = otherBots.length > 0
  // ...and their group chats: each room once, under the host you talk in it from (Eric, 2026-11-20).
  const keptRooms = useKeptRooms(keptHosts, botsListShown)
  // combinedRooms reads each kept host's room order from storage, which useKeptRooms saves on each read and then
  // answers a new Map: keptRooms changing is what draws a host's newly synced order (desktop#248).
  const groupChats = useMemo(
    () => combinedRooms(status.url ?? '', savedHostUrls, groupRooms.rooms ?? [], roomCopies.copies, keptRooms, copiesWaiting),
    [status.url, savedHostUrls, groupRooms.rooms, roomCopies.copies, keptRooms, copiesWaiting]
  )
  useEffect(() => {
    if (botsListShown && hasOtherBots) void roomDrafts.refreshPeople()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botsListShown, hasOtherBots])
  const createFarDraft = useCallback(
    async (name: string, bots: Bot[], far: OwnHermesBot[]): Promise<'made' | 'sending'> => {
      const agents = draftAgents(bots)
      if (!agents) throw new Error(t('Two of these bots would have the same @handle. Rename one, then try again.'))
      const bring: Record<string, string[]> = {}
      for (const bot of far) (bring[bot.linkId] ??= []).push(bot.profile)
      const outcome = await roomDrafts.create(name, agents, Object.keys(bring).sort(), chatProfile ?? 'default', bring)
      return outcome.kind === 'made' ? 'made' : 'sending'
    },
    [roomDrafts, chatProfile]
  )
  // ...and New Bot's choice of where the bot is made: this one, then each other kept connected.
  const newBotDashboards = useMemo<NewBotDashboard[] | undefined>(() => {
    if (!status.url || !badgeFor(status.url)) return undefined
    const live = keptHosts.filter(h => h.state === 'live')
    return [
      { url: status.url, name: hostName(status.url), badge: badgeFor(status.url), taken: [] },
      ...live.map(h => ({
        url: h.url,
        name: hostName(h.url),
        badge: badgeFor(h.url),
        taken: otherBots.filter(o => o.host === h.url).map(o => o.bot.name)
      }))
    ]
  }, [status.url, badgeFor, keptHosts, otherBots])
  // ...and the Artifacts page's chips: this one, then each other kept connected.
  const artifactDashboards = useMemo(
    () => (newBotDashboards ? newBotDashboards.map(({ url, name, badge }) => ({ url, name, badge })) : undefined),
    [newBotDashboards]
  )
  // ...and a Pulse chip each, with how many cards are new there.
  const keptPulse = useKeptPulse(keptHosts, section === 'pulse')
  const pulseUnseen = pulse.feed?.unseen ?? 0
  /**
   * Another combined dashboard whose Pulse feed the page shows, in a docked frame on its kept connection, with
   * no switch (Pulse keeps a feed per dashboard); null for this one's. Only while that dashboard is kept.
   */
  const [pulseHost, setPulseHost] = useState<string | null>(null)
  const shownPulseHost = pulseHost && keptHosts.some(h => h.url === pulseHost) ? pulseHost : null
  const pickPulseHost = useCallback((url: string) => setPulseHost(url === statusUrlRef.current ? null : url), [])
  const pulseHostChips = useMemo(() => {
    const shown = shownPulseHost ?? status.url ?? ''
    // The shown feed keeps its chip through a failed read, so the row back to this dashboard's feed stays.
    const counts = shownPulseHost && !keptPulse.has(shownPulseHost) ? new Map([...keptPulse, [shownPulseHost, 0]]) : keptPulse
    return pulseChips(savedHosts ?? [], status.url ?? '', pulseUnseen, counts, hostName).map(chip => ({ ...chip, current: chip.url === shown }))
  }, [savedHosts, status.url, pulseUnseen, keptPulse, shownPulseHost])
  const needsCount = requests.length + waitingRows.length + otherWaiting.length
  const openRequests = useMemo(() => requests.filter(r => r.sessionId && r.sessionId === chat.liveId), [requests, chat.liveId])
  const expiredQuestions = useExpiredQuestions(chat.liveId)
  // Running and Needs approval on the list's rows: the gateway's live registry while the list shows, the
  // plugin's waiting list, and the open chat's own turn and requests.
  const liveProfiles = useMemo(() => (chatProfile ? [chatProfile] : profiles.slice(0, 8)), [chatProfile, profiles])
  const liveStatus = useLiveStatus(connected && section === 'chats' && !projectsOpen, liveProfiles, `${turnsDone}\t${list.rows?.length ?? 0}`)
  const runningIds = useMemo(() => {
    const ids = new Set<string>()
    for (const [id, state] of liveStatus) if (state === 'working') ids.add(id)
    if (running && chat.storedId) ids.add(chat.storedId)
    return ids
  }, [liveStatus, running, chat.storedId])
  // A project's chats read as their chat rows do: the list's copy when it has one (Unread dot on projects).
  const projectChatUnread = useCallback(
    (chat: ProjectChat) => {
      if (!marks) return false
      const listed = list.rows?.find(r => r.id === chat.id)
      return isUnread(marks, listed ?? { id: chat.id, title: chat.title, pinned: false, profile: chat.profile, activeAt: chat.lastActive })
    },
    [marks, list.rows]
  )
  const waitingIds = useMemo(() => {
    const ids = new Set<string>()
    for (const [id, state] of liveStatus) if (state === 'waiting') ids.add(id)
    for (const row of waiting.rows) for (const id of row.sessionIds) ids.add(id)
    if (openRequests.length && chat.storedId) ids.add(chat.storedId)
    return ids
  }, [liveStatus, waiting.rows, openRequests.length, chat.storedId])

  /** The chats this window opened, by live id: a request's card outside its chat, and a notification's click. */
  const chats = useRef(new Map<string, ChatRef>())
  // A notification takes the chat's own title, never "New chat" for one Hermes hasn't titled yet, and else its bot.
  const notifyTitle = workItem || selected.botChat ? title : cleanTitle(chat.title || selected.title || '')
  if (chat.liveId) chats.current.set(chat.liveId, { storedId: chat.storedId, profile: selected.profile, title: notifyTitle || undefined, bot: botTitle })
  const titleFor = useCallback(
    (sessionId: string) => chats.current.get(sessionId)?.title ?? waiting.rows.find(row => row.sessionIds.includes(sessionId))?.title,
    [waiting.rows]
  )

  // The tray's count and the Dock's badge.
  useEffect(() => window.conduit.setWaiting(needsCount), [needsCount])

  // Notifications for what happens in a chat the user isn't looking at.
  const waitingRowsRef = useRef(waiting.rows)
  waitingRowsRef.current = waiting.rows
  const watching = useRef({ liveId: chat.liveId, onChats: section === 'chats' })
  // The chat on screen isn't watched while another dashboard's chat is docked over it.
  watching.current = { liveId: chat.liveId, onChats: section === 'chats' && !dockedChat }
  const notify = useCallback(async (spec: NotificationSpec, sessionId: string) => {
    if (!notificationsEnabled() || typeof Notification === 'undefined') return
    // A chat in a window of its own notifies from that window. One still opening its session can't yet, so this
    // window does, and a click brings that window up: found by the ids this window knows the chat by, a chat it
    // never opened (popped out from a row) by a waiting row's.
    const storedIds = chatIdsOf(sessionId, chats.current.get(sessionId)?.storedId, waitingRowsRef.current)
    const where = await window.conduit.chatWindowOf(sessionId, false, storedIds)
    if (where === 'watching' || where === 'open') return
    const n = new Notification(spec.title, { body: spec.body, tag: spec.tag, silent: false })
    n.onclick = async () => {
      // A chat in a window of its own opens there.
      if (await window.conduit.chatWindowOf(sessionId, true, storedIds)) return
      window.conduit.window.show()
      const ref = chats.current.get(sessionId)
      if (ref?.storedId) {
        setSelected({ id: ref.storedId, profile: ref.profile, title: ref.title })
        setSection('chats')
      } else {
        setSection('needs')
      }
    }
  }, [])
  useEffect(
    () =>
      window.conduit.onEvent(event => {
        const sid = event.session_id
        if (!sid) return
        if (event.type === 'session.title') {
          const t = (event.payload as { title?: unknown } | undefined)?.title
          const ref = chats.current.get(sid)
          if (ref && typeof t === 'string') chats.current.set(sid, { ...ref, title: cleanTitle(t) })
          return
        }
        if (event.type !== 'message.complete' || isWatching(sid, watching.current.liveId, watching.current.onChats)) return
        const spec = turnNotification(sid, event.payload, chats.current.get(sid))
        if (!spec || mutedRef.current(sid)) return
        // A mute set on another device since the last read: asked at once.
        // A chat this window never opened is asked under what Needs you knows
        // of it, or under every listed profile when nothing does.
        void turnNotifies(muteHttp, chatMuteRef.current, muteRowRef.current(sid), muteProfilesRef.current).then(notifies => {
          if (notifies) void notify(spec, sid)
        })
      }),
    [notify]
  )
  const notified = useRef(new Set<string>())
  useEffect(() => {
    for (const request of requests) {
      if (notified.current.has(request.id)) continue
      notified.current.add(request.id)
      if (isWatching(request.sessionId, watching.current.liveId, watching.current.onChats)) continue
      void notify(requestNotification(request, chats.current.get(request.sessionId)), request.sessionId)
    }
  }, [requests, notify])

  const openWaiting = useCallback(
    (row: WaitingRow) => {
      // A wait in a room this Hermes hosts opens the room, as the phone's does.
      const room = row.roomId ? groupRooms.rooms?.find(r => r.roomId === row.roomId) : undefined
      if (room) return showRoom(room)
      const known = (list.rows ?? []).find(r => row.sessionIds.includes(r.id))
      setSelected({ id: known?.id ?? row.sessionIds[0] ?? null, profile: known?.profile ?? row.profile, title: known?.title ?? row.title })
      setSection('chats')
    },
    [list.rows, groupRooms.rooms, showRoom]
  )

  /**
   * Another combined dashboard's chat opens in place, in the chat pane, with
   * no switch (the phone's no-switch open, stage 2): the dashboard on screen,
   * its lists and a call in progress stay as they are.
   */
  const openDocked = useCallback(
    (chat: DockedChat, fromWindow = false) => {
      // A chat that has a window of its own brings it to the front, as its row does (Open in Main Window excepted, and
      // words for its message box, which a window can't take, dock it here).
      if (!fromWindow && !chat.draft && chatWindowIdsRef.current.includes(chat.id)) {
        void window.conduit.openChatWindow(chat)
        return
      }
      // During a call the chat on screen keeps the call's controls, so another dashboard's chat opens in a window of its own;
      // so does any other during a call in the docked chat.
      const callingHere = calling || (dockedCalling && !(docked && docked.chat.host === chat.host && docked.chat.id === chat.id))
      if (callingHere) {
        // A window can't start a new chat or take words for its message box, so those wait for the call to end.
        if (chat.fresh || chat.draft) {
          void tell(t('End the call to open this chat'))
          return
        }
        void window.conduit.openChatWindow(chat).then(opened => {
          if (opened) return
          if (chatWindowIdsRef.current.length >= CHAT_WINDOW_LIMIT) void tell(t('Up to {count} chats can have windows of their own. Close one to open another.', { count: CHAT_WINDOW_LIMIT }))
          else void tell(t('The chat didn’t open. Try again.'))
        })
        return
      }
      setDocked({ chat, over: selected, ...(fromWindow ? { fromWindow: true } : {}) })
      setBotsSide(chat.botChat === true)
      setSection('chats')
    },
    [selected, calling, dockedCalling, docked]
  )
  const openDockedRef = useRef(openDocked)
  openDockedRef.current = openDocked
  const openOtherWaiting = useCallback(
    (row: KeptWaitingRow) => {
      // A wait in a room that dashboard hosts opens the room in place, as the phone's does, while its list holds it.
      const room = row.roomId ? [...groupChats.before, ...groupChats.after].find(o => o.host === row.host && o.kind === 'room' && o.room.roomId === row.roomId) : undefined
      if (room && room.kind === 'room') {
        setOpenRoom(null)
        setOpenCopy(null)
        setDockedRoom({ host: row.host, kind: 'room', id: room.room.roomId, roomId: room.room.roomId, title: room.room.name })
        setSection('room')
        return
      }
      // The chat as that dashboard's list names it, when it's listed.
      const known = otherChats.find(r => r.host === row.host && row.sessionIds.includes(r.id))
      const id = known?.id ?? row.sessionIds[0]
      if (!id) return
      openDocked({ host: row.host, id, profile: known?.profile ?? row.profile, title: known?.title ?? row.title })
    },
    [otherChats, openDocked, groupChats.before, groupChats.after]
  )
  const statusUrl = status.url ?? ''
  const openOtherChat = useCallback(
    (row: OtherChatRow) => openDocked({ host: row.host, id: row.id, profile: row.profile, title: row.title }),
    [openDocked]
  )
  /** Another dashboard's row whose chat has a window of its own brings the window to the front, with no switch. */
  const selectOtherRow = useCallback(
    (row: OtherChatRow) => {
      if (chatWindowIds.includes(row.id)) void window.conduit.openChatWindow({ id: row.id, profile: row.profile, title: row.title, host: row.host })
      else openOtherChat(row)
    },
    [chatWindowIds, openOtherChat]
  )
  // New Bot picked another dashboard: its sheet opens here with the words, once the roster is read.
  useEffect(() => {
    if (!connected || roster.bots === undefined) return
    const bot = takeNewBotAfterSwitch(statusUrl)
    if (!bot) return
    setCarriedBot(bot)
    setSection('bots')
    setNewBot(true)
  }, [connected, statusUrl, roster.bots])
  const createBotElsewhere = useCallback(async (url: string, bot: NewBotCarry) => {
    if (!(await switchEndingCall(hostName(url)))) return
    newBotAfterSwitch(url, bot)
    void window.conduit.switchHost(url)
  }, [])
  const openOtherBot = useCallback((other: OtherBot) => {
    // Its Bot Chat opens in place; a bot with none yet starts one there, made on its own dashboard by the first send.
    // A second click while that fresh one is shown keeps it, and what's typed in it.
    const shown = dockedRef.current
    if (!other.bot.botChatId && shown?.fresh && shown.botChat && shown.host === other.host && (shown.profile ?? 'default').toLowerCase() === other.bot.name.toLowerCase()) {
      setSection('chats')
      return
    }
    openDocked(
      other.bot.botChatId
        ? { host: other.host, id: other.bot.botChatId, profile: other.bot.name, title: other.bot.title, author: other.bot.title, botChat: true }
        : { host: other.host, id: `new-${Date.now()}`, fresh: true, profile: other.bot.name, title: other.bot.title, author: other.bot.title, botChat: true }
    )
  }, [openDocked])
  useEffect(() => {
    const bot = takeBotAfterSwitch(statusUrl, roster.bots)
    if (bot) openBot(bot)
  }, [statusUrl, roster.bots, openBot])
  /**
   * Another dashboard's face in the chat list's column: the list shows that profile's chats, read through its
   * kept connection, with no switch, and its newest listed chat opens docked, as this dashboard's faces open
   * theirs; never its Bot Chat, which would take Chats over to Bots.
   */
  const showOtherProfile = useCallback(
    (tile: MixedTile) => {
      const same = (name: string | undefined) => (name ?? 'default').toLowerCase() === tile.bot.name.toLowerCase()
      setChatProfile(null)
      setOtherProfile({ host: tile.host, name: tile.bot.name })
      const newest = otherChats.filter(r => r.host === tile.host && same(r.profile)).sort((a, b) => (b.activeAt ?? 0) - (a.activeAt ?? 0))[0]
      if (newest) openDocked({ host: newest.host, id: newest.id, profile: newest.profile, title: newest.title })
      // A bot with no chats there yet starts a new chat in place, as this dashboard's faces do; not before that
      // dashboard's chats are first read, when it may have some.
      else if (keptChatsRead.has(tile.host)) {
        // A second click while that fresh one is shown keeps it, and what's typed in it, as openOtherBot's does.
        const shown = dockedRef.current
        if (shown?.fresh && !shown.botChat && shown.host === tile.host && same(shown.profile)) return
        openDocked({ host: tile.host, id: `new-${Date.now()}`, fresh: true, profile: tile.bot.name, title: tile.bot.title, author: tile.bot.title })
      }
    },
    [otherChats, openDocked]
  )
  // This dashboard's profile picked anywhere (a face, Settings' dropdown) stops showing the far one.
  useEffect(() => {
    if (chatProfile) setOtherProfile(null)
  }, [chatProfile])
  // So does a chat of this dashboard's opening (New Chat, a Needs you row, a send making one), which the far
  // filter would hide from the list.
  useEffect(() => {
    setOtherProfile(null)
  }, [selected])
  // A far face stops showing when its dashboard is no longer kept.
  useEffect(() => {
    if (otherProfile && !keptHosts.some(h => h.url === otherProfile.host)) setOtherProfile(null)
  }, [otherProfile, keptHosts])
  const pickProfile = useCallback(
    (next: string | null) => {
      setOtherProfile(null)
      chooseProfile(next)
    },
    [chooseProfile]
  )
  // Settings' profile dropdown: this dashboard's profile is picked as the Chats list's faces pick it, staying
  // in Settings; another dashboard's switches there and comes back to Settings on that profile.
  const pickSettingsProfile = useCallback(
    async (tile: MixedTile) => {
      if (tile.own) {
        chooseProfile(tile.bot.name)
        setSection('settings')
        return
      }
      if (!(await switchEndingCall(hostName(tile.host)))) return
      reopenSettings()
      showProfileAfterSwitch({ host: tile.host, bot: tile.bot })
      void window.conduit.switchHost(tile.host)
    },
    [chooseProfile]
  )
  const listReady = !!listedRows
  useEffect(() => {
    if (!connected || !listReady) return
    const bot = takeProfileAfterSwitch(statusUrl, roster.bots)
    if (!bot) return
    // Picked in Settings' dropdown: Settings stays open on it.
    const stay = section === 'settings'
    chooseProfile(bot.name)
    setSection(stay ? 'settings' : 'chats')
  }, [connected, listReady, statusUrl, roster.bots, chooseProfile, section])
  const openOtherRoom = useCallback(async (other: OtherRoom) => {
    // A kept dashboard's group chat opens in place, in the room pane on its kept connection, with no switch.
    if (keptHosts.some(h => h.url === other.host)) {
      const room = other.kind === 'room' ? other.room : copyRoom(other.copy)
      setOpenRoom(null)
      setOpenCopy(null)
      setDockedRoom({ host: other.host, kind: other.kind, id: other.kind === 'room' ? other.room.roomId : other.copy.id, roomId: room.roomId, title: room.name })
      setSection('room')
      return
    }
    if (!(await switchEndingCall(hostName(other.host)))) return
    openRoomAfterSwitch(other)
    void window.conduit.switchHost(other.host)
  }, [keptHosts])
  // A near group chat opened closes the docked one; so does its dashboard no longer kept, or the room leaving its list.
  useEffect(() => {
    if (openRoom || openCopy) setDockedRoom(null)
  }, [openRoom, openCopy])
  // Its copy deleted from the docked room: Group chats comes back, as when a copy here is deleted.
  // Its copy was deleted there: it leaves Group chats now, and the pane goes back to Bots.
  const closeDockedRoom = useCallback(() => {
    const shown = dockedRoomRef.current
    if (shown?.kind === 'copy') dropKeptCopy(shown.host, shown.id)
    setDockedRoom(null)
    setSection(current => (current === 'room' ? 'bots' : current))
  }, [])
  // The docked room as its dashboard lists it now, for its name.
  const dockedRoomListed = useMemo(
    () => (dockedRoom ? [...groupChats.before, ...groupChats.after].find(o => o.host === dockedRoom.host && (o.kind === 'room' ? o.room.roomId : o.copy.id) === dockedRoom.id) : undefined),
    [dockedRoom, groupChats.before, groupChats.after]
  )
  useEffect(() => {
    if (!dockedRoom) return
    // Its list is read while the bots sidebar shows, which the room pane does; an unread host's list holds nothing yet.
    const gone = !keptHosts.some(h => h.url === dockedRoom.host) || (!dockedRoomListed && keptRooms.has(dockedRoom.host))
    if (!gone) return
    setDockedRoom(null)
    // Group chats comes back, as when a room here is deleted, rather than an empty room pane.
    if (!openRoom && !openCopy) setSection(current => (current === 'room' ? 'bots' : current))
  }, [dockedRoom, dockedRoomListed, keptHosts, keptRooms, openRoom, openCopy])
  // A group chat opened on another host: open it here once its rooms or copies are read.
  useEffect(() => {
    if (!connected) return
    // Its copies only once they've been read: an unread list is empty, not missing the copy.
    const taken = takeRoomAfterSwitch(statusUrl, groupRooms.rooms, roomCopies.loaded ? roomCopies.copies : null)
    if (!taken) return
    if ('room' in taken) return showRoom(taken.room)
    setOpenCopy(taken.copy.id)
    setOpenRoom(null)
    setSection('room')
  }, [connected, statusUrl, groupRooms.rooms, roomCopies.loaded, roomCopies.copies, showRoom])

  // Calls from Hermes ring here too.
  const rings = useRings(connected, profiles)
  const ring = rings.ringing.at(-1)
  // The wake phrase: heard offline while Conduit is connected and showing, never during a call or a ring.
  const [wakeRevision, setWakeRevision] = useState(0)
  useEffect(() => {
    const changed = () => setWakeRevision(n => n + 1)
    window.addEventListener(WAKE_EVENT, changed)
    return () => window.removeEventListener(WAKE_EVENT, changed)
  }, [])
  const [showing, setShowing] = useState(() => document.visibilityState === 'visible')
  useEffect(() => {
    const changed = () => setShowing(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', changed)
    return () => document.removeEventListener('visibilitychange', changed)
  }, [])
  const wakeList = useMemo(
    () => wakeBindings(wakeProfiles(status.url ?? ''), glowBots.map(bot => bot.name)),
    // wakeRevision: Settings changed the phrases.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status.url, glowBots, wakeRevision]
  )
  const wakePhrases = connected && showing && !calling && !dockedCalling && !ring && wakeList.length ? JSON.stringify(wakeList.map(b => b.phrase)) : ''
  useEffect(() => window.conduit.wake.listen(wakePhrases ? (JSON.parse(wakePhrases) as string[]) : null), [wakePhrases])
  useEffect(() => () => window.conduit.wake.listen(null), [])
  // A phrase heard: voice on its profile, in a new chat or the one it continues, once that chat is open.
  const wakeCall = useRef<{ id: string | null; profile: string } | null>(null)
  const sameProfile = (a?: string, b?: string) => (a || 'default') === (b || 'default')
  useEffect(() => {
    const pending = wakeCall.current
    if (!pending || section !== 'chats' || selected.id !== pending.id || !sameProfile(selected.profile, pending.profile)) return
    wakeCall.current = null
    chatCall.start()
  }, [selected.id, selected.profile, section])
  const heardWake = useRef<(binding: WakeBinding) => void>(() => undefined)
  heardWake.current = binding => {
    if (calling || dockedCalling) return
    const id = binding.fresh ? null : wakeChat(binding.profile, selected, list.rows)
    if (section === 'chats' && selected.id === id && sameProfile(selected.profile, binding.profile)) {
      chatCall.start()
      return
    }
    wakeCall.current = { id, profile: binding.profile }
    const row = id ? list.rows?.find(r => r.id === id) : undefined
    setSelected(id ? { id, profile: binding.profile, title: row?.title } : { id: null, profile: binding.profile })
    setSection('chats')
  }
  const wakeListRef = useRef(wakeList)
  wakeListRef.current = wakeList
  useEffect(
    () =>
      window.conduit.wake.onHeard(index => {
        const binding = wakeListRef.current[index]
        if (binding) heardWake.current(binding)
      }),
    []
  )
  const answerRing = (call: Ring) => {
    rings.dismiss(call.id)
    window.conduit.window.show()
    const known = (list.rows ?? []).find(r => call.sessionIds.includes(r.id))
    const id = known?.id ?? call.sessionIds.at(-1) ?? null
    if (!id) return
    const profile = known?.profile ?? call.profile
    if (selected.id === id && section === 'chats' && (selected.profile ?? '') === (profile ?? '')) {
      if (!calling) {
        chatCall.start()
      }
      return
    }
    answeredCall.current = id
    setSelected({ id, profile, title: known?.title ?? call.title })
    setSection('chats')
  }
  const declineRing = (call: Ring, missed: boolean) => {
    rings.dismiss(call.id)
    // A miss is the iPhone's to report (it may still be answered there), unless no iPhone is paired; a decline is the user's, from here.
    if (!missed) declineOnHost(call)
    else if (call.reportsMiss) declineOnHost(call, 'missed')
    if (missed && notificationsEnabled() && typeof Notification !== 'undefined')
      new Notification(call.name ? t('Missed call from {name}', { name: call.name }) : t('Missed call from Hermes'), {
        body: call.body || call.reason,
        tag: `missed-${call.id}`
      }).onclick = () => {
        window.conduit.window.show()
        answerRingChat(call)
      }
  }
  const answerRingChat = (call: Ring) => {
    const known = (list.rows ?? []).find(r => call.sessionIds.includes(r.id))
    const id = known?.id ?? call.sessionIds.at(-1) ?? null
    if (!id) return
    setSelected({ id, profile: known?.profile ?? call.profile, title: known?.title ?? call.title })
    setSection('chats')
  }
  // While an update started here has Hermes away, the banner follows it instead of a bare "reconnecting".
  const hostUpdate = useHostActions(status.url ?? '').update
  const updateAway = updateBanner(hostUpdate)
  useEffect(() => {
    if (connected && status.url) hostReachable(status.url)
  }, [connected, status.url, hostUpdate.kind])
  // The backdrop glows in the open chat's agent's color, and elsewhere in the profile in use's.
  const glowOf = useGlowColors(glowBots, status.url ?? '')
  const roomChatsServed = roomInvites.capabilities.includes(ROOM_CHATS_CAPABILITY)
  // Files in rooms with other people's agents go through the plugin, which reads their pictures back.
  const roomFilesStored = roomInvites.capabilities.includes(ROOM_FILES_CAPABILITY)
  const roomFilePictures = roomInvites.capabilities.includes(ROOM_FILE_PICTURES_CAPABILITY)
  const roomChoicesServed = roomInvites.capabilities.includes(ROOM_RULES_CAPABILITY)
  // What Hermes waits on in each bot's profile: its confirmations, and rooms' and linked people's asks.
  const presentProfiles = useMemo(() => (roster.bots?.length ? roster.bots.map(b => b.name) : ['default']), [roster.bots])
  const presented = usePresented(connected, status.url ?? '', roomInvites.capabilities, presentProfiles)
  const shownConfirm = presented.waiting[0]
  // A new room invite, and an ask Hermes waits on while the window isn't in front, as the phone's pushes.
  const inviteIds = roomInvites.loaded ? roomInvites.invites.filter(i => i.status === 'waiting' && !i.removed).map(i => i.id).join('\n') : null
  useEffect(() => {
    if (inviteIds === null || !status.url) return
    const fresh = newlyArrived(`conduit.notified.invites.${status.url}`, inviteIds ? inviteIds.split('\n') : [])
    if (!fresh.length || !notificationsEnabled() || typeof Notification === 'undefined') return
    for (const id of fresh) {
      const invite = roomInvites.invites.find(i => i.id === id)
      if (!invite) continue
      const spec = inviteNotification(invite)
      const n = new Notification(spec.title, { body: spec.body, tag: spec.tag, silent: false })
      n.onclick = () => {
        window.conduit.window.show()
        setOpenInvite(id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteIds, status.url])
  const askedAbout = useRef(new Set<string>())
  useEffect(() => {
    for (const item of presented.waiting) {
      if (askedAbout.current.has(item.prompt.id)) continue
      askedAbout.current.add(item.prompt.id)
      if (document.hasFocus() || !notificationsEnabled() || typeof Notification === 'undefined') continue
      const spec = askNotification(item.prompt, askerLine(item.prompt))
      const n = new Notification(spec.title, { body: spec.body, tag: spec.tag, silent: false })
      n.onclick = () => window.conduit.window.show()
    }
  }, [presented.waiting])

  /** A room's private chat with one of your agents: kept, or made and told its room; Wrap Up asks it for notes once it's open. */
  const openRoomChatWith = useCallback(
    async (room: Room, agent: RoomChatAgent, wrapUp: boolean) => {
      const opened = await openRoomChatHere(room.roomId, room.name, agent.profile, status.sessionAuthority === true)
      if (wrapUp) pendingAsk.current = { text: wrapUpPrompt(), storedId: opened.chatId, profile: agent.profile }
      setSelected({ id: opened.chatId, profile: agent.profile, title: opened.title })
      setSection('chats')
      list.refresh()
    },
    [status.sessionAuthority, list]
  )
  const roomLooks = useRoomLooks(connected, status.url ?? '', roomInvites.capabilities, roster.bots, glowOf)
  const personPicture = useMemo<PersonPicture>(
    () => ({ served: roomLooks.served, picture: roomLooks.you, saving: roomLooks.youSaving, set: roomLooks.setYou }),
    [roomLooks.served, roomLooks.you, roomLooks.youSaving, roomLooks.setYou]
  )
  // How the rooms over Links look: Bots Home's, or the open one's, each read at most every 30 s while the window shows.
  const looksRooms = useMemo(() => {
    if (!botsListShown) return { ids: [], over: [] }
    // The bots list's rooms over Links, and the open one's.
    const hosted = (groupRooms.rooms ?? []).filter(r => r.linked).map(r => r.roomId)
    const ids = new Set([...hosted, ...roomCopies.copies.map(c => c.roomId)])
    const over = new Set(roomCopies.copies.filter(isOver).map(c => c.roomId))
    if (section === 'room' && shownCopy) ids.add(shownCopy.roomId)
    if (section === 'room' && !shownCopy && openRoom?.members.some(m => m.peer)) ids.add(openRoom.roomId)
    return { ids: [...ids], over: [...over] }
  }, [botsListShown, section, shownCopy, openRoom, groupRooms.rooms, roomCopies.copies])
  const looksKey = `${looksRooms.ids.join(',')}|${looksRooms.over.join(',')}`
  const readLooks = roomLooks.read
  useEffect(() => {
    if (!looksRooms.ids.length) return
    const once = new Set(looksRooms.over)
    void readLooks(looksRooms.ids, once)
    return everyWhileVisible(() => void readLooks(looksRooms.ids, once), LOOKS_READ_MS)
    // The rooms are read again when the list of them changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [looksKey, readLooks])
  const glow = glowOf(section === 'chats' ? (selected.profile ?? chatProfile) : chatProfile)
  useEffect(() => {
    document.documentElement.style.setProperty('--glow', glow)
  }, [glow])
  useEffect(
    () => () => {
      document.documentElement.style.removeProperty('--glow')
    },
    []
  )
  // Bots has no page of its own (Eric, 2026-11-20): it opens the bot last opened here, else the one used most recently.
  useEffect(() => {
    if (section !== 'bots' || newBot || editingBot) return
    const bots = orderedRoster ?? roster.bots
    if (!bots?.length) return
    // A bot whose Bot Chat has a window of its own stays there: opening it here would close that window.
    const here = bots.filter(b => !b.botChatId || !chatWindowIds.includes(b.botChatId))
    if (!here.length) return
    const same = (name: string | null) => here.find(b => b.name.toLowerCase() === name?.toLowerCase())
    openBot(same(lastBot.current) ?? [...here].sort((a, b) => (b.lastActive ?? 0) - (a.lastActive ?? 0))[0])
  }, [section, newBot, editingBot, orderedRoster, roster.bots, openBot, chatWindowIds])
  const botsHomeProps: Omit<ComponentProps<typeof BotsHome>, 'side'> = {
    // The group chat being started outlives the Bots list, which goes with its section (desktop#336).
    draft: botsDraft,
    onDraft: setBotsDraft,
    bots: orderedRoster,
    error: roster.error,
    runningProfiles: runningProfiles,
    rooms: orderedRooms,
    canStartRooms: groupRooms.capabilities?.supported === true && connected,
    onOpen: openBot,
    onOpenRoom: showRoom,
    onCreateRoom: groupRooms.create,
    // Beside a chat or a group chat, Edit Bot and New Bot open on Bots, and closing goes back.
    onEdit: connected ? editProfile : undefined,
    hidden: roster.hidden,
    onNewBot: connected ? newBotFromSide : undefined,
    onAction: connected ? botAction : undefined,
    notice: botNotice,
    onDismissNotice: () => setBotNotice(null),
    invites: roomInvites.rows,
    onOpenInvite: invite => setOpenInvite(invite.id),
    drafts: roomDrafts.rows,
    onOpenDraft: draft => setOpenDraft(draft.id),
    roomLooks: roomLooks.looks,
    otherBots: otherBots,
    otherWork: otherWork,
    badgeFor: badgeFor,
    onOpenOther: openOtherBot,
    hostUrl: statusUrl,
    savedHosts: savedHostUrls,
    mixedOrder: mixedBotOrder.order,
    onMoveMixed: mixedBotOrder.drop,
    onMoveBot: botOrder.drop,
    onMoveRoom: roomOrder.drop,
    farFor: farFor,
    onCreateFarDraft: roomDrafts.ownBots.length ? createFarDraft : undefined,
    onNewGroup: connected && groupRooms.capabilities?.supported === true
                ? () => {
                    setNewGroupOpen(true)
                    void roomDrafts.refresh()
                    void roomDrafts.refreshPeople()
                  }
                : undefined,
    copies: groupChats.copies,
    otherRoomsBefore: groupChats.before,
    otherRoomsAfter: groupChats.after,
    onOpenOtherRoom: openOtherRoom,
    copiesWaiting: copiesWaiting,
    onOpenCopy: copy => {
              setOpenCopy(copy.id)
              setOpenRoom(null)
              setSection('room')
            },
    work: workByBot,
  }

  return (
    <GlowContext.Provider value={glowOf}>
      {shownConfirm && !ring ? (
        <ConfirmPanel
          key={shownConfirm.prompt.id}
          item={shownConfirm}
          more={presented.waiting.length - 1}
          onAnswer={(outcome, text) => presented.answer(shownConfirm, outcome, text)}
          onEdit={
            shownConfirm.prompt.sessionId
              ? () => {
                  // Hermes hears the user wants changes; the chat opens with the preview to rework and send.
                  presented.answer(shownConfirm, 'edit')
                  setSelected({ id: shownConfirm.prompt.sessionId, profile: shownConfirm.profile === 'default' ? undefined : shownConfirm.profile })
                  setSection('chats')
                  setQuote(prefillRequest(shownConfirm.prompt.preview, botTitle))
                }
              : undefined
          }
        />
      ) : null}
      {ring ? <IncomingCall key={ring.id} ring={ring} onAnswer={() => answerRing(ring)} onDecline={missed => declineRing(ring, missed)} /> : null}
      {status.phase !== 'open' ? (
        <div className="banner" role="status">
          <span className={updateAway === 'updating' || updateAway === 'restarting' ? 'spinner' : 'dot warn'} />
          {updateAway
            ? updateAwayText(updateAway)
            : status.phase === 'connecting'
              ? t('Connecting to Hermes…')
              : `${status.error ?? t('Not connected.')}${status.retryInSeconds ? ` ${t('Trying again in {seconds}s.', { seconds: status.retryInSeconds })}` : ''}`}
          {status.phase === 'reconnecting' ? <button onClick={() => void window.conduit.reconnect()}>{t('Try now')}</button> : null}
          {status.phase === 'reconnecting' && status.url ? <button onClick={onRepair}>{t('Repair Connection')}</button> : null}
        </div>
      ) : null}
      <CrashReportBanner />
      <div
        className="body"
        style={
          {
            ...(listWidth !== null ? { '--list-width': `${listWidth}px` } : {}),
            ...(panelWidth !== null ? { '--panel-width': `${panelWidth}px` } : {})
          } as CSSProperties
        }
      >
        <nav className="rail" aria-label={t('Sections')}>
          {(section === 'chats' || section === 'room' || section === 'bots') && listHidden ? (
            <button
              className="railbtn rail-show-list"
              aria-label={t('Show Sidebar')}
              title={`${t('Show Sidebar')} (${glyphs('toggle-sidebar', window.conduit.platform === 'darwin')})`}
              onClick={() => hideList(false)}
            >
              <Icon name="chevronsRight" />
            </button>
          ) : null}
          <button
            className="railbtn"
            aria-label={t('Bots')}
            title={t('Bots')}
            aria-current={section === 'bots' || section === 'room' || (section === 'chats' && botsSideShown) ? 'page' : undefined}
            onClick={() => setSection('bots')}
          >
            <Icon name="bots" />
          </button>
          <button
            className="railbtn"
            aria-label={t('Chats')}
            title={t('Chats')}
            aria-current={section === 'chats' && !botsSideShown ? 'page' : undefined}
            onClick={() => {
              setBotsSide(false)
              setSection('chats')
            }}
          >
            <Icon name="chats" />
          </button>
          <button
            className="railbtn"
            aria-label={t('Tasks')}
            title={t('Tasks')}
            aria-current={section === 'tasks' ? 'page' : undefined}
            onClick={() => setSection('tasks')}
          >
            <Icon name="tasks" />
          </button>
          <button
            className="railbtn"
            aria-label={pulse.feed?.unseen ? t('Pulse, new cards') : t('Pulse')}
            title={t('Pulse')}
            aria-current={section === 'pulse' ? 'page' : undefined}
            onClick={() => setSection('pulse')}
          >
            <Icon name="pulse" />
            {pulse.feed?.unseen && section !== 'pulse' ? <span className="badge">{pulse.feed.unseen > 99 ? '99+' : pulse.feed.unseen}</span> : null}
          </button>
          <button
            className="railbtn"
            aria-label={t('Artifacts')}
            title={t('Artifacts')}
            aria-current={section === 'artifacts' ? 'page' : undefined}
            onClick={() => setSection('artifacts')}
          >
            <Icon name="paperclip" />
          </button>
          <button
            className="railbtn"
            aria-label={needsCount ? t('Needs you, {count}', { count: needsCount }) : t('Needs you')}
            title={t('Needs you')}
            aria-current={section === 'needs' ? 'page' : undefined}
            onClick={() => setSection('needs')}
          >
            <Icon name="bell" />
            {needsCount ? <span className="badge">{needsCount > 99 ? '99+' : needsCount}</span> : null}
          </button>
          <span className="spacer" />
          <button
            className="railbtn"
            aria-label={t('Settings')}
            title={t('Settings')}
            aria-current={section === 'settings' ? 'page' : undefined}
            onClick={() => setSection('settings')}
          >
            <Icon name="settings" />
          </button>
          <span
            className={`dot${connected ? '' : ' warn'}`}
            role="img"
            aria-label={connected ? t('Connected') : t('Not connected')}
            title={connected ? t('Connected to {host}', { host: status.hostLabel ?? '' }) : t('Not connected')}
          />
        </nav>
        {/* Chats stays mounted once shown, hidden while another section is open, so coming back doesn't rebuild every row and the open transcript. */}
        {chatsShown ? (
          <KeptPane away={section !== 'chats'} onShown={() => botSideScroll.opened()}>
            {/* The side pane's Bots list opens at the spot it shares with a group chat page's, which may have moved it meanwhile (desktop#256). */}
            {/* Hidden, the list stays mounted, so its search and an open project are there when it comes back. */}
            <div className="list-keeper" hidden={listHidden}>
              {projectsOpen ? (
                <ProjectsPane
                  profile={chatProfile}
                  connected={connected}
                  selectedId={chat.storedId ?? selected.id}
                  onSelect={item => setSelected({ id: item.id, profile: item.profile ?? chatProfile ?? undefined, title: item.title })}
                  onNewChat={folder => setSelected({ id: null, profile: chatProfile ?? undefined, folder })}
                  onClose={() => setProjectsOpen(false)}
                  isUnread={projectChatUnread}
                  runningIds={runningIds}
                  onHide={() => hideList(true)}
                />
              ) : botsSideShown && orderedRoster ? (
                <BotsHome
                  {...botsHomeProps}
                  side={dockedChat ? { openProfile: dockedChat.profile ?? 'default', openHost: dockedChat.host } : { openProfile: selected.profile ?? 'default' }}
                  onHide={() => hideList(true)}
                />
              ) : (
                <ChatList
                  rows={listedRows}
                  error={list.error}
                  updating={list.updating}
                  ownProfileOnly={list.ownProfileOnly}
                  unread={list.unread}
                  selectedId={dockedChat?.id ?? chat.storedId ?? selected.id}
                  runningIds={runningIds}
                  waitingIds={waitingIds}
                  runningStatus={runningStatus}
                  onSelect={selectRow}
                  onOpenBeside={besideFits ? openBeside : undefined}
                  onOpenInWindow={row => void popOut({ id: row.id, profile: row.profile, title: row.title, host: (row as Partial<OtherChatRow>).host })}
                  windowIds={chatWindowIds}
                  canOpenBeside={row => row.id !== selected.id && row.id !== beside?.id && sameProfileAs(row.profile, selected.profile)}
                  onNewChat={newChat}
                  bots={roster.bots}
                  profile={chatProfile}
                  onProfile={pickProfile}
                  otherProfile={otherProfile}
                  onEditProfile={connected ? editProfile : undefined}
                  profileTiles={profileTiles}
                  tileBadge={tileBadge}
                  otherWaits={otherWaits}
                  onOtherProfile={showOtherProfile}
                  onPin={row => void chatAction(row, { pinned: !row.pinned })}
                  onRename={(row, title) => void chatAction(row, { title })}
                  marks={marks}
                  onStar={row => updateMarks(current => toggleStar(current, row))}
                  onToggleRead={toggleRead}
                  isDone={chatDone.available ? isRowDone : undefined}
                  onDone={chatDone.available ? chatDone.toggle : undefined}
                  muteOf={chatMute.available ? rowMute : undefined}
                  onMute={chatMute.available ? chatMute.setMute : undefined}
                  onDelete={async row => {
                    if (await ask(`${t('Delete conversation?')}\n\n${t('This permanently deletes the conversation and cannot be undone.')}`, { confirm: t('Delete'), destructive: true }))
                      void chatAction(row, null)
                  }}
                  onProjects={() => setProjectsOpen(true)}
                  projects={projectFilter}
                  onNeedsYou={waiting.available || otherWaiting.length ? () => setSection('needs') : undefined}
                  searchScope={markHost}
                  onPinnedReplies={pins.length ? () => setPinSheet({ scope: 'all' }) : undefined}
                  moveTargets={moveTargets}
                  onMove={(row, target) => void moveToProject(row, target)}
                  otherRows={otherChats}
                  badgeFor={badgeFor}
                  onOpenOther={selectOtherRow}
                  onHide={() => hideList(true)}
                />
              )}
            </div>
            {listHidden ? null : (
              <ColumnDivider
                label={t('Chat list width')}
                bounds={LIST_COLUMN}
                sign={1}
                width={listWidth}
                onLive={setListLive}
                onCommit={commitList}
                onCollapse={() => hideList(true)}
              />
            )}
            {dockedChat ? <DockedChatPane key={dockedChat.host} chat={dockedChat} frame={dockedFrame} shown={dockedShown} onMoved={closeDocked} onCall={setDockedCalling} /> : null}
            {/* Kept while another dashboard's chat is docked over it, so coming back to it doesn't open it again. */}
            <main className="chat" ref={chatPane} style={dockedChat ? { display: 'none' } : undefined}>
              <ChatHeader
                title={title}
                workItem={workItem}
                // A Bot Chat's work is counted on the Work tab and the panel button (Eric, 2026-11-20), not again under its name.
                subtitle={
                  workItem && workBot
                    ? {
                        text: t('{bot}’s work · {ref}', { bot: workBot.title, ref: workItem.ref }),
                        title: t('Back to {bot}', { bot: workBot.title }),
                        onClick: () => {
                          if (workBot.botChatId) openBot(workBot)
                        }
                      }
                    : undefined
                }
                call={chatCall.header}
                newWindow={
                  selected.id && section === 'chats'
                    ? {
                        label: t('Open in New Window'),
                        title: calling ? t('End the call to move this chat to a window of its own') : `${t('Open in New Window')}: ${t('Moves this chat to a window of its own.')}`,
                        disabled: calling,
                        onClick: () =>
                          void popOut({
                            id: chat.storedId ?? selected.id!,
                            profile: selected.profile,
                            title: title || undefined,
                            botChat: selected.botChat === true
                          })
                      }
                    : undefined
                }
                screen={
                  screenHosts[screenProfile]
                    ? { label: t("Bot's Screen"), on: screenOpen, onClick: () => window.conduit.openScreenWindow({ profile: screenProfile, botName: botTitle, ...(status.url ? { host: status.url } : {}) }) }
                    : undefined
                }
                panel={
                  panelTabs.length
                    ? {
                        label: shownTab ? t('Hide side panel') : t('Show side panel'),
                        on: !!shownTab,
                        onClick: () => openTab(shownTab ? null : panelTabs.includes(lastTab.current) ? lastTab.current : panelTabs[0]),
                        dot: workDot && shownTab !== 'work' ? workDot : null
                      }
                    : undefined
                }
              />
              {/* A question the bot asked here that waits past its turn. */}
              <AskedQuestionBar rows={askedHere} onChanged={() => void waiting.refresh()} />
              <FileLinks.Provider value={openPath}>
                <WorkLinks.Provider value={workLinkActions}>
                  <ConnectionActionsContext.Provider value={connectionActions}>
                    <LiveTranscript
                      store={transcriptStore}
                      loading={loading}
                      error={error}
                      requests={openRequests}
                      expired={expiredQuestions}
                      profile={selected.profile}
                      author={botTitle}
                      face={chatFace}
                      onQuote={setQuote}
                      onCommand={text => void onSend(text)}
                      teammates={glowBots}
                      display={chatDisplay}
                      sessionId={chat.liveId ?? undefined}
                      calls={chatCallList}
                      onOpenCall={setOpenCall}
                      followedUp={followedUp}
                      pins={pinControls}
                      onReact={chat.liveId ? reactTo : undefined}
                      onBranch={chat.liveId && !running ? branchFrom : undefined}
                    />
                  </ConnectionActionsContext.Provider>
                </WorkLinks.Provider>
              </FileLinks.Provider>
              {pinSheet ? (
                <PinnedRepliesSheet
                  pins={pins}
                  open={{ profile: selected.profile, chat: pinChat }}
                  initialScope={pinSheet.scope}
                  editing={pinSheet.editing}
                  chatTitle={pinChatTitle}
                  onOpen={openPin}
                  onUnpin={pin => updatePins(current => current.filter(p => p.id !== pin.id))}
                  onLabel={(pin, label) => updatePins(current => current.map(p => (p.id === pin.id ? { ...p, label } : p)))}
                  onClose={() => setPinSheet(null)}
                />
              ) : null}
              {openCall && selected.id ? (
                <CallTranscriptSheet
                  profile={selected.profile}
                  chatId={selected.id}
                  callId={openCall}
                  onResume={!calling && connected && nextMode !== 'classic' ? call => resumeCall(openCall, call) : undefined}
                  onClose={() => setOpenCall(null)}
                />
              ) : null}
              {contextOpen && chat.liveId ? (
                <ContextPanel
                  chat={chat}
                  profile={selected.profile}
                  running={running}
                  onClose={closeContext}
                  onCompress={() => void onSend('/compress')}
                />
              ) : null}
              {modelOpen && chat.liveId ? (
                <ModelPicker
                  chat={chat}
                  profile={selected.profile}
                  onClose={closeModel}
                  setModel={setModel}
                  setReasoning={setReasoning}
                  setSpeed={setSpeed}
                  setYolo={setYolo}
                />
              ) : null}
              {chatCall.view({ requests: openRequests, onSend })}
              <ControlDock liveId={chat.liveId} profile={selected.profile} connected={connected} pulse={controlPulse} />
              <AgentsDock
                agents={delegates.agents}
                running={running}
                chatKey={selected.id ?? 'new'}
                steer={delegates.steer}
                stop={delegates.stop}
                tail={delegates.tail}
                processes={delegates.processes}
                kill={delegates.kill}
              />
              <PlanDock plan={shownPlan} running={running} chatKey={selected.id ?? 'new'} />
              {takeover ? (
                <div className="takeover-offer" role="status">
                  <span>{openElsewhereMessage(owner(takeover.surface))}</span>
                  <button
                    className="primary"
                    disabled={takeover.busy || !connected}
                    onClick={() => void takeOver().then(ready => ready && setSendNow(n => n + 1))}
                  >
                    {t('Take over this chat')}
                  </button>
                </div>
              ) : null}
              <ChatQueueDock
                rows={queue}
                chatKey={selected.id ?? 'new'}
                onSendNow={sendQueuedNow}
                onEdit={(row, text) => editQueued(row, withMentionNote(text, roster.bots, selected.profile ?? 'default'))}
                onCancel={cancelQueued}
                onDiscard={discardLost}
                onResend={async row => {
                  const words = await resendLost(row)
                  if (words) setQuote(prefillRequest(words, botTitle))
                }}
              />
              <Composer
                sendNow={sendNow}
                placeholder={t('Message {name}…', { name: botTitle })}
                quote={quote}
                commands={commands}
                onModel={
                  chat.liveId
                    ? () => {
                        setContextOpen(false)
                        setModelOpen(open => !open)
                      }
                    : undefined
                }
                context={chat.context}
                onContext={
                  chat.liveId
                    ? () => {
                        setModelOpen(false)
                        setContextOpen(open => !open)
                      }
                    : undefined
                }
                running={running}
                disabled={!connected}
                model={chat.model}
                cwd={chat.cwd}
                onSend={onSend}
                replies={predictions.replies}
                onDraftPause={predictions.askDraft}
                onDrafting={setDrafting}
                onSuggestion={text => void onSend(text, [])}
                onStop={() => void stop()}
                focusKey={selected.id ?? 'new'}
                draftKey={chatDraft(selected.profile, selected.id)}
                canAttach
                dropZone={chatPane}
                voice={calling ? undefined : { profile: selected.profile }}
                mentionBots={mentionBots}
              />
            </main>
            {dockedChat ? null : (artifactsOpen && selected.id) || showWork || (filesOpen && chat.cwd) || (beside && besideFits) ? (
              <ColumnDivider label={t('Side panel width')} bounds={PANEL_COLUMN} sign={-1} width={panelWidth} onLive={setPanelLive} onCommit={commitPanel} />
            ) : null}
            {dockedChat ? null : artifactsOpen && selected.id ? (
              <ArtifactsPanel
                profile={selected.profile}
                sessionIds={[selected.id]}
                refreshKey={turnsDone}
                folder={chat.cwd}
                onShowInFolder={path => {
                  setArtifactsOpen(false)
                  openPath?.(path)
                }}
                onOpenChat={item => showInChat(item.sessionId, item.messageId)}
                onClose={() => setArtifactsOpen(false)}
                tabs={panelTabBar}
              />
            ) : showWork ? (
              <WorkPanel
                key={selected.profile ?? 'default'}
                profile={selected.profile}
                botName={workBot?.title ?? 'Hermes'}
                snapshot={work.snapshot}
                error={work.error}
                onReload={() => void work.reload()}
                onAnswered={() => void waiting.refresh()}
                onOpenChat={item => setSelected({ id: item.sessionId, profile: selected.profile, title: shownTitle(item) })}
                onClose={() => setWorkOpen(false)}
                tabs={panelTabBar}
              />
            ) : filesOpen && chat.cwd ? (
              <FilesPanel
                root={chat.cwd}
                profile={selected.profile}
                refreshKey={turnsDone}
                reveal={reveal}
                onInsertPath={path => setQuote(quoteRequest({ insert: pathForDraft(path) }))}
                onClose={() => showFiles(false)}
                tabs={panelTabBar}
              />
            ) : beside && besideFits ? (
              <BesideChatPane
                key={beside.id}
                chat={beside}
                host={status.url ?? ''}
                sessionAuthority={status.sessionAuthority === true}
                connected={connected}
                author={besideBot?.title ?? 'Hermes'}
                face={besideFace}
                display={chatDisplay}
                onSwap={swapBeside}
                onClose={() => setBeside(null)}
                onOpenInWindow={() => void popOut(beside)}
              />
            ) : null}
          </KeptPane>
        ) : null}
        {/* A group chat, New Bot and Edit Bot keep the bots beside them, as an open Bot Chat does, hidden and shown with it (its « and the rail's »). */}
        {/* Hidden, it stays mounted, so a group chat being started in it keeps its picked bots and name. */}
        {section === 'room' || section === 'bots' ? (
          <div className="list-keeper" hidden={listHidden}>
            <BotsHome
              {...botsHomeProps}
              side={{ openRoomId: section === 'room' ? (shownCopy?.roomId ?? openRoom?.roomId ?? dockedRoom?.roomId) : undefined, openHost: section === 'room' && !shownCopy && !openRoom ? dockedRoom?.host : undefined, openProfile: editingBot?.name }}
              onHide={() => hideList(true)}
            />
          </div>
        ) : null}
        {section === 'chats' ? null : section === 'bots' && newBot ? (
          <NewBot
            bots={[...(roster.bots ?? []), ...roster.hidden]}
            protocol={roster.protocol}
            dashboards={newBotDashboards}
            onCreateElsewhere={createBotElsewhere}
            carried={carriedBot}
            onClose={() => {
              setNewBot(false)
              setCarriedBot(null)
            }}
            onCreated={(bot, introduce, warning) => {
              setNewBot(false)
              setCarriedBot(null)
              setBotNotice(warning)
              void roster.refresh()
              if (bot) {
                if (introduce) askBot(bot, t('Hey, tell me about yourself!'))
                else openBot(bot)
              }
            }}
          />
        ) : section === 'bots' && editingBot ? (
          <BotEditor key={editingBot.name} bot={editingBot} onClose={closeBotEditor} onSaved={() => void roster.refresh()} />
        ) : section === 'bots' ? null : section === 'tasks' ? (
          <Tasks
            bots={orderedRoster}
            connected={connected}
            profile={chatProfile}
            // Only the list's profile: picking one here doesn't open its chats.
            onProfile={setChatProfile}
            tiles={profileTiles}
            badgeFor={tileBadge}
            hostBadge={host => badgeFor(host ?? status.url ?? '')}
            onOpenRun={(run, job) => {
              if (!run.id) return
              // Another dashboard's run opens docked, on its kept connection, as its chats do.
              if (run.host) {
                openDocked({ host: run.host, id: run.id, profile: run.profile ?? job.profile, title: run.title })
                return
              }
              setSelected({ id: run.id, profile: run.profile ?? job.profile, title: run.title })
              setSection('chats')
            }}
          />
        ) : section === 'artifacts' ? (
          <main className="needs artifacts-section">
            <div className="needs-inner">
              <ArtifactsPanel
                page
                profile={chatProfile ?? undefined}
                sessionIds={[]}
                kept={keptHosts}
                dashboards={artifactDashboards}
                onOpenOtherChat={item =>
                  openOtherChat({ host: item.dashboard, id: item.sessionId, title: item.sessionTitle ?? '', profile: item.dashboardProfile, pinned: false })
                }
                onOpenChat={item => {
                  setSelected({ id: item.sessionId, profile: chatProfile ?? undefined, title: item.sessionTitle })
                  setSection('chats')
                  showInChat(item.sessionId, item.messageId)
                }}
              />
            </div>
          </main>
        ) : section === 'pulse' && shownPulseHost ? (
          <main className="needs pulse-page docked-pulse">
            {/* The chips sit over the frame on the page's own padding and column, so picking one moves nothing. */}
            <div className="docked-pulse-chips">
              <div className="needs-inner">
                <PulseHostChips chips={pulseHostChips} onPick={pickPulseHost} />
              </div>
            </div>
            <DockedPulseFrame key={shownPulseHost} host={shownPulseHost} />
          </main>
        ) : section === 'pulse' ? (
          <PulsePage
            pulse={pulse}
            onOpenChat={(target, draft) => {
              setSelected({ id: target.id, profile: target.profile, title: target.title })
              setSection('chats')
              if (draft) setQuote(quoteRequest({ draft }))
            }}
            onOpenBoard={() => setSection('tasks')}
            chips={pulseHostChips}
            onPickHost={pickPulseHost}
          />
        ) : section === 'room' && shownCopy && shownCopyRoom ? (
          <RoomView
            key={shownCopy.id}
            room={shownCopyRoom}
            readsStoredFiles={roomFilePictures && roomInvites.capabilities.includes(ROOM_FILES_LINKED_CAPABILITY)}
            people={{ canSetChoices: roomChoicesServed, freeBusy: roomInvites.freeBusy, canLeave: roomCopies.canLeave, onChanged: () => void roomCopies.refresh() }}
            looks={roomLooks.looks[shownCopy.roomId]}
            onOpenRoomChat={roomChatsServed ? (agent, wrapUp) => openRoomChatWith(shownCopyRoom, agent, wrapUp) : undefined}
            bots={roster.bots ?? []}
            connected={connected}
            canStop={false}
            canAttach={false}
            copy={shownCopy}
            onRefreshCopies={roomCopies.refresh}
            canPostInCopy={roomCopies.canPost}
            copyApprovals={shownCopyApprovals}
            copyAnswers={roomCopies.answers}
            onAnswerCopyApproval={(approval, choice) => void roomCopies.answer(approval, choice)}
            onLeaveCopy={
              canLeaveCopy(shownCopy, roomCopies.canLeave)
                ? async () => {
                    const kind = await roomCopies.leave(shownCopy)
                    void roomInvites.refresh()
                    return kind
                  }
                : undefined
            }
            onDeleteCopy={
              roomCopies.canForget
                ? async () => {
                    const invite = roomInvites.invites.find(i => i.id === shownCopy.id)
                    await roomCopies.remove(shownCopy, invite)
                    // Its invite, ended, would take its tile back.
                    if (invite) void roomInvites.remove(invite)
                    setOpenCopy(null)
                    setSection('bots')
                  }
                : undefined
            }
          />
        ) : section === 'room' && dockedRoom && !openRoom && !shownCopy ? (
          <main className="docked-chat docked-room" aria-label={dockedRoomListed ? (dockedRoomListed.kind === 'room' ? dockedRoomListed.room.name : copyRoom(dockedRoomListed.copy).name) : dockedRoom.title}>
            <DockedRoomFrame key={`${dockedRoom.host}\u0000${dockedRoom.kind}\u0000${dockedRoom.id}`} room={dockedRoom} onClosed={closeDockedRoom} />
          </main>
        ) : section === 'room' && openRoom ? (
          <RoomView
            key={openRoom.roomId}
            room={openRoom}
            storesFiles={roomFilesStored}
            people={{
              canSetChoices: roomChoicesServed,
              freeBusy: roomInvites.freeBusy,
              canLeave: roomInvites.capabilities.includes(ROOM_LEAVE_CAPABILITY),
              onChanged: () => void groupRooms.refresh()
            }}
            readsStoredFiles={roomFilePictures}
            looks={roomLooks.looks[openRoom.roomId]}
            onOpenRoomChat={roomChatsServed ? (agent, wrapUp) => openRoomChatWith(openRoom, agent, wrapUp) : undefined}
            bots={roster.bots ?? []}
            connected={connected}
            canStop={groupRooms.capabilities?.canStop === true}
            canAttach={groupRooms.capabilities?.attachments === true}
            canEditSettings={groupRooms.capabilities?.context === true}
            canContinueDiscussions={groupRooms.capabilities?.canContinue === true}
            canApprove={groupRooms.capabilities?.canApprove === true}
          />
        ) : section === 'needs' ? (
          <NeedsYou
            requests={requests}
            waiting={waitingRows}
            otherWaiting={otherWaiting}
            badgeFor={badgeFor}
            onOpenOther={openOtherWaiting}
            listAvailable={waiting.available}
            titleFor={titleFor}
            onOpen={openWaiting}
            onOpenLive={sessionId => {
              if (sessionId === chat.liveId) setSection('chats')
            }}
            openLiveId={chat.liveId}
          />
        ) : (
          <Settings
            status={status}
            onAddHost={() => {
              reopenSettings()
              onAddHost()
            }}
            onEditHost={host => {
              reopenSettings()
              onEditHost(host)
            }}
            bots={(roster.bots ?? []).map(bot => ({ name: bot.name, title: bot.title }))}
            profile={settingsProfile}
            profileTiles={profileTiles ?? []}
            tileBadge={tileBadge}
            onPickProfile={pickSettingsProfile}
            onEditProfile={connected && settingsBot ? () => editProfile(settingsBot) : undefined}
            chatScale={chatScale}
            setChatScale={setChatScale}
            onShortcuts={() => setShortcutsOpen(true)}
            appsRequest={appsRequest}
            onAppsRequestTaken={() => setAppsRequest(null)}
            modelsRequest={modelsRequest}
            onModelsRequestTaken={() => setModelsRequest(null)}
            linkRequest={linkRequest}
            onLinkRequestTaken={() => setLinkRequest(null)}
            personPicture={personPicture}
            onNewChatWith={
              connected
                ? draft => {
                    // A new chat's canvas: what's sent from it goes only into the chat it makes (A new chat that something waits on).
                    // In the profile the Calls page showed and edited (the resolved one, never a hidden or gone name).
                    setSelected({ id: null, profile: settingsProfile })
                    setSection('chats')
                    setQuote(quoteRequest({ draft }))
                  }
                : undefined
            }
          />
        )}
      </div>
      {shortcutsOpen ? <ShortcutsSheet onClose={closeShortcuts} /> : null}
      {shownInvite ? (
        <RoomInviteCard
          invite={shownInvite}
          bots={roster.bots}
          freeBusy={roomInvites.freeBusy}
          onAnswer={roomInvites.answer}
          onRemove={invite => void roomInvites.remove(invite)}
          onRefresh={roomInvites.refresh}
          onClose={() => setOpenInvite(null)}
        />
      ) : null}
      {newGroupOpen ? (
        <NewGroupChat
          bots={roster.bots ?? []}
          people={roomDrafts.people}
          ownBots={roomDrafts.ownBots}
          peopleOffered={roomDrafts.served && roomDrafts.read}
          startsUnavailable={roomDrafts.read && !roomDrafts.startsAvailable}
          canLink={roomInvites.capabilities.includes('room-links')}
          onCreateRoom={groupRooms.create}
          onCreateDraft={(name, agents, links, bring) => roomDrafts.create(name, agents, links, chatProfile ?? 'default', bring)}
          onOpenRoom={showRoom}
          onClose={() => setNewGroupOpen(false)}
        />
      ) : null}
      {shownDraft ? (
        <RoomDraftCard
          draft={shownDraft}
          rooms={groupRooms.rooms}
          onStart={roomDrafts.start}
          onWithdraw={roomDrafts.withdraw}
          onDismiss={roomDrafts.dismiss}
          onRefresh={refreshDraft}
          onOpenRoom={openDraftRoom}
          onClose={() => setOpenDraft(null)}
        />
      ) : null}
    </GlowContext.Provider>
  )
}

/** A Settings page of rows moved off Settings home: its title and Back, as the other pages have. */
function SettingsSubpage({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  useMouseBack(onBack)
  return (
    <div className="pset">
      <div className="pulse-head">
        <button className="staged-remove" aria-label={t('Back')} title={t('Back')} onClick={onBack}>
          <Icon name="back" />
        </button>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  )
}

/** Settings' scrolling pane, the same element for every page, so Back can put it where it was. */
function SettingsPane({ pane, children }: { pane: RefObject<HTMLElement | null>; children: ReactNode }) {
  return (
    <ScrollPane.Provider value={pane}>
      <main className="settings" ref={pane}>
        {children}
      </main>
    </ScrollPane.Provider>
  )
}

/** A Settings row that opens a page: the whole row is the button, its label on the left, what's inside on the right. */
function SettingsLink({ label, detail, disabled, onOpen }: { label: string; detail: string; disabled?: boolean; onOpen: () => void }) {
  return (
    <button className="settings-link" disabled={disabled} onClick={onOpen}>
      <span className="settings-link-label">{label}</span>
      <span className="settings-link-detail">
        <span>{detail}</span>
        <Icon name="chevron" />
      </span>
    </button>
  )
}

function Settings({
  status,
  onAddHost,
  onEditHost,
  bots,
  profile,
  profileTiles,
  tileBadge,
  onPickProfile,
  onEditProfile,
  chatScale,
  setChatScale,
  onShortcuts,
  appsRequest,
  onAppsRequestTaken,
  modelsRequest,
  onModelsRequestTaken,
  linkRequest,
  onLinkRequestTaken,
  personPicture,
  onNewChatWith
}: {
  status: ConnectionStatus
  onAddHost: () => void
  onEditHost: (host: HostSummary) => void
  bots: { name: string; title: string }[]
  profile: string
  /** Every profile Settings can switch to, every combined dashboard's included, in the Chats list's order. */
  profileTiles: readonly MixedTile[]
  tileBadge: (tile: MixedTile) => HostBadge | null
  onPickProfile: (tile: MixedTile) => void
  /** Settings > Edit profile: the profile in use, in Edit Bot. */
  onEditProfile?: () => void
  chatScale: number
  setChatScale: (scale: number) => void
  onShortcuts: () => void
  appsRequest: AppsRequest | null
  onAppsRequestTaken: () => void
  /** Settings > Models for this profile, asked from Group Settings. */
  modelsRequest: ModelsRequest | null
  onModelsRequestTaken: () => void
  /** A Link invite opened from another app: Multiplayer opens it. */
  linkRequest: { url: string; at: number } | null
  onLinkRequestTaken: () => void
  /** The picture you show in rooms over Links. */
  personPicture: PersonPicture
  /** A new chat with `draft` in its composer, for the user to send (Try a test call, Have Hermes watch for this). */
  onNewChatWith?: (draft: string) => void
}) {
  const kept = useKeptHosts()
  const keptState = (url: string) => kept.find(h => h.url === url)?.state ?? null
  const [notifications, setNotifications] = useState(notificationsEnabled)
  const [readAloudOn, setReadAloudOn] = useState(readsRepliesAloud)
  const [speed, setSpeed] = useState(readAloudSpeed)
  const [page, setPage] = useState<
    'main' | 'usage' | 'models' | 'capabilities' | 'memory' | 'workspace' | 'advanced' | 'chat' | 'plugin' | 'vault' | 'appearance' | 'multiplayer' | 'voice' | 'calls'
  >('main')
  // Back from a page lands where Settings was, on the row it was opened from.
  const pane = useRef<HTMLElement>(null)
  useBackScroll(page, pane)
  // Multiplayer shows while the host's plugin keeps Links.
  const [pluginCapabilities, setPluginCapabilities] = useState<string[]>([])
  const linksServed = pluginCapabilities.includes(ROOM_LINKS_CAPABILITY)
  useEffect(() => {
    if (status.phase !== 'open') return
    let live = true
    gateway
      .http('GET', PLUGIN_STATUS_PATH, undefined, 8_000)
      .then(body => {
        const plugin = pluginStatus(body)
        if (live) setPluginCapabilities(plugin.state === 'reported' ? plugin.capabilities : [])
      })
      .catch(() => undefined)
    return () => {
      live = false
    }
  }, [status.phase, status.url])
  // The apps card's ask, taken once: Capabilities opens on Browse Apps with its picks.
  const [apps, setApps] = useState<AppsRequest | null>(null)
  useEffect(() => {
    if (!appsRequest) return
    setApps(appsRequest)
    setPage('capabilities')
    onAppsRequestTaken()
  }, [appsRequest, onAppsRequestTaken])
  // A link into Models, taken once: it opens on that profile.
  const [modelsProfile, setModelsProfile] = useState<{ profile: string; n: number } | null>(null)
  useEffect(() => {
    if (!modelsRequest) return
    setModelsProfile(modelsRequest)
    setPage('models')
    onModelsRequestTaken()
  }, [modelsRequest, onModelsRequestTaken])
  // A Link invite from another app, taken once: Multiplayer opens on it.
  const [linkInvite, setLinkInvite] = useState<{ url: string; at: number } | null>(null)
  useEffect(() => {
    if (!linkRequest) return
    setLinkInvite(linkRequest)
    setPage('multiplayer')
    onLinkRequestTaken()
  }, [linkRequest, onLinkRequestTaken])
  if (page === 'voice')
    return (
      <SettingsPane pane={pane}>
        <SettingsSubpage title={t('Voice')} onBack={() => setPage('main')}>
          <dl className="settings-card">
            <dt>{t('Read Aloud')}</dt>
            <dd>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={readAloudOn}
                  onChange={e => {
                    setReadsRepliesAloud(e.target.checked)
                    setReadAloudOn(e.target.checked)
                  }}
                />
                {t('Read replies aloud')}
              </label>
              <p className="meta settings-caption">
                {t('Each reply in the open chat is read aloud as it finishes, in the voice below. Calls speak their own replies.')}
              </p>
              <span className="meta">{t('Speed')}</span>
              <div className="segmented" role="group" aria-label={t('Speed')}>
                {READ_ALOUD_SPEEDS.map(s => (
                  <button
                    key={s}
                    aria-pressed={speed === s}
                    onClick={() => {
                      setSpeed(s)
                      setReadAloudSpeed(s)
                    }}
                  >
                    {speedLabel(s)}
                  </button>
                ))}
              </div>
              <p className="meta settings-caption">
                {t('How fast a reply is read aloud, without changing the voice’s pitch. Applies from the next reply read, on this computer. Your speech server and voice calls always play at normal speed.')}
              </p>
              <ReadAloudVoiceSetting profile={profile} />
              <VoiceModeSettings profile={profile} />
            </dd>
            {status.url ? (
              <>
                <dt>{t('Wake phrase')}</dt>
                <dd>
                  <WakePhraseSettings host={status.url} profile={profile} />
                </dd>
              </>
            ) : null}
          </dl>
        </SettingsSubpage>
      </SettingsPane>
    )
  if (page === 'calls')
    return (
      <SettingsPane pane={pane}>
        <SettingsSubpage title={t('Calls from Hermes')} onBack={() => setPage('main')}>
          <div className="settings-card settings-card-single">
            <HermesCallSettings profile={profile} onNewChat={onNewChatWith} />
          </div>
        </SettingsSubpage>
      </SettingsPane>
    )
  if (page === 'usage')
    return (
      <SettingsPane pane={pane}>
        <UsagePage bots={bots} profile={profile} onBack={() => setPage('main')} />
      </SettingsPane>
    )
  if (page === 'models')
    return (
      <SettingsPane pane={pane}>
        <ModelsPage
          key={modelsProfile ? `link:${modelsProfile.n}` : 'models'}
          bots={bots}
          profile={modelsProfile?.profile ?? profile}
          onBack={() => {
            setModelsProfile(null)
            setPage('main')
          }}
        />
      </SettingsPane>
    )
  if (page === 'appearance')
    return (
      <SettingsPane pane={pane}>
        <AppearancePage host={status.url ?? ''} onBack={() => setPage('main')} />
      </SettingsPane>
    )
  if (page === 'multiplayer' && status.url)
    return (
      <SettingsPane pane={pane}>
        <MultiplayerPage
          host={status.url}
          capabilities={pluginCapabilities}
          bots={bots}
          profile={profile}
          invite={linkInvite}
          personPicture={personPicture}
          onBack={() => setPage('main')}
        />
      </SettingsPane>
    )
  if (page === 'vault')
    return (
      <SettingsPane pane={pane}>
        <VaultPage bots={bots} profile={profile} onBack={() => setPage('main')} />
      </SettingsPane>
    )
  if (page === 'plugin')
    return (
      <SettingsPane pane={pane}>
        <ConduitPluginPage onBack={() => setPage('main')} />
      </SettingsPane>
    )
  if (page === 'chat')
    return (
      <SettingsPane pane={pane}>
        <ConfigPage
          title={t('Chat')}
          subtitle={t('Response behavior, visibility, and timezone')}
          sections={chatSections}
          bots={bots}
          profile={profile}
          onBack={() => setPage('main')}
        >
          <TakeoverSettings />
          <StepSummarySettings />
          <PredictiveSettings />
        </ConfigPage>
      </SettingsPane>
    )
  if (page === 'workspace' || page === 'advanced')
    return (
      <SettingsPane pane={pane}>
        <ConfigPage
          key={page}
          title={page === 'workspace' ? t('Workspace & safety') : t('Advanced')}
          subtitle={
            page === 'workspace'
              ? t('Working defaults and safeguards for this profile.')
              : t('Limits and runtime defaults for this profile. Most profiles never need to change these.')
          }
          sections={page === 'workspace' ? workspaceSections : advancedSections}
          bots={bots}
          profile={profile}
          onBack={() => setPage('main')}
        />
      </SettingsPane>
    )
  if (page === 'memory')
    return (
      <SettingsPane pane={pane}>
        <MemoryPage bots={bots} profile={profile} onBack={() => setPage('main')} />
      </SettingsPane>
    )
  if (page === 'capabilities')
    return (
      <SettingsPane pane={pane}>
        <CapabilitiesPage
          bots={bots}
          profile={profile}
          host={status.url}
          apps={apps}
          onBack={() => {
            setApps(null)
            setPage('main')
          }}
        />
      </SettingsPane>
    )
  const methods = { password: t('User name and password'), token: t('Session token'), open: t('No sign-in') }
  const settingsBadge = (url: string) => hostBadge(status.hosts ?? [], url, hostName)
  return (
    <SettingsPane pane={pane}>
      <h1>{t('Settings')}</h1>
      <SettingsProfileCard tiles={profileTiles} profile={profile} badgeFor={tileBadge} onPick={onPickProfile} onEditProfile={onEditProfile} />
      <section className="settings-group">
        <h2>{t('Connection')}</h2>
        <dl className="settings-card">
          <dt>{t('Connection')}</dt>
          <dd>
            {status.phase === 'open' ? t('Connected') : status.phase === 'connecting' ? t('Connecting…') : t('Not connected')}
            {status.phase === 'open' && status.sessionAuthority ? ` · ${t('session authority')}` : ''}
          </dd>
          <dt>Hermes</dt>
          <dd>
            <ul className="hosts">
              {(status.hosts?.length ? status.hosts : status.url ? [{ url: status.url, method: status.method ?? 'open', username: status.username }] : []).map(
                host => (
                  <li key={host.url} className={host.url === status.url ? 'current' : undefined}>
                    {settingsBadge(host.url) ? <HostBadgeMark badge={settingsBadge(host.url)!} /> : null}
                    <span className="host-label" title={host.url}>
                      {hostName(host.url)}
                    </span>
                    {host.username ? <span className="meta">{host.username}</span> : null}
                    <span className="spacer" />
                    <button
                      className="link"
                      onClick={async () => {
                        const name = await askText(
                          `${t('Rename Dashboard')}\n\n${t("Its badge shows the name's first letter. Leave it empty to go back to the automatic name.")}`,
                          host.named ? hostName(host.url) : '',
                          { confirm: t('Save'), maxLength: HOST_NAME_MAX }
                        )
                        if (name !== null) void window.conduit.renameHost(host.url, name)
                      }}
                    >
                      {t('Rename')}
                    </button>
                    {host.url === status.url ? (
                      <>
                        <span className="meta">{t('In use')}</span>
                        <button className="link" onClick={() => onEditHost(host)}>
                          {t('Connection Setup')}
                        </button>
                      </>
                    ) : keptState(host.url) ? (
                      <span className="meta">{keptStateLabel(keptState(host.url)!)}</span>
                    ) : null}
                    {host.url === status.url ? null : (
                      <button className="link" onClick={() => void switchEndingCall(hostName(host.url)).then(ok => ok && window.conduit.switchHost(host.url))}>
                        {t('Switch')}
                      </button>
                    )}
                    {host.url !== status.url ? (
                      <button
                        className="link danger"
                        onClick={async () => {
                          if (await ask(t('Sign out of {host} on this computer?', { host: hostName(host.url) }))) {
                            composerDrafts.dropHost(host.url)
                            void window.conduit.removeHost(host.url)
                          }
                        }}
                      >
                        {t('Sign out')}
                      </button>
                    ) : null}
                  </li>
                )
              )}
            </ul>
            <button className="link add-host" onClick={onAddHost}>
              {t('Add another Hermes…')}
            </button>
          </dd>
          <dt>{t('Dashboard')}</dt>
          <dd>{status.url}</dd>
          <dt>{t('Signed in with')}</dt>
          <dd>
            {status.method ? methods[status.method] : '—'}
            {status.username ? ` (${status.username})` : ''}{' '}
            {/* Sign out sits with how you signed in, where Eric looked for it (2026-11-21). */}
            <button
              className="link danger"
              onClick={() => {
                composerDrafts.dropHost(status.url ?? '')
                void window.conduit.signOut()
              }}
            >
              {(status.hosts?.length ?? 0) > 1 ? t('Sign out of {host}', { host: status.hostLabel ?? '' }) : t('Sign out')}
            </button>
          </dd>
          {status.url ? <HostActions host={status.url} connected={status.phase === 'open'} /> : null}
        </dl>
      </section>
      <section className="settings-group">
        <h2>Hermes</h2>
        <dl className="settings-card">
          <SettingsLink label={t('Models')} detail={t('Chat model and helper models')} disabled={status.phase !== 'open'} onOpen={() => setPage('models')} />
          <SettingsLink label={t('Usage')} detail={t('Tokens, cost and provider quota')} disabled={status.phase !== 'open'} onOpen={() => setPage('usage')} />
          <SettingsLink label={t('Chat')} detail={t('Response behavior, visibility, and timezone')} disabled={status.phase !== 'open'} onOpen={() => setPage('chat')} />
          <SettingsLink label={t('Workspace & safety')} detail={t('Working directory, approvals, and privacy')} disabled={status.phase !== 'open'} onOpen={() => setPage('workspace')} />
          <SettingsLink label={t('Memory & delegation')} detail={t('Memory, compression, and child agents')} disabled={status.phase !== 'open'} onOpen={() => setPage('memory')} />
          <SettingsLink label={t('Advanced')} detail={t('Turn limits, terminal, and tool output')} disabled={status.phase !== 'open'} onOpen={() => setPage('advanced')} />
          <SettingsLink label={t('Capabilities')} detail={t('Skills, tools, connectors, and plugins')} disabled={status.phase !== 'open'} onOpen={() => setPage('capabilities')} />
          <SettingsLink label={t('Passwords & logins')} detail={t('Logins, cards and password managers Hermes signs in with')} disabled={status.phase !== 'open'} onOpen={() => setPage('vault')} />
          {linksServed ? (
            <SettingsLink label={t('Multiplayer')} detail={t("Rooms with other people's agents")} disabled={status.phase !== 'open'} onOpen={() => setPage('multiplayer')} />
          ) : null}
          <SettingsLink label={t('Conduit plugin')} detail={t('Version, updates and what it does here')} disabled={status.phase !== 'open'} onOpen={() => setPage('plugin')} />
        </dl>
      </section>
      <section className="settings-group">
        <h2>{t('Voice')}</h2>
        <dl className="settings-card">
          <SettingsLink label={t('Voice')} detail={t('Speech providers, credentials, and device opt-in')} onOpen={() => setPage('voice')} />
          <SettingsLink label={t('Calls from Hermes')} detail={t('When Hermes may phone you')} onOpen={() => setPage('calls')} />
        </dl>
      </section>
      <section className="settings-group">
        <h2>{t('App')}</h2>
        <dl className="settings-card">
          <SettingsLink label={t('Appearance')} detail={t('Choose how Conduit appears across the app.')} onOpen={() => setPage('appearance')} />
          <dt>{t('Chat text size')}</dt>
          <dd>
            <input
              className="text-size-slider"
              type="range"
              min={0}
              max={SCALES.length - 1}
              step={1}
              value={Math.max(0, SCALES.indexOf(chatScale))}
              onChange={e => setChatScale(SCALES[Number(e.target.value)] ?? 1)}
              aria-label={t('Chat text size')}
            />
            <span className="meta">{Math.round(chatScale * 100)}%</span>
          </dd>
          <dt>{t('Notifications')}</dt>
          <dd>
            <label className="toggle">
              <input
                type="checkbox"
                checked={notifications}
                onChange={e => {
                  setNotificationsEnabled(e.target.checked)
                  setNotifications(e.target.checked)
                }}
              />
              {t('When a reply finishes or something needs you in a chat you’re not looking at')}
            </label>
          </dd>
          <dt>{t('Language')}</dt>
          <dd>
            <Select
              className="language-select"
              value={window.conduit.language.choice}
              onChange={picked => {
                // The window reloads in the new language; come back to Settings.
                try {
                  sessionStorage.setItem(REOPEN_SECTION, 'settings')
                } catch {
                  // Opens on Chats instead.
                }
                window.conduit.setLanguage(picked as LanguageChoice)
              }}
              aria-label={t('Language')}
            >
              <option value="system">{t('Same as this computer')}</option>
              {LANGUAGES.map(language => (
                <option key={language} value={language} lang={language}>
                  {LANGUAGE_NAMES[language]}
                </option>
              ))}
            </Select>
          </dd>
          <SettingsLink label={t('Keyboard')} detail={t('Keyboard Shortcuts')} onOpen={onShortcuts} />
          <AppLockSetting />
          <AskDashboardSetting hosts={status.hosts?.length ?? 0} />
          <CombineDashboardsSetting hosts={status.hosts ?? []} />
          <UpdatesSetting />
        </dl>
      </section>
      <section className="settings-group">
        <h2>{t('Support')}</h2>
        <dl className="settings-card">
          <dt>{t('Last live call')}</dt>
          <dd>
            <LastCallTrace />
            <p className="meta">{t('The steps of the last Grok Live, Qwen Live, Local Live or GPT-Live call, without what was said, to paste into an issue.')}</p>
          </dd>
          <dt>{t('Last Read Aloud')}</dt>
          <dd>
            <LastCallTrace reading />
            <p className="meta">{t('How the last reply read aloud went: the voice and playback, without the reply’s words, to paste into an issue.')}</p>
          </dd>
          <dt>{t('Device reports')}</dt>
          <dd>
            <DeviceReportsSetting />
            <p className="meta">
              {t(
                'When part of Conduit stops or the window stops responding, it keeps a report of which part and why, never your messages, and asks once before sending it to Conduit’s developer.'
              )}
            </p>
          </dd>
        </dl>
      </section>
    </SettingsPane>
  )
}
