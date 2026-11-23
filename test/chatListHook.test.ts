// @vitest-environment happy-dom
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, settle } from './hookHarness'
import { useChatList } from '../src/renderer/src/state/useChatList'

type Listener = (event: { type: string }) => void
let pages: unknown[] = []
let listeners: Listener[] = []

beforeEach(() => {
  vi.useFakeTimers()
  pages = []
  listeners = []
  localStorage.clear()
  ;(window as unknown as { conduit: unknown }).conduit = {
    httpOutcome: async (_method: string, path: string) =>
      path.includes('archived=only') ? { ok: true, result: { sessions: [] } } : { ok: true, result: pages.shift() ?? { sessions: [] } },
    onEvent: (listener: Listener) => {
      listeners.push(listener)
      return () => (listeners = listeners.filter(l => l !== listener))
    }
  }
})
afterEach(() => vi.useRealTimers())

const page = (...titles: string[]) => ({ sessions: titles.map((title, i) => ({ id: `s${i}`, title, last_active: 100 - i, message_count: 2 })) })

async function changed() {
  act(() => listeners.forEach(l => l({ type: 'sessions.changed' })))
  await act(async () => {
    vi.advanceTimersByTime(400)
  })
  await settle()
}

describe("the chat list's refresh (desktop#218)", () => {
  it('keeps the list and its saved copy when nothing changed', async () => {
    pages.push(page('One', 'Two'))
    const hook = renderHook(({ connected }: { connected: boolean }) => useChatList(connected, 'https://h'), { connected: true })
    await settle()
    const first = hook.result().rows
    expect(first?.map(r => r.title)).toEqual(['One', 'Two'])
    const save = vi.spyOn(localStorage, 'setItem')

    pages.push(page('One', 'Two'))
    await changed()
    expect(hook.result().rows).toBe(first)
    expect(save).not.toHaveBeenCalled()

    pages.push(page('One', 'Renamed'))
    await changed()
    expect(hook.result().rows?.map(r => r.title)).toEqual(['One', 'Renamed'])
    expect(save).toHaveBeenCalledTimes(1)
    hook.unmount()
  })
})

/** What the dashboard answers the every-profile list with: a body, or a refusal, as the bridge hands it on. */
type Answer = { body: unknown } | { failed: { error: string; code?: unknown } }
const every = { sessions: [
  { id: 'a1', title: 'Atlas chat', profile: 'atlas', last_active: 400, message_count: 2 },
  { id: 'f1', title: 'Furina chat', profile: 'furina', last_active: 300, message_count: 2 }
] }
/** What the gateway's `session.list` answers: its own profile's chats, on rows that name no profile. */
const ownList = { sessions: [{ session_id: 'f1', title: 'Furina chat', last_active: 300, message_count: 2 }] }

/** A request’s answer: given at once, or once a test lets it. */
type Reply = Answer | (() => Promise<Answer>)
const answered = async (reply: Reply): Promise<Answer> => (typeof reply === 'function' ? reply() : reply)

/** A request’s answer, held until the test gives it. */
function held() {
  let release!: (answer: Answer) => void
  const promise = new Promise<Answer>(resolve => (release = resolve))
  return { promise, release }
}

/** A dashboard answering `answers` and its gateway `own` in order (the last of each again and again), counting what it was asked. */
function dashboard(answers: Reply[], own: Reply[] = [{ body: ownList }]): { every: number; own: number } {
  const calls = { every: 0, own: 0 }
  ;(window as unknown as { conduit: unknown }).conduit = {
    httpOutcome: async (_method: string, path: string) => {
      if (path.includes('archived=only')) return { ok: true, result: { sessions: [] } }
      const reply = answers[Math.min(calls.every, answers.length - 1)]!
      calls.every++
      const answer = await answered(reply)
      return 'failed' in answer ? { ok: false, ...answer.failed } : { ok: true, result: answer.body }
    },
    rpcOutcome: async () => {
      const reply = own[Math.min(calls.own, own.length - 1)]!
      calls.own++
      const answer = await answered(reply)
      return 'failed' in answer ? { ok: false, ...answer.failed } : { ok: true, result: answer.body }
    },
    onEvent: (listener: Listener) => {
      listeners.push(listener)
      return () => (listeners = listeners.filter(l => l !== listener))
    }
  }
  return calls
}

async function wait(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms)
  })
  await settle()
}

describe('a chat list the dashboard could not answer (desktop#400)', () => {
  it('reads every profile through the dashboard, and names the profiles whose chats it could not read', async () => {
    const answers: Answer[] = [{ body: { ...every, errors: [{ profile: 'coder', error: 'database is locked' }], storage: { ops: 'corrupt' } } }]
    const calls = dashboard(answers)
    const hook = renderHook(() => useChatList(true, 'https://h'), {})
    await settle()
    expect(hook.result().rows?.map(r => r.profile)).toEqual(['atlas', 'furina'])
    expect(hook.result().ownProfileOnly).toBe(false)
    expect(hook.result().unread).toEqual([{ profile: 'coder', error: 'database is locked' }, { profile: 'ops', corrupt: true }])
    expect(calls.own).toBe(0)
    // The same answer again changes nothing; an answer that leaves them out does.
    const unread = hook.result().unread
    await changed()
    expect(hook.result().unread).toBe(unread)
    answers[0] = { body: every }
    await changed()
    expect(hook.result().unread).toEqual([])
    hook.unmount()
  })

  it('a read that fails is no older dashboard: the list says so, never passing the gateway’s own off as everyone’s, and reads again', async () => {
    // A timeout’s abort carries a code of its own (23), which is no HTTP status.
    const calls = dashboard([{ failed: { error: 'The operation was aborted due to timeout', code: 23 } }, { body: every }])
    const hook = renderHook(() => useChatList(true, 'https://h'), {})
    await settle()
    expect(hook.result().rows).toBeNull()
    expect(hook.result().error).toBe('The operation was aborted due to timeout')
    expect(hook.result().ownProfileOnly).toBe(false)
    expect(calls.own).toBe(0)
    // Five seconds later, as the phone’s list tries again, and the dashboard answers now.
    await wait(4_999)
    expect(calls.every).toBe(1)
    await wait(1)
    expect(calls.every).toBe(2)
    expect(hook.result().rows?.map(r => r.profile)).toEqual(['atlas', 'furina'])
    expect(hook.result().error).toBeNull()
    hook.unmount()
  })

  it('a change read that fails keeps the chats shown, in place of the gateway’s own', async () => {
    const calls = dashboard([{ body: every }, { failed: { error: 'The operation was aborted due to timeout', code: 23 } }])
    const hook = renderHook(() => useChatList(true, 'https://h'), {})
    await settle()
    const shown = hook.result().rows
    await changed()
    expect(hook.result().rows).toBe(shown)
    expect(hook.result().error).toBe('The operation was aborted due to timeout')
    expect(calls.own).toBe(0)
    hook.unmount()
  })

  it('a stale read that found no every-profile list does not decide that for a newer read that found it', async () => {
    const first = held()
    const second = held()
    const calls = dashboard([() => first.promise, () => second.promise])
    const hook = renderHook(() => useChatList(true, 'https://h'), {})
    await settle()
    // The first read is still out when Hermes says the sessions changed, so a second starts beside it.
    await changed()
    expect(calls.every).toBe(2)
    // The first, now stale, hears there is no every-profile list; the second hears every profile’s chats.
    first.release({ failed: { error: 'Not Found', code: 404 } })
    await settle()
    second.release({ body: every })
    await settle()
    expect(hook.result().rows?.map(r => r.profile)).toEqual(['atlas', 'furina'])
    expect(hook.result().ownProfileOnly).toBe(false)
    expect(hook.result().error).toBeNull()
    // Only the stale read asked the gateway’s own list, on its way out.
    expect(calls.own).toBe(1)
    // The read after that asks the every-profile list again, as the newest read found it.
    await changed()
    expect(calls.every).toBe(3)
    expect(hook.result().rows?.map(r => r.profile)).toEqual(['atlas', 'furina'])
    hook.unmount()
  })

  it('only a dashboard without the every-profile list (a 404) is read through the gateway’s own, and the list says so', async () => {
    const calls = dashboard([{ failed: { error: 'Not Found', code: 404 } }])
    const hook = renderHook(() => useChatList(true, 'https://h'), {})
    await settle()
    expect(calls.own).toBe(1)
    expect(hook.result().rows?.map(r => r.title)).toEqual(['Furina chat'])
    expect(hook.result().ownProfileOnly).toBe(true)
    expect(hook.result().unread).toEqual([])
    // On that connection a change reads the gateway’s own list straight off.
    await changed()
    expect(calls.every).toBe(1)
    expect(calls.own).toBe(2)
    hook.unmount()
  })

  it('a dashboard without the every-profile list whose gateway list fails is tried again too, asking for the every-profile list each time', async () => {
    const calls = dashboard(
      [{ failed: { error: 'Not Found', code: 404 } }],
      [{ failed: { error: 'gateway restarting' } }, { failed: { error: 'gateway restarting' } }, { body: ownList }]
    )
    const hook = renderHook(() => useChatList(true, 'https://h'), {})
    await settle()
    expect(hook.result().error).toBe('gateway restarting')
    expect(hook.result().rows).toBeNull()
    expect(hook.result().ownProfileOnly).toBe(false)
    await wait(5_000)
    expect(calls.every).toBe(2)
    expect(calls.own).toBe(2)
    expect(hook.result().error).toBe('gateway restarting')
    // The gateway answers the third time: its own profile's chats, and the list says that is where they are from.
    await wait(5_000)
    expect(calls.every).toBe(3)
    expect(calls.own).toBe(3)
    expect(hook.result().rows?.map(r => r.title)).toEqual(['Furina chat'])
    expect(hook.result().error).toBeNull()
    expect(hook.result().ownProfileOnly).toBe(true)
    hook.unmount()
  })

  it('asks the every-profile list again on each reconnect, so a dashboard that gains it is not stuck on the gateway’s own', async () => {
    const answers: Answer[] = [{ failed: { error: 'Not Found', code: 404 } }]
    const calls = dashboard(answers)
    const hook = renderHook(({ connected }: { connected: boolean }) => useChatList(connected, 'https://h'), { connected: true })
    await settle()
    expect(hook.result().ownProfileOnly).toBe(true)
    // Hermes on the dashboard is updated, which drops the connection.
    answers.push({ body: every })
    hook.rerender({ connected: false })
    await settle()
    hook.rerender({ connected: true })
    await settle()
    expect(calls.every).toBe(2)
    expect(calls.own).toBe(1)
    expect(hook.result().ownProfileOnly).toBe(false)
    expect(hook.result().rows?.map(r => r.profile)).toEqual(['atlas', 'furina'])
    hook.unmount()
  })

  it('stops asking a dashboard that keeps failing after three tries in a row, until something changes', async () => {
    const calls = dashboard([{ failed: { error: 'Internal Server Error', code: 500 } }])
    const hook = renderHook(() => useChatList(true, 'https://h'), {})
    await settle()
    for (const tries of [2, 3, 4]) {
      await wait(5_000)
      expect(calls.every).toBe(tries)
      expect(calls.own).toBe(0)
    }
    // A minute passes with nothing asked: the list waits for the next change or reconnect.
    await wait(60_000)
    expect(calls.every).toBe(4)
    await changed()
    expect(calls.every).toBe(5)
    hook.unmount()
  })

  it('a retry left waiting does not outlive the list, nor a connection dropped', async () => {
    const calls = dashboard([{ failed: { error: 'connection reset' } }])
    const gone = renderHook(() => useChatList(true, 'https://h'), {})
    await settle()
    gone.unmount()
    await wait(5_000)
    expect(calls.every).toBe(1)

    const hook = renderHook(({ connected }: { connected: boolean }) => useChatList(connected, 'https://h'), { connected: true })
    await settle()
    hook.rerender({ connected: false })
    await wait(5_000)
    expect(calls.every).toBe(2)
    hook.rerender({ connected: true })
    await settle()
    expect(calls.every).toBe(3)
    hook.unmount()
  })
})

