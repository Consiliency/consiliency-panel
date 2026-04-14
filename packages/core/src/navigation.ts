import type { NavigationEntry } from "@consiliency/panel-types";

const MAX_ENTRIES = 20;

export class NavigationTracker {
  private entries: NavigationEntry[] = [];
  private enabled: boolean;
  private originalPushState: typeof history.pushState | null = null;
  private originalReplaceState: typeof history.replaceState | null = null;
  private popstateHandler: ((e: PopStateEvent) => void) | null = null;

  constructor(enabled: boolean) {
    this.enabled = enabled && typeof window !== "undefined";
    if (!this.enabled) return;

    this.record();

    this.originalPushState = history.pushState.bind(history);
    this.originalReplaceState = history.replaceState.bind(history);

    history.pushState = (...args: Parameters<History["pushState"]>) => {
      this.originalPushState!(...args);
      this.record();
    };
    history.replaceState = (...args: Parameters<History["replaceState"]>) => {
      this.originalReplaceState!(...args);
      this.record();
    };

    this.popstateHandler = () => this.record();
    window.addEventListener("popstate", this.popstateHandler);
  }

  private record(): void {
    const entry: NavigationEntry = {
      url: window.location.href,
      title: document.title,
      ts: new Date().toISOString(),
    };
    this.entries.push(entry);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(-MAX_ENTRIES);
    }
  }

  getBreadcrumb(): NavigationEntry[] {
    return [...this.entries];
  }

  destroy(): void {
    if (!this.enabled) return;
    if (this.originalPushState) history.pushState = this.originalPushState;
    if (this.originalReplaceState) history.replaceState = this.originalReplaceState;
    if (this.popstateHandler) window.removeEventListener("popstate", this.popstateHandler);
    this.entries = [];
  }
}
