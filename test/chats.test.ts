import { describe, expect, it } from 'vitest'
import { chatListPath, isLegacyKanbanWorker, keepSameRows, mergeRows, refreshFirstPage, responseCount, rowsFromResponse, sameRow, sectionRows, toMillis, unreadProfiles, type ChatRow } from '../src/renderer/src/state/chats'

const now = new Date(2026, 10, 18, 15, 0).getTime()
const hoursAgo = (h: number) => (now - h * 3_600_000) / 1000

describe('chat rows', () => {
  it('leaves out Kanban workers stored before the tag, as the phone tells them', () => {
    expect(isLegacyKanbanWorker('cli', 'work kanban task t_9f2c')).toBe(true)
    expect(isLegacyKanbanWorker('local', '  Work Kanban Task t_9f2c ')).toBe(true)
    // A Telegram row that only reads the same is a chat, and so is a longer sentence.
    expect(isLegacyKanbanWorker('telegram', 'work kanban task t_9f2c')).toBe(false)
    expect(isLegacyKanbanWorker('cli', 'work kanban task t_9f2c and then tell me')).toBe(false)
    expect(isLegacyKanbanWorker('cli', 'work kanban task ')).toBe(false)
    const rows = rowsFromResponse({ sessions: [{ id: 'w', source: 'cli', preview: 'work kanban task t_1' }, { id: 'c', source: 'cli', preview: 'hello' }, { id: 'k', source: 'kanban' }] })
    expect(rows.map(r => r.id)).toEqual(['c'])
  })

  it('reads dashboard rows, leaves out non-chats and duplicates', () => {
    const rows = rowsFromResponse({
      sessions: [
        { id: 'a', title: 'Q3 spending', preview: 'Total\nthe quarter', last_active: hoursAgo(1), profile: 'default', pinned: false },
        { id: 'a', title: 'duplicate' },
        { id: 'b', title: '', preview: 'Untitled one', started_at: hoursAgo(30), profile: 'furina', pinned: 1 },
        { id: 'c', title: 'Nightly backup', source: 'cron', last_active: hoursAgo(2) }
      ]
    })
    expect(rows).toEqual([
      { id: 'a', title: 'Q3 spending', preview: 'Total the quarter', activeAt: now - 3_600_000, profile: 'default', pinned: false, source: undefined, sourceKind: 'chat', messageCount: undefined },
      { id: 'b', title: 'Untitled one', preview: undefined, activeAt: now - 30 * 3_600_000, profile: 'furina', pinned: true, source: undefined, sourceKind: 'chat', messageCount: undefined }
    ])
  })

  it('reads the gateway list shape too', () => {
    expect(rowsFromResponse({ sessions: [{ id: 'x', title: 'Hi', started_at: 1 }] })[0]?.id).toBe('x')
  })

  it('takes seconds, milliseconds and finer units', () => {
    expect(toMillis(1_763_000_000)).toBe(1_763_000_000_000)
    expect(toMillis(1_763_000_000_000)).toBe(1_763_000_000_000)
    expect(toMillis(1_763_000_000_000_000)).toBeCloseTo(1_763_000_000_000)
    expect(toMillis(0)).toBeUndefined()
  })

  it('groups pinned first, then by day', () => {
    const rows = rowsFromResponse({
      sessions: [
        { id: 'old', title: 'Old', last_active: hoursAgo(24 * 20) },
        { id: 'today', title: 'Today', last_active: hoursAgo(2) },
        { id: 'pin', title: 'Pinned', last_active: hoursAgo(24 * 40), pinned: true },
        { id: 'yday', title: 'Yesterday', last_active: hoursAgo(20) },
        { id: 'week', title: 'Week', last_active: hoursAgo(24 * 4) }
      ]
    })
    expect(sectionRows(rows, now).map(s => [s.title, s.rows.map(r => r.id)])).toEqual([
      ['Pinned', ['pin']],
      ['Today', ['today']],
      ['Yesterday', ['yday']],
      ['Previous 7 days', ['week']],
      ['Older', ['old']]
    ])
  })
})

describe('chat list pages', () => {
  const row = (id: string, activeAt: number) => ({ id, title: id, pinned: false, activeAt })

  it('asks for each page by offset', () => {
    expect(chatListPath(400)).toContain('limit=200&offset=400')
  })

  it('counts a page before any rows are left out', () => {
    expect(responseCount({ sessions: [{ id: 'a', source: 'cron' }, { id: 'b' }] })).toBe(2)
    expect(responseCount([{}, {}, {}])).toBe(3)
    expect(responseCount(null)).toBe(0)
  })

  it('adds a later page without repeating a chat that moved up', () => {
    expect(mergeRows([row('a', 3), row('b', 2)], [row('b', 2), row('c', 1)]).map(r => r.id)).toEqual(['a', 'b', 'c'])
  })

  it('refreshes the first page over the older pages already read', () => {
    const existing = [row('a', 50), row('b', 40), row('c', 10), row('d', 5)]
    const page = [row('new', 60), row('a', 55), row('b', 40)]
    expect(refreshFirstPage(existing, page, true).map(r => r.id)).toEqual(['new', 'a', 'b', 'c', 'd'])
    expect(refreshFirstPage(existing, page, false).map(r => r.id)).toEqual(['new', 'a', 'b'])
  })

  it('cleans previews', () => {
    const [r] = rowsFromResponse([{ id: 'x', title: 'Report', preview: '@file:/tmp/q.pdf\nSummarize this' }])
    expect(r?.preview).toBe('Summarize this')
  })
})

describe('a refresh over the rows shown', () => {
  const row = (id: string, title = id, activeAt = 1): ChatRow => ({ id, title, activeAt, pinned: false })
  it('keeps each row that says the same, and the list when nothing changed', () => {
    const before = [row('a'), row('b')]
    expect(keepSameRows(before, [row('a'), row('b')])).toBe(before)
    const after = keepSameRows(before, [row('a'), row('b', 'renamed')])
    expect(after).not.toBe(before)
    expect(after[0]).toBe(before[0])
    expect(after[1]!.title).toBe('renamed')
    const moved = keepSameRows(before, [row('b'), row('a')])
    expect(moved.map(r => r.id)).toEqual(['b', 'a'])
    expect(moved[0]).toBe(before[1])
    expect(keepSameRows(before, [row('a')])).toEqual([before[0]])
    expect(keepSameRows(null, before)).toBe(before)
  })
  it('tells a field added or dropped', () => {
    expect(sameRow(row('a'), { ...row('a'), unread: true })).toBe(false)
    expect(sameRow({ ...row('a'), preview: 'x' }, { ...row('a'), preview: 'x' })).toBe(true)
  })
})

describe('the saved list against a fresh read', () => {
  it('counts a key the JSON dropped the same as an undefined one', () => {
    const fresh: ChatRow = { id: 'a', title: 'A', preview: undefined, activeAt: 1, pinned: false }
    const saved = JSON.parse(JSON.stringify(fresh)) as ChatRow
    expect(sameRow(saved, fresh)).toBe(true)
    expect(keepSameRows([saved], [fresh])[0]).toBe(saved)
  })
})

describe('the profiles the every-profile list could not read (desktop#400)', () => {
  it('names each one Hermes reported, with its reason', () => {
    expect(unreadProfiles({ sessions: [], errors: [{ profile: 'atlas', error: 'database is locked' }] })).toEqual([
      { profile: 'atlas', error: 'database is locked' }
    ])
  })

  it('marks a profile whose store Hermes latched as damaged', () => {
    expect(unreadProfiles({ sessions: [], storage: { furina: 'corrupt' } })).toEqual([{ profile: 'furina', corrupt: true }])
  })

  it('says a damaged store is damaged, with the reason Hermes gave too', () => {
    const body = { sessions: [], errors: [{ profile: 'atlas', error: 'database is locked' }], storage: { atlas: 'corrupt' } }
    expect(unreadProfiles(body)).toEqual([{ profile: 'atlas', error: 'database is locked', corrupt: true }])
  })

  it('reads nothing into an answer that names none, a store that is fine, or a row that names no profile', () => {
    expect(unreadProfiles({ sessions: [] })).toEqual([])
    expect(unreadProfiles({ sessions: [], errors: [], storage: { atlas: 'ok' } })).toEqual([])
    expect(unreadProfiles([{ id: 'a1', profile: 'atlas' }])).toEqual([])
    expect(unreadProfiles({ sessions: [], errors: [{ error: 'x' }, 'atlas', null] })).toEqual([])
  })

  it('keeps a profile Hermes named with no reason, since its chats are gone from the answer all the same', () => {
    // Hermes writes the reason from the exception’s message, which can be empty.
    expect(unreadProfiles({ sessions: [], errors: [{ profile: 'atlas' }, { profile: 'ops', error: '' }] })).toEqual([
      { profile: 'atlas' },
      { profile: 'ops' }
    ])
  })
})
