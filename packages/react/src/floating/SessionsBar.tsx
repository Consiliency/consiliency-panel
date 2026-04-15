import React from "react";
import { usePanelContext } from "../PanelProvider";

/**
 * Header chip row for switching between saved conversations within a single
 * panel-open lifecycle. Hidden when there are no saved sessions.
 */
export function SessionsBar() {
  const { savedSessions, newSession, switchSession } = usePanelContext();

  if (savedSessions.length === 0) return null;

  return (
    <div className="panel-sessions-bar" role="tablist" aria-label="Saved sessions">
      {savedSessions.map((s) => (
        <button
          key={s.id}
          className="panel-session-chip"
          onClick={() => switchSession(s.id)}
          title={s.label}
        >
          {s.label}
        </button>
      ))}
      <button
        className="panel-session-chip panel-session-new"
        onClick={newSession}
        title="Start a new conversation"
        aria-label="New session"
      >
        + New
      </button>
    </div>
  );
}
