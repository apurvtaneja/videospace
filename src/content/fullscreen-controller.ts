// Isolated-world content script: asks the service worker to detach the tab,
// then enters element fullscreen, and reports when fullscreen ends.
import { EVT_CANCEL, EVT_REQUEST, TARGET_ATTR } from "../shared/constants";
import type { ContentMessage, DetachResponse } from "../shared/messages";

let detached = false;

function send<T>(msg: ContentMessage): Promise<T> {
  return chrome.runtime.sendMessage(msg);
}

function cancel(): void {
  document.dispatchEvent(new CustomEvent(EVT_CANCEL));
}

document.addEventListener(EVT_REQUEST, async () => {
  const target = document.querySelector(`[${TARGET_ATTR}]`);
  if (!target) return cancel();

  let res: DetachResponse;
  try {
    res = await send<DetachResponse>({ type: "DETACH_REQUEST" });
  } catch {
    res = { action: "enter", detached: false };
  }
  if (res.action !== "enter") return cancel();

  detached = res.detached;
  try {
    // Isolated world: this is Chrome's native requestFullscreen, not the MAIN-world hook.
    await target.requestFullscreen();
  } catch {
    cancel();
    if (detached) {
      detached = false;
      void send({ type: "FULLSCREEN_EXITED" });
    }
  }
});

document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement || !detached) return;
  detached = false;
  void send({ type: "FULLSCREEN_EXITED" });
});
