import { RESTORE_COOLDOWN_MS, SESSION_MAX_AGE_MS, SESSIONS_KEY } from "../shared/constants";
import type { DetachedVideoSession, SessionStatus } from "../shared/types";

const TRANSITIONS: Record<SessionStatus, readonly SessionStatus[]> = {
  detaching: ["fullscreen", "failed"],
  fullscreen: ["restoring", "failed"],
  restoring: ["completed", "failed"],
  completed: [],
  failed: [],
};

export function canTransition(from: SessionStatus, to: SessionStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Returns a copy of the session in the new status, or null if the move is not allowed. */
export function transition(
  session: DetachedVideoSession,
  to: SessionStatus,
  now = Date.now(),
): DetachedVideoSession | null {
  if (!canTransition(session.status, to)) return null;
  return { ...session, status: to, lastTransitionAt: now };
}

// In-memory only: losing it when the worker sleeps just shortens the cooldown.
const restoredAt = new Map<number, number>();

export function markRestored(tabId: number, now = Date.now()): void {
  restoredAt.set(tabId, now);
}

export function inCooldown(tabId: number, now = Date.now()): boolean {
  const t = restoredAt.get(tabId);
  return t !== undefined && now - t < RESTORE_COOLDOWN_MS;
}

export type SessionMap = Record<string, DetachedVideoSession>;

/**
 * Drops sessions untouched for SESSION_MAX_AGE_MS. Closed tabs are never
 * cleaned up eagerly (that would wake the worker on every tab close); tab ids
 * are not reused within a browser session, so stale entries are harmless.
 */
export function prune(all: SessionMap, now = Date.now()): SessionMap {
  for (const id in all) {
    if (now - all[id].lastTransitionAt > SESSION_MAX_AGE_MS) delete all[id];
  }
  return all;
}

async function loadAll(): Promise<SessionMap> {
  const data = await chrome.storage.session.get(SESSIONS_KEY);
  return (data[SESSIONS_KEY] as SessionMap | undefined) ?? {};
}

export async function getSession(tabId: number): Promise<DetachedVideoSession | undefined> {
  return (await loadAll())[tabId];
}

export async function saveSession(session: DetachedVideoSession): Promise<void> {
  const all = prune(await loadAll());
  all[session.tabId] = session;
  await chrome.storage.session.set({ [SESSIONS_KEY]: all });
}

export async function deleteSession(tabId: number): Promise<void> {
  const all = await loadAll();
  if (!(tabId in all)) return;
  delete all[tabId];
  await chrome.storage.session.set({ [SESSIONS_KEY]: all });
}
