import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MetadataCollector } from "../metadata";

describe("MetadataCollector", () => {
  let collector: MetadataCollector;
  let originalConsoleError: typeof console.error;
  let originalConsoleWarn: typeof console.warn;

  beforeEach(() => {
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    collector = new MetadataCollector();
  });

  afterEach(() => {
    collector.destroy();
    // Restore originals in case destroy didn't (failsafe)
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  it("collect() returns metadata with required fields", () => {
    const meta = collector.collect();
    expect(typeof meta.url).toBe("string");
    expect(typeof meta.userAgent).toBe("string");
    expect(typeof meta.timestamp).toBe("string");
    expect(meta.viewport).toBeDefined();
    expect(typeof meta.viewport.width).toBe("number");
    expect(typeof meta.viewport.height).toBe("number");
  });

  it("collect() timestamp is a valid ISO string", () => {
    const meta = collector.collect();
    expect(() => new Date(meta.timestamp)).not.toThrow();
    expect(new Date(meta.timestamp).toISOString()).toBe(meta.timestamp);
  });

  it("collectConsoleErrors() returns errors captured since construction", () => {
    console.error("Test error 1");
    console.error("Test error 2");
    const errors = collector.collectConsoleErrors();
    expect(errors.length).toBeGreaterThanOrEqual(2);
    expect(errors.some((e) => e.includes("Test error 1"))).toBe(true);
    expect(errors.some((e) => e.includes("Test error 2"))).toBe(true);
  });

  it("collectConsoleErrors() does not include errors from before construction", () => {
    // Log something before creating a new collector
    console.error = originalConsoleError; // Temporarily restore to log "before"
    collector.destroy();

    const freshCollector = new MetadataCollector();
    // The freshCollector should not have any pre-existing errors
    const errors = freshCollector.collectConsoleErrors();
    expect(errors).toHaveLength(0);
    freshCollector.destroy();
    collector = new MetadataCollector(); // Reset for afterEach
  });

  it("destroy() restores original console.error", () => {
    const patched = console.error;
    collector.destroy();
    expect(console.error).not.toBe(patched);
    collector = new MetadataCollector(); // Re-create for afterEach
  });

  it("collectConsoleWarnings() returns warnings captured since construction", () => {
    console.warn("Test warning 1");
    console.warn("Test warning 2");
    const warnings = collector.collectConsoleWarnings();
    expect(warnings.length).toBeGreaterThanOrEqual(2);
    expect(warnings.some((w) => w.includes("Test warning 1"))).toBe(true);
    expect(warnings.some((w) => w.includes("Test warning 2"))).toBe(true);
  });

  it("collectConsoleWarnings() does not include warnings from before construction", () => {
    console.warn = originalConsoleWarn;
    collector.destroy();

    const freshCollector = new MetadataCollector();
    const warnings = freshCollector.collectConsoleWarnings();
    expect(warnings).toHaveLength(0);
    freshCollector.destroy();
    collector = new MetadataCollector();
  });

  it("destroy() restores original console.warn", () => {
    const patched = console.warn;
    collector.destroy();
    expect(console.warn).not.toBe(patched);
    collector = new MetadataCollector();
  });
});
