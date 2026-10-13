/** DOM event the MAIN-world hook fires when the page requests fullscreen. */
export const EVT_REQUEST = "videospace:request";
/** DOM event the isolated script fires to abandon a held fullscreen request. */
export const EVT_CANCEL = "videospace:cancel";
/** Attribute marking the element whose fullscreen request is being held. */
export const TARGET_ATTR = "data-videospace-target";

export const SESSIONS_KEY = "sessions";
/** Detach requests for a tab are ignored this long after it was restored. */
export const RESTORE_COOLDOWN_MS = 1500;
/** Sessions untouched this long are pruned from storage. */
export const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;
/** Upper bound on waiting for a native macOS fullscreen enter/exit animation to finish. */
export const WINDOW_STATE_WAIT_MS = 1500;
/**
 * Length of macOS's native fullscreen-exit animation. Chrome reports the window
 * as "normal" as soon as the exit starts, so the tab is held in the detached
 * window until the zoom-out has visibly landed (measured ≈600–680ms).
 */
export const ZOOM_OUT_MS = 700;
