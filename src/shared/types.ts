export type SessionStatus = "detaching" | "fullscreen" | "restoring" | "completed" | "failed";

export interface WindowBounds {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  state?: `${chrome.windows.WindowState}`;
}

export interface DetachedVideoSession {
  tabId: number;
  detachedWindowId: number | null;
  originalWindowId: number;
  originalTabIndex: number;
  /** -1 when the tab was not grouped. */
  originalGroupId: number;
  originalPinned: boolean;
  /** Used to recreate the original window if it was closed while detached. */
  originalWindowBounds?: WindowBounds;
  status: SessionStatus;
  createdAt: number;
  lastTransitionAt: number;
}
