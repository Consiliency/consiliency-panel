import type { SubmissionMetadata } from "@consiliency/panel-types";

export class MetadataCollector {
  private consoleErrorBuffer: string[] = [];
  private consoleWarningBuffer: string[] = [];
  private originalConsoleError: typeof console.error;
  private originalConsoleWarn: typeof console.warn;
  private originalOnError: typeof window.onerror | null = null;

  constructor() {
    // Capture console.error from init time
    this.originalConsoleError = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      this.consoleErrorBuffer.push(args.map(String).join(" "));
      this.originalConsoleError(...args);
    };

    // Capture console.warn from init time
    this.originalConsoleWarn = console.warn.bind(console);
    console.warn = (...args: unknown[]) => {
      this.consoleWarningBuffer.push(args.map(String).join(" "));
      this.originalConsoleWarn(...args);
    };

    if (typeof window !== "undefined") {
      this.originalOnError = window.onerror;
      window.onerror = (msg, src, line, col, err) => {
        this.consoleErrorBuffer.push(
          `Uncaught ${err?.name ?? "Error"}: ${msg} (${src}:${line}:${col})`
        );
        return this.originalOnError?.(msg, src, line, col, err) ?? false;
      };
    }
  }

  collect(): SubmissionMetadata {
    return {
      url: typeof window !== "undefined" ? window.location.href : "",
      title: typeof document !== "undefined" ? document.title : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      viewport:
        typeof window !== "undefined"
          ? { width: window.innerWidth, height: window.innerHeight }
          : { width: 0, height: 0 },
      timestamp: new Date().toISOString(),
      referrer: typeof document !== "undefined" ? document.referrer : "",
    };
  }

  collectConsoleErrors(): string[] {
    return [...this.consoleErrorBuffer];
  }

  flushConsoleErrors(): string[] {
    const errors = [...this.consoleErrorBuffer];
    this.consoleErrorBuffer = [];
    return errors;
  }

  collectConsoleWarnings(): string[] {
    return [...this.consoleWarningBuffer];
  }

  flushConsoleWarnings(): string[] {
    const warnings = [...this.consoleWarningBuffer];
    this.consoleWarningBuffer = [];
    return warnings;
  }

  destroy(): void {
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
    if (typeof window !== "undefined" && this.originalOnError !== null) {
      window.onerror = this.originalOnError;
    }
  }
}
