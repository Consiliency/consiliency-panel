import React, { useCallback, useRef, useState } from "react";
import { VoiceInput as VoiceInputClass } from "@consiliency/panel-core";
import { usePanelContext } from "../PanelProvider";
import type { ModeId } from "@consiliency/panel-types";

interface VoiceInputProps {
  modeId: ModeId;
  onTranscript: (text: string) => void;
}

/** Push-to-talk voice input button. Falls back gracefully if Web Speech API unavailable. */
export function VoiceInput({ modeId: _modeId, onTranscript }: VoiceInputProps) {
  const { sdk } = usePanelContext();
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported] = useState(() => VoiceInputClass.isSupported());
  const transcriptRef = useRef("");

  const handleStart = useCallback(() => {
    if (!isSupported || isRecording) return;
    transcriptRef.current = "";

    sdk.voice.onInterim = (text) => {
      transcriptRef.current = text;
    };

    sdk.voice.start();
    setIsRecording(true);
  }, [isSupported, isRecording, sdk.voice]);

  const handleStop = useCallback(async () => {
    if (!isRecording) return;
    setIsRecording(false);

    const final = await sdk.voice.stop();
    const text = final || transcriptRef.current;
    if (text.trim()) onTranscript(text.trim());
  }, [isRecording, sdk.voice, onTranscript]);

  if (!isSupported) return null;

  return (
    <button
      className={`panel-voice-btn${isRecording ? " recording" : ""}`}
      aria-label={isRecording ? "Stop recording" : "Hold to speak"}
      onMouseDown={handleStart}
      onMouseUp={handleStop}
      onTouchStart={(e) => { e.preventDefault(); handleStart(); }}
      onTouchEnd={handleStop}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  );
}
