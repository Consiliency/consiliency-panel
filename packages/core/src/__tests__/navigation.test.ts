import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NavigationTracker } from "../navigation";

interface FakeHistory {
  pushState: (state: unknown, title: string, url: string) => void;
  replaceState: (state: unknown, title: string, url: string) => void;
}

interface FakeWindow {
  location: { href: string };
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
}

describe("NavigationTracker", () => {
  let tracker: NavigationTracker | null = null;
  let listeners: Map<string, EventListener>;
  let fakeWindow: FakeWindow;
  let fakeDocument: { title: string };
  let fakeHistory: FakeHistory;

  beforeEach(() => {
    listeners = new Map();
    fakeWindow = {
      location: { href: "https://app.example.com/start" },
      addEventListener: (type, listener) => {
        listeners.set(type, listener);
      },
      removeEventListener: (type, listener) => {
        if (listeners.get(type) === listener) listeners.delete(type);
      },
    };
    fakeDocument = { title: "Start" };
    fakeHistory = {
      pushState: (_state, _title, url) => {
        fakeWindow.location.href = `https://app.example.com${url}`;
      },
      replaceState: (_state, _title, url) => {
        fakeWindow.location.href = `https://app.example.com${url}`;
      },
    };
    vi.stubGlobal("window", fakeWindow);
    vi.stubGlobal("document", fakeDocument);
    vi.stubGlobal("history", fakeHistory);
  });

  afterEach(() => {
    tracker?.destroy();
    tracker = null;
    vi.unstubAllGlobals();
  });

  it("records initial entry on construction when enabled", () => {
    tracker = new NavigationTracker(true);
    const entries = tracker.getBreadcrumb();
    expect(entries).toHaveLength(1);
    expect(entries[0].url).toContain("/start");
    expect(entries[0].title).toBe("Start");
  });

  it("records pushState navigations", () => {
    tracker = new NavigationTracker(true);
    history.pushState(null, "", "/page-a");
    history.pushState(null, "", "/page-b");
    const entries = tracker.getBreadcrumb();
    expect(entries).toHaveLength(3);
    expect(entries[entries.length - 1].url).toContain("/page-b");
  });

  it("records replaceState navigations", () => {
    tracker = new NavigationTracker(true);
    history.replaceState(null, "", "/replaced");
    const last = tracker.getBreadcrumb().slice(-1)[0];
    expect(last.url).toContain("/replaced");
  });

  it("caps entries at the ring buffer size", () => {
    tracker = new NavigationTracker(true);
    for (let i = 0; i < 50; i++) {
      history.pushState(null, "", `/p-${i}`);
    }
    const entries = tracker.getBreadcrumb();
    expect(entries.length).toBeLessThanOrEqual(20);
    expect(entries[entries.length - 1].url).toContain("/p-49");
  });

  it("returns empty breadcrumb when disabled", () => {
    tracker = new NavigationTracker(false);
    history.pushState(null, "", "/anywhere");
    expect(tracker.getBreadcrumb()).toEqual([]);
  });

  it("destroy() restores history methods and clears entries", () => {
    tracker = new NavigationTracker(true);
    const patchedPush = history.pushState;
    expect(tracker.getBreadcrumb().length).toBeGreaterThan(0);
    tracker.destroy();
    expect(history.pushState).not.toBe(patchedPush);
    expect(tracker.getBreadcrumb()).toEqual([]);
  });
});
