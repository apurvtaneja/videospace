// Runs in the page's MAIN world. Holds the page's fullscreen requests and hands
// them to the isolated content script, which detaches the tab first and then
// calls the (unpatched) native requestFullscreen from its own world.
import { EVT_CANCEL, EVT_REQUEST, TARGET_ATTR } from "../shared/constants";

const HOLD_TIMEOUT_MS = 10_000;

const nativeRequest = Element.prototype.requestFullscreen;
let pending: Promise<void> | null = null;

function held(this: Element, options?: FullscreenOptions): Promise<void> {
  // Already fullscreen (e.g. the page swaps elements): nothing to detach.
  if (document.fullscreenElement) return nativeRequest.call(this, options);
  if (pending) return pending;

  document.querySelectorAll(`[${TARGET_ATTR}]`).forEach((el) => el.removeAttribute(TARGET_ATTR));
  this.setAttribute(TARGET_ATTR, "");

  pending = new Promise<void>((resolve, reject) => {
    const done = (err?: Error) => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("fullscreenerror", onError);
      document.removeEventListener(EVT_CANCEL, onCancel);
      clearTimeout(timer);
      this.removeAttribute(TARGET_ATTR);
      pending = null;
      err ? reject(err) : resolve();
    };
    const onChange = () => document.fullscreenElement && done();
    const onError = () => done(new TypeError("Fullscreen request denied"));
    const onCancel = () => done(new TypeError("Fullscreen request cancelled"));
    const timer = setTimeout(onCancel, HOLD_TIMEOUT_MS);
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("fullscreenerror", onError);
    document.addEventListener(EVT_CANCEL, onCancel);
  });

  document.dispatchEvent(new CustomEvent(EVT_REQUEST));
  return pending;
}

Element.prototype.requestFullscreen = held;
const proto = Element.prototype as Element & { webkitRequestFullscreen?: unknown };
if (typeof proto.webkitRequestFullscreen === "function") {
  proto.webkitRequestFullscreen = function (this: Element) {
    void held.call(this).catch(() => {});
  };
}
