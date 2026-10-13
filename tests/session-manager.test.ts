import { describe, expect, it } from "vitest";
import { canTransition, inCooldown, markRestored, prune, transition } from "../src/background/session-manager";
import { RESTORE_COOLDOWN_MS, SESSION_MAX_AGE_MS } from "../src/shared/constants";
import type { DetachedVideoSession } from "../src/shared/types";

const base: DetachedVideoSession = {
  tabId: 1,
  detachedWindowId: 20,
  originalWindowId: 10,
  originalTabIndex: 3,
  originalGroupId: -1,
  originalPinned: false,
  status: "detaching",
  createdAt: 0,
  lastTransitionAt: 0,
};

describe("session transitions", () => {
  it("follows the detach → fullscreen → restoring → completed lifecycle", () => {
    const fs = transition(base, "fullscreen", 1)!;
    expect(fs.status).toBe("fullscreen");
    const restoring = transition(fs, "restoring", 2)!;
    expect(restoring.lastTransitionAt).toBe(2);
    expect(transition(restoring, "completed")!.status).toBe("completed");
  });

  it("rejects duplicate and out-of-order transitions", () => {
    expect(transition(base, "restoring")).toBeNull();
    const restoring = { ...base, status: "restoring" as const };
    expect(transition(restoring, "restoring")).toBeNull();
    expect(canTransition("completed", "fullscreen")).toBe(false);
    expect(canTransition("failed", "detaching")).toBe(false);
  });

  it("does not mutate the input session", () => {
    transition(base, "fullscreen");
    expect(base.status).toBe("detaching");
  });
});

describe("restore cooldown", () => {
  it("blocks re-detach only within the cooldown window", () => {
    markRestored(7, 1000);
    expect(inCooldown(7, 1000 + RESTORE_COOLDOWN_MS - 1)).toBe(true);
    expect(inCooldown(7, 1000 + RESTORE_COOLDOWN_MS)).toBe(false);
    expect(inCooldown(8, 1000)).toBe(false);
  });
});

describe("session pruning", () => {
  it("drops only sessions older than the max age", () => {
    const now = SESSION_MAX_AGE_MS + 10_000;
    const all = prune({
      1: { ...base, tabId: 1, lastTransitionAt: 0 },
      2: { ...base, tabId: 2, lastTransitionAt: now - 1000 },
    }, now);
    expect(Object.keys(all)).toEqual(["2"]);
  });
});
