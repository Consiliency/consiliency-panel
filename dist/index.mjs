import {
  PanelButton
} from "./chunk-IP3PZYWW.mjs";
import {
  AnnotationEditor,
  FileAttachment,
  PanelChat,
  PanelSheet,
  PreviewCard,
  ScreenshotCapture,
  SubmitButton
} from "./chunk-CQ2G3ZBR.mjs";
import {
  PanelProvider,
  VoiceInput,
  usePanelContext
} from "./chunk-MJEBL2M5.mjs";
import "./chunk-NSSMTXJJ.mjs";

// src/mount.ts
function mountPanel(config, container) {
  if (typeof document === "undefined") {
    return () => {
    };
  }
  let root = null;
  let hostEl = null;
  let shadowRoot = null;
  const mount = async () => {
    const [React2, { createRoot }, { PanelProvider: PanelProvider2 }, { PanelButton: PanelButton2 }, { PanelSheet: PanelSheet2 }] = await Promise.all([
      import("react"),
      import("react-dom/client"),
      import("./PanelProvider-FRVC5VVX.mjs"),
      import("./PanelButton-NVWMNJ2H.mjs"),
      import("./PanelSheet-WJBHZQHH.mjs")
    ]);
    hostEl = container ?? document.createElement("div");
    hostEl.id = "consiliency-panel-root";
    if (!container) document.body.appendChild(hostEl);
    shadowRoot = hostEl.attachShadow({ mode: "open" });
    const styleEl = document.createElement("style");
    styleEl.textContent = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`;
    shadowRoot.appendChild(styleEl);
    const mountPoint = document.createElement("div");
    shadowRoot.appendChild(mountPoint);
    root = createRoot(mountPoint);
    root.render(
      React2.createElement(PanelProvider2, { config }, [
        React2.createElement(PanelButton2, { key: "btn" }),
        React2.createElement(PanelSheet2, { key: "sheet" })
      ])
    );
  };
  mount();
  return () => {
    root?.unmount();
    if (hostEl && !container && hostEl.parentNode) {
      hostEl.parentNode.removeChild(hostEl);
    }
  };
}

// src/input/VoiceInput.tsx
import { useCallback, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function VoiceInput2({ modeId: _modeId, onTranscript }) {
  const { sdk } = usePanelContext();
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported] = useState(() => VoiceInput.isSupported());
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
  return /* @__PURE__ */ jsx(
    "button",
    {
      className: `panel-voice-btn${isRecording ? " recording" : ""}`,
      "aria-label": isRecording ? "Stop recording" : "Hold to speak",
      onMouseDown: handleStart,
      onMouseUp: handleStop,
      onTouchStart: (e) => {
        e.preventDefault();
        handleStart();
      },
      onTouchEnd: handleStop,
      children: /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("path", { d: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" }),
        /* @__PURE__ */ jsx("path", { d: "M19 10v2a7 7 0 0 1-14 0v-2" }),
        /* @__PURE__ */ jsx("line", { x1: "12", y1: "19", x2: "12", y2: "23" }),
        /* @__PURE__ */ jsx("line", { x1: "8", y1: "23", x2: "16", y2: "23" })
      ] })
    }
  );
}
export {
  AnnotationEditor,
  FileAttachment,
  PanelButton,
  PanelChat,
  PanelProvider,
  PanelSheet,
  PreviewCard,
  ScreenshotCapture,
  SubmitButton,
  VoiceInput2 as VoiceInput,
  mountPanel,
  usePanelContext
};
//# sourceMappingURL=index.mjs.map