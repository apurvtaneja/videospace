import { WINDOW_STATE_WAIT_MS, ZOOM_OUT_MS } from "../shared/constants";
import { isContentMessage, type DetachResponse } from "../shared/messages";
import type { DetachedVideoSession, WindowBounds } from "../shared/types";
import {
  deleteSession,
  getSession,
  inCooldown,
  markRestored,
  saveSession,
  transition,
} from "./session-manager";

const IN_PLACE: DetachResponse = { action: "enter", detached: false };
const IGNORE: DetachResponse = { action: "ignore", detached: false };
/** A session stuck mid-transition this long is assumed orphaned (e.g. the worker was killed). */
const STUCK_MS = 10_000;

// The only top-level listener: the worker wakes when a page requests fullscreen
// and at no other time. Stale sessions are detected lazily instead of tracking
// every tab/window close.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tab = sender.tab;
  if (!isContentMessage(msg) || tab?.id === undefined) return false;

  if (msg.type === "DETACH_REQUEST") {
    handleDetach(tab).then(sendResponse, (err) => {
      console.warn("[VideoSpace] detach failed", err);
      sendResponse(IN_PLACE);
    });
    return true;
  }

  restore(tab.id).catch((err) => console.warn("[VideoSpace] restore failed", err));
  return false;
});

async function isLive(session: DetachedVideoSession): Promise<boolean> {
  if (session.status === "completed" || session.status === "failed") return false;
  if (session.status !== "fullscreen") return Date.now() - session.lastTransitionAt < STUCK_MS;
  if (session.detachedWindowId === null) return false;
  return chrome.windows.get(session.detachedWindowId).then(
    () => true,
    () => false,
  );
}

async function handleDetach(tab: chrome.tabs.Tab): Promise<DetachResponse> {
  const tabId = tab.id!;
  if (inCooldown(tabId)) return IGNORE;

  const existing = await getSession(tabId);
  if (existing && (await isLive(existing))) {
    return existing.status === "fullscreen" ? { action: "enter", detached: true } : IGNORE;
  }

  const win = await chrome.windows.get(tab.windowId, { populate: true });
  // A sole tab already owns its window, so plain fullscreen gives it its own Space.
  if ((win.tabs?.length ?? 0) <= 1 || win.state === "fullscreen") return IN_PLACE;

  const bounds: WindowBounds = {
    left: win.left,
    top: win.top,
    width: win.width,
    height: win.height,
    state: win.state,
  };
  const now = Date.now();
  let session: DetachedVideoSession = {
    tabId,
    detachedWindowId: null,
    originalWindowId: tab.windowId,
    originalTabIndex: tab.index,
    originalGroupId: tab.groupId ?? -1,
    originalPinned: tab.pinned,
    originalWindowBounds: bounds,
    status: "detaching",
    createdAt: now,
    lastTransitionAt: now,
  };
  await saveSession(session);

  try {
    // Open exactly over the original window so only the tab strip appears to
    // change; the content script's element fullscreen then performs the single
    // native macOS zoom into a new Space, starting from this frame.
    const detached = await chrome.windows.create({
      tabId,
      focused: true,
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
    });
    session = { ...session, detachedWindowId: detached?.id ?? null };
  } catch (err) {
    await deleteSession(tabId);
    throw err;
  }

  await saveSession(transition(session, "fullscreen")!);
  return { action: "enter", detached: true };
}

/**
 * Resolves once the window satisfies `done`, re-checking on bounds changes
 * (which fire when a native fullscreen animation settles). The listener exists
 * only while waiting, so it never wakes the worker on its own.
 */
function waitForWindow(
  windowId: number,
  done: (w: chrome.windows.Window) => boolean,
): Promise<chrome.windows.Window | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (w: chrome.windows.Window | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      chrome.windows.onBoundsChanged.removeListener(onBounds);
      resolve(w);
    };
    const check = () =>
      chrome.windows.get(windowId).then(
        (w) => done(w) && finish(w),
        () => finish(null),
      );
    const onBounds = (w: chrome.windows.Window) => {
      if (w.id === windowId) void check();
    };
    const timer = setTimeout(() => void chrome.windows.get(windowId).then(finish, () => finish(null)), WINDOW_STATE_WAIT_MS);
    chrome.windows.onBoundsChanged.addListener(onBounds);
    void check();
  });
}

const notFullscreen = (w: chrome.windows.Window) => w.state !== "fullscreen";

/** Lets the detached window zoom out of its Space natively before the tab leaves it. */
async function zoomOut(windowId: number): Promise<chrome.windows.Window | null> {
  const start = Date.now();
  // Exiting element fullscreen starts the native exit on its own.
  let w = await waitForWindow(windowId, notFullscreen);
  if (w?.state === "fullscreen") {
    await chrome.windows.update(windowId, { state: "normal" });
    w = await waitForWindow(windowId, notFullscreen);
  }
  const left = ZOOM_OUT_MS - (Date.now() - start);
  if (w && left > 0) await new Promise((r) => setTimeout(r, left));
  return w;
}

async function restore(tabId: number): Promise<void> {
  const session = await getSession(tabId);
  if (!session) return;
  const restoring = transition(session, "restoring");
  if (!restoring) return;
  await saveSession(restoring);

  try {
    const original = await chrome.windows.get(session.originalWindowId).catch(() => null);
    const detached =
      session.detachedWindowId === null ? null : await zoomOut(session.detachedWindowId).catch(() => null);

    let targetWindowId: number;
    if (original) {
      await chrome.tabs.move(tabId, { windowId: original.id!, index: session.originalTabIndex });
      targetWindowId = original.id!;
    } else if (detached?.id !== undefined) {
      // The original window is gone; the detached one has just zoomed back to its frame.
      targetWindowId = detached.id;
    } else {
      const b = session.originalWindowBounds;
      const created = await chrome.windows.create(
        b?.state && b.state !== "normal"
          ? { tabId, state: b.state }
          : { tabId, left: b?.left, top: b?.top, width: b?.width, height: b?.height },
      );
      targetWindowId = created!.id!;
    }

    if (session.originalPinned) await chrome.tabs.update(tabId, { pinned: true });
    if (original && session.originalGroupId !== -1) {
      await chrome.tabs.group({ groupId: session.originalGroupId, tabIds: tabId }).catch(() => {});
    }
    await chrome.tabs.update(tabId, { active: true });
    await chrome.windows.update(targetWindowId, { focused: true });

    // Moving the sole tab out normally closes the detached window; close it if it lingers.
    if (session.detachedWindowId !== null && session.detachedWindowId !== targetWindowId) {
      await chrome.windows.remove(session.detachedWindowId).catch(() => {});
    }
  } finally {
    markRestored(tabId);
    await deleteSession(tabId);
  }
}
