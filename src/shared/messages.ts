export type ContentMessage = { type: "DETACH_REQUEST" } | { type: "FULLSCREEN_EXITED" };

/**
 * Reply to DETACH_REQUEST. "enter": request element fullscreen now (the tab has
 * been detached, or detaching was skipped and fullscreen happens in place).
 * "ignore": drop the request.
 */
export interface DetachResponse {
  action: "enter" | "ignore";
  detached: boolean;
}

const CONTENT_TYPES = new Set<string>(["DETACH_REQUEST", "FULLSCREEN_EXITED"]);

export function isContentMessage(msg: unknown): msg is ContentMessage {
  return (
    typeof msg === "object" &&
    msg !== null &&
    typeof (msg as { type?: unknown }).type === "string" &&
    CONTENT_TYPES.has((msg as { type: string }).type)
  );
}
