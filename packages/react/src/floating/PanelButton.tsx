import React from "react";
import { usePanelContext } from "../PanelProvider";

/** Floating action button that toggles the panel open/closed */
export function PanelButton() {
  const { isOpen, setIsOpen, capabilities } = usePanelContext();

  // Don't render if capabilities haven't loaded (SDK not ready)
  if (!capabilities) return null;

  return (
    <button
      className="panel-button"
      aria-label={isOpen ? "Close feedback panel" : "Open feedback panel"}
      onClick={() => setIsOpen(!isOpen)}
    >
      {isOpen ? (
        // X icon
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : (
        // Chat bubble icon
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </button>
  );
}
