import React, { useEffect, useRef } from "react";
import { usePanelContext } from "../PanelProvider";
import { PanelChat } from "../chat/PanelChat";
import type { ModeId } from "@consiliency/panel-types";

const MODE_LABELS: Record<string, string> = {
  feedback: "Feedback",
  "bug-report": "Bug Report",
  "ai-chat": "AI Chat",
  support: "Support",
};

/** Floating panel sheet containing mode tabs + chat */
export function PanelSheet() {
  const { isOpen, setIsOpen, capabilities, activeModeId, setActiveModeId } = usePanelContext();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, setIsOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        // Only close if click is not on the panel button itself
        const target = e.target as HTMLElement;
        if (!target.closest(".panel-button")) {
          setIsOpen(false);
        }
      }
    };
    // Use capture to handle shadow DOM contexts
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [isOpen, setIsOpen]);

  if (!isOpen || !capabilities) return null;

  const allModes: ModeId[] = ["feedback", "bug-report", "ai-chat", "support"];
  const availableModes = capabilities.modes ?? ["feedback"];

  return (
    <div className="panel-sheet" ref={sheetRef} role="dialog" aria-label="Feedback panel">
      <div className="panel-tabs" role="tablist">
        {allModes.map((modeId) => {
          const isAvailable = availableModes.includes(modeId);
          return (
            <button
              key={modeId}
              role="tab"
              className={`panel-tab ${activeModeId === modeId ? "active" : ""}`}
              disabled={!isAvailable}
              title={!isAvailable ? "Coming soon" : undefined}
              onClick={() => isAvailable && setActiveModeId(modeId as ModeId)}
              aria-selected={activeModeId === modeId}
            >
              {MODE_LABELS[modeId] ?? modeId}
              {!isAvailable && " 🔒"}
            </button>
          );
        })}
      </div>
      <PanelChat modeId={activeModeId} />
    </div>
  );
}
