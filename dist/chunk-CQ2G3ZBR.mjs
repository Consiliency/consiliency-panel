import {
  blobToDataUrl,
  captureScreenshot,
  usePanelContext
} from "./chunk-MJEBL2M5.mjs";

// src/floating/PanelSheet.tsx
import { useEffect as useEffect4, useRef as useRef4 } from "react";

// src/chat/PanelChat.tsx
import { useEffect as useEffect3, useRef as useRef3, useState as useState6 } from "react";

// src/chat/PreviewCard.tsx
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var SEVERITIES = ["blocker", "high", "medium", "low"];
var KINDS = ["bug", "feature", "feedback", "other"];
function PreviewCard(props) {
  if (!props.editable) {
    const { preview } = props;
    return /* @__PURE__ */ jsxs("div", { className: "panel-preview", children: [
      preview.screenshotUrl && /* @__PURE__ */ jsx(
        "img",
        {
          src: preview.screenshotUrl,
          alt: "Screenshot",
          style: { width: "100%", maxHeight: 140, objectFit: "cover", display: "block" }
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "panel-preview-summary", children: preview.plainSummary }),
      preview.technicalDetails && /* @__PURE__ */ jsxs("details", { className: "panel-preview-details", children: [
        /* @__PURE__ */ jsx("summary", { children: "Technical details" }),
        /* @__PURE__ */ jsx("div", { className: "panel-preview-details-content", children: preview.technicalDetails })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsx(EditableDraft, { ...props });
}
function EditableDraft({
  draft,
  onDraftChange,
  onSubmit,
  onRequestChanges,
  screenshotUrl,
  mode = "issue"
}) {
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [reviseText, setReviseText] = useState("");
  const [error, setError] = useState(null);
  const commentMode = mode === "comment";
  const doSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit();
      setConfirm(null);
    } catch (err) {
      const e = err;
      if (e?.status === 422 && e.requiresConfirm) {
        setConfirm(e.reason ?? "This draft looks thin. Submit anyway?");
      } else {
        setError(e?.message ?? "Failed to submit");
      }
    } finally {
      setSubmitting(false);
    }
  };
  const disabled = submitting || (commentMode ? !draft.body.trim() : !draft.title.trim() || !draft.body.trim());
  return /* @__PURE__ */ jsxs("div", { className: "panel-preview panel-draft-edit", children: [
    screenshotUrl && /* @__PURE__ */ jsx(
      "img",
      {
        src: screenshotUrl,
        alt: "Screenshot",
        style: { width: "100%", maxHeight: 140, objectFit: "cover", display: "block" }
      }
    ),
    !commentMode && /* @__PURE__ */ jsx(
      "input",
      {
        className: "panel-draft-title",
        type: "text",
        value: draft.title,
        placeholder: "Issue title",
        onChange: (e) => onDraftChange({ ...draft, title: e.target.value })
      }
    ),
    /* @__PURE__ */ jsx(
      "textarea",
      {
        className: "panel-draft-body",
        value: draft.body,
        placeholder: commentMode ? "Comment body" : "What happened? Steps to reproduce, expected vs actual\u2026",
        rows: 6,
        onChange: (e) => onDraftChange({ ...draft, body: e.target.value })
      }
    ),
    !commentMode && /* @__PURE__ */ jsxs("div", { className: "panel-draft-row", children: [
      /* @__PURE__ */ jsxs("label", { className: "panel-draft-label", children: [
        "Severity",
        /* @__PURE__ */ jsx(
          "select",
          {
            value: draft.severity,
            onChange: (e) => onDraftChange({ ...draft, severity: e.target.value }),
            children: SEVERITIES.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: s }, s))
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "panel-draft-label", children: [
        "Kind",
        /* @__PURE__ */ jsx(
          "select",
          {
            value: draft.kind,
            onChange: (e) => onDraftChange({ ...draft, kind: e.target.value }),
            children: KINDS.map((k) => /* @__PURE__ */ jsx("option", { value: k, children: k }, k))
          }
        )
      ] })
    ] }),
    confirm && /* @__PURE__ */ jsxs("div", { className: "panel-draft-confirm", children: [
      /* @__PURE__ */ jsx("div", { children: confirm }),
      /* @__PURE__ */ jsxs("div", { className: "panel-draft-confirm-actions", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "panel-draft-submit",
            onClick: async () => {
              setSubmitting(true);
              try {
                await onSubmit();
                setConfirm(null);
              } catch (e) {
                setError(e.message);
              } finally {
                setSubmitting(false);
              }
            },
            disabled: submitting,
            children: "Submit anyway"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "panel-draft-cancel",
            onClick: () => setConfirm(null),
            disabled: submitting,
            children: "Keep editing"
          }
        )
      ] })
    ] }),
    error && /* @__PURE__ */ jsx("div", { className: "panel-draft-error", children: error }),
    !confirm && /* @__PURE__ */ jsx(
      "button",
      {
        className: "panel-draft-submit",
        onClick: doSubmit,
        disabled,
        children: submitting ? "Submitting\u2026" : commentMode ? "Post comment" : "Submit issue"
      }
    ),
    onRequestChanges && !confirm && /* @__PURE__ */ jsx("div", { className: "panel-draft-revise", children: /* @__PURE__ */ jsx(
      "input",
      {
        type: "text",
        className: "panel-draft-revise-input",
        value: reviseText,
        placeholder: "Or ask the agent to revise\u2026",
        onChange: (e) => setReviseText(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter" && reviseText.trim()) {
            onRequestChanges(reviseText.trim());
            setReviseText("");
          }
        }
      }
    ) })
  ] });
}

// src/chat/SubmitButton.tsx
import { useRef, useState as useState2 } from "react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var PHASE_LABELS = {
  idle: "Submit Issue",
  submitting: "Submitting\u2026",
  classifying: "Classifying\u2026",
  creating: "Creating issue\u2026",
  done: "Done!",
  error: "Failed \u2014 retry?"
};
function SubmitButton({ modeId, onDone, componentHint, submissionEnhancer }) {
  const { sdk } = usePanelContext();
  const [phase, setPhase] = useState2("idle");
  const inflightRef = useRef(false);
  const handleSubmit = async () => {
    if (inflightRef.current) return;
    if (phase !== "idle" && phase !== "error") return;
    inflightRef.current = true;
    setPhase("submitting");
    try {
      const metadata = sdk.metadata.collect();
      const consoleErrors = sdk.metadata.collectConsoleErrors();
      const consoleWarnings = sdk.metadata.collectConsoleWarnings();
      sdk.conversation.setMetadata(metadata);
      const basePayload = {
        transcript: sdk.conversation.state.turns.filter((t) => t.content !== "__preview__"),
        metadata,
        screenshotUrl: sdk.conversation.state.screenshotUrl,
        attachmentUrls: sdk.conversation.state.attachmentUrls,
        consoleErrors,
        consoleWarnings,
        repo: sdk.config.repo
      };
      if (sdk.config.navigationTracking) {
        basePayload.navigationBreadcrumb = sdk.navigation.getBreadcrumb();
      }
      if (componentHint) {
        basePayload.componentHint = componentHint;
      }
      const payload = submissionEnhancer ? submissionEnhancer(basePayload) : basePayload;
      const { id } = await sdk.client.submit(payload);
      setPhase("classifying");
      await sdk.client.streamProcess(id, (event) => {
        if (event.type === "progress") {
          const msg = event.message?.toLowerCase() ?? "";
          if (msg.includes("classif")) setPhase("classifying");
          else if (msg.includes("enrich") || msg.includes("format")) setPhase("classifying");
          else if (msg.includes("creating") || msg.includes("issue")) setPhase("creating");
          else if (msg.includes("routing")) setPhase("classifying");
        } else if (event.type === "completed") {
          setPhase("done");
          sdk.conversation.markSubmitted();
          onDone(event.issueUrl ?? "");
        } else if (event.type === "error") {
          setPhase("error");
        }
      }, { repo: sdk.config.repo, panelRepo: sdk.config.panelRepo });
    } catch {
      setPhase("error");
    } finally {
      inflightRef.current = false;
    }
  };
  const isLoading = phase !== "idle" && phase !== "error" && phase !== "done";
  return /* @__PURE__ */ jsxs2(
    "button",
    {
      className: "panel-submit-btn",
      onClick: handleSubmit,
      disabled: isLoading || phase === "done",
      children: [
        isLoading && /* @__PURE__ */ jsxs2("span", { style: { display: "inline-flex", alignItems: "center", gap: 6 }, children: [
          /* @__PURE__ */ jsx2("span", { className: "panel-spinner" }),
          PHASE_LABELS[phase]
        ] }),
        !isLoading && PHASE_LABELS[phase]
      ]
    }
  );
}

// src/capture/ScreenshotCapture.tsx
import { useState as useState4 } from "react";

// src/capture/AnnotationEditor.tsx
import { useCallback, useEffect, useRef as useRef2, useState as useState3 } from "react";
import { createPortal } from "react-dom";
import { Fragment, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function AnnotationEditor({ imageDataUrl, onDone, onCancel }) {
  const canvasRef = useRef2(null);
  const [activeTool, setActiveTool] = useState3("arrow");
  const [color, setColor] = useState3("#ef4444");
  const [annotations, setAnnotations] = useState3([]);
  const [isDrawing, setIsDrawing] = useState3(false);
  const [currentPoints, setCurrentPoints] = useState3([]);
  const imageRef = useRef2(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      redraw([]);
    };
    img.src = imageDataUrl;
  }, [imageDataUrl]);
  const redraw = useCallback((annots) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const x = (canvas.width - img.width * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    annots.forEach((a) => {
      ctx.strokeStyle = a.color;
      ctx.fillStyle = a.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (a.type === "arrow" && a.points.length >= 4) {
        const [x1, y1, x2, y2] = a.points;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.lineTo(x2 - 12 * Math.cos(angle - Math.PI / 6), y2 - 12 * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 12 * Math.cos(angle + Math.PI / 6), y2 - 12 * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (a.type === "rect" && a.points.length >= 4) {
        const [x1, y1, x2, y2] = a.points;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      } else if (a.type === "freehand" && a.points.length >= 2) {
        ctx.moveTo(a.points[0], a.points[1]);
        for (let i = 2; i < a.points.length; i += 2) {
          ctx.lineTo(a.points[i], a.points[i + 1]);
        }
        ctx.stroke();
      } else if (a.type === "text" && a.text && a.points.length >= 2) {
        ctx.font = "16px sans-serif";
        ctx.fillText(a.text, a.points[0], a.points[1]);
      } else if (a.type === "blur" && a.points.length >= 4) {
        const [x1, y1, x2, y2] = a.points;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      }
    });
  }, []);
  useEffect(() => {
    redraw(annotations);
  }, [annotations, redraw]);
  const getPos = (e) => ({ x: e.clientX, y: e.clientY });
  const handleMouseDown = (e) => {
    if (activeTool === "text") {
      const input = prompt("Enter text:");
      if (input) {
        const newAnnot = {
          id: Date.now().toString(),
          type: "text",
          points: [e.clientX, e.clientY],
          color,
          text: input
        };
        setAnnotations((prev) => {
          const next = [...prev, newAnnot];
          redraw(next);
          return next;
        });
      }
      return;
    }
    setIsDrawing(true);
    setCurrentPoints([e.clientX, e.clientY]);
  };
  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    if (activeTool === "freehand") {
      setCurrentPoints((prev) => [...prev, x, y]);
    } else {
      setCurrentPoints((prev) => [prev[0], prev[1], x, y]);
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    redraw(annotations);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    const pts = activeTool === "freehand" ? [...currentPoints, x, y] : [currentPoints[0], currentPoints[1], x, y];
    if (activeTool === "arrow" && pts.length >= 4) {
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      ctx.lineTo(pts[2], pts[3]);
      ctx.stroke();
    } else if (activeTool === "rect" && pts.length >= 4) {
      ctx.strokeRect(pts[0], pts[1], pts[2] - pts[0], pts[3] - pts[1]);
    } else if (activeTool === "blur" && pts.length >= 4) {
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(pts[0], pts[1], pts[2] - pts[0], pts[3] - pts[1]);
    }
  };
  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const { x, y } = getPos(e);
    const finalPoints = activeTool === "freehand" ? [...currentPoints, x, y] : [currentPoints[0], currentPoints[1], x, y];
    if (finalPoints.length >= 2) {
      const newAnnot = {
        id: Date.now().toString(),
        type: activeTool,
        points: finalPoints,
        color
      };
      setAnnotations((prev) => {
        const next = [...prev, newAnnot];
        redraw(next);
        return next;
      });
    }
    setCurrentPoints([]);
  };
  const handleUndo = () => {
    setAnnotations((prev) => {
      const next = prev.slice(0, -1);
      redraw(next);
      return next;
    });
  };
  const handleDone = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) onDone(blob);
    }, "image/png");
  };
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
      if ((e.ctrlKey || e.metaKey) && e.key === "z") handleUndo();
      if (e.key === "Enter") handleDone();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [annotations]);
  const TOOLS = [
    { id: "arrow", label: "\u2192" },
    { id: "rect", label: "\u25A1" },
    { id: "freehand", label: "\u270F" },
    { id: "text", label: "T" },
    { id: "blur", label: "\u25FC" }
  ];
  const toolbar = /* @__PURE__ */ jsxs3("div", { style: {
    position: "fixed",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: 8,
    background: "#1e1e2e",
    padding: "8px 12px",
    borderRadius: 10,
    boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
    zIndex: 2147483647,
    alignItems: "center"
  }, children: [
    TOOLS.map((t) => /* @__PURE__ */ jsx3(
      "button",
      {
        title: t.id,
        onClick: () => setActiveTool(t.id),
        style: {
          width: 32,
          height: 32,
          borderRadius: 6,
          border: "none",
          background: activeTool === t.id ? "#6366f1" : "#2d2d3d",
          color: "#fff",
          cursor: "pointer",
          fontSize: 16
        },
        children: t.label
      },
      t.id
    )),
    /* @__PURE__ */ jsx3("input", { type: "color", value: color, onChange: (e) => setColor(e.target.value), style: { width: 32, height: 32, border: "none", borderRadius: 6, cursor: "pointer" } }),
    /* @__PURE__ */ jsx3("button", { onClick: handleUndo, title: "Undo (Ctrl+Z)", style: { padding: "6px 10px", borderRadius: 6, border: "none", background: "#2d2d3d", color: "#fff", cursor: "pointer", fontSize: 12 }, children: "\u21A9" }),
    /* @__PURE__ */ jsx3("button", { onClick: handleDone, style: { padding: "6px 12px", borderRadius: 6, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }, children: "Done \u21B5" }),
    /* @__PURE__ */ jsx3("button", { onClick: onCancel, style: { padding: "6px 10px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontSize: 12 }, children: "\u2715" })
  ] });
  return createPortal(
    /* @__PURE__ */ jsxs3(Fragment, { children: [
      /* @__PURE__ */ jsx3(
        "canvas",
        {
          ref: canvasRef,
          style: { position: "fixed", inset: 0, zIndex: 2147483646, cursor: "crosshair" },
          onMouseDown: handleMouseDown,
          onMouseMove: handleMouseMove,
          onMouseUp: handleMouseUp
        }
      ),
      toolbar
    ] }),
    document.body
  );
}

// src/capture/ScreenshotCapture.tsx
import { Fragment as Fragment2, jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function ScreenshotCapture({ onCaptured }) {
  const { sdk, panelElementRef } = usePanelContext();
  const [capturing, setCapturing] = useState4(false);
  const [dataUrl, setDataUrl] = useState4(null);
  const [thumbnail, setThumbnail] = useState4(null);
  const [pendingPanelBlob, setPendingPanelBlob] = useState4(null);
  const [error, setError] = useState4(null);
  const handleCapture = async () => {
    setCapturing(true);
    setError(null);
    try {
      const { page, panel } = await captureScreenshot({ panelEl: panelElementRef?.current ?? null });
      setPendingPanelBlob(panel ?? null);
      const url = await blobToDataUrl(page);
      setDataUrl(url);
    } catch {
      setError("Screenshot capture failed");
    } finally {
      setCapturing(false);
    }
  };
  const handleAnnotationDone = async (blob) => {
    setDataUrl(null);
    setError(null);
    const ts = Date.now();
    const pageName = `screenshot-page-${ts}.png`;
    try {
      const url = await sdk.client.uploadAttachment(blob, pageName);
      sdk.conversation.setScreenshotUrl(url);
      sdk.conversation.addAttachment({ url, type: "screenshot", name: pageName, screenshotKind: "page" });
      setThumbnail(URL.createObjectURL(blob));
      onCaptured(url);
      if (pendingPanelBlob) {
        const panelName = `screenshot-panel-${ts}.png`;
        try {
          const panelUrl = await sdk.client.uploadAttachment(pendingPanelBlob, panelName);
          sdk.conversation.addAttachment({ url: panelUrl, type: "screenshot", name: panelName, screenshotKind: "panel" });
        } catch {
        }
      }
    } catch {
      setError("Upload failed");
    } finally {
      setPendingPanelBlob(null);
    }
  };
  return /* @__PURE__ */ jsxs4(Fragment2, { children: [
    dataUrl && /* @__PURE__ */ jsx4(
      AnnotationEditor,
      {
        imageDataUrl: dataUrl,
        onDone: handleAnnotationDone,
        onCancel: () => setDataUrl(null)
      }
    ),
    error && /* @__PURE__ */ jsxs4("div", { className: "panel-capture-error", role: "alert", children: [
      /* @__PURE__ */ jsx4("span", { children: error }),
      /* @__PURE__ */ jsx4("button", { onClick: () => setError(null), "aria-label": "Dismiss", children: "\xD7" })
    ] }),
    thumbnail ? /* @__PURE__ */ jsxs4("div", { style: { display: "flex", alignItems: "center", gap: 6, padding: "0 0 8px" }, children: [
      /* @__PURE__ */ jsx4("img", { src: thumbnail, alt: "Screenshot", style: { width: 48, height: 32, objectFit: "cover", borderRadius: 4, border: "1px solid var(--panel-border)" } }),
      /* @__PURE__ */ jsx4(
        "button",
        {
          onClick: () => {
            setThumbnail(null);
            sdk.conversation.setScreenshotUrl("");
          },
          style: { fontSize: 11, background: "none", border: "none", cursor: "pointer", color: "var(--panel-fg)", opacity: 0.6 },
          children: "Remove"
        }
      )
    ] }) : /* @__PURE__ */ jsx4(
      "button",
      {
        className: "panel-attach-btn",
        "aria-label": "Add screenshot",
        onClick: handleCapture,
        disabled: capturing,
        title: "Add screenshot",
        children: capturing ? /* @__PURE__ */ jsx4("span", { className: "panel-spinner" }) : /* @__PURE__ */ jsxs4("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ jsx4("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }),
          /* @__PURE__ */ jsx4("circle", { cx: "8.5", cy: "8.5", r: "1.5" }),
          /* @__PURE__ */ jsx4("polyline", { points: "21 15 16 10 5 21" })
        ] })
      }
    )
  ] });
}

// src/input/FileAttachment.tsx
import { useCallback as useCallback2, useEffect as useEffect2, useState as useState5 } from "react";
import { Fragment as Fragment3, jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
var MAX_FILE_SIZE = 10 * 1024 * 1024;
function FileAttachment({ onUploaded }) {
  const { sdk } = usePanelContext();
  const [uploading, setUploading] = useState5(false);
  const [error, setError] = useState5(null);
  useEffect2(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4e3);
    return () => clearTimeout(t);
  }, [error]);
  const handleChange = useCallback2(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError("File too large (max 10 MB)");
      e.target.value = "";
      return;
    }
    setUploading(true);
    setError(null);
    try {
      let blob = file;
      if (file.type.startsWith("image/") && file.size > 1024 * 1024) {
        const { default: imageCompression } = await import("browser-image-compression");
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        });
        blob = compressed;
      }
      const url = await sdk.client.uploadAttachment(blob, file.name);
      sdk.conversation.addAttachment({ url, type: "file", name: file.name });
      onUploaded(url, file.name);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [sdk, onUploaded]);
  return /* @__PURE__ */ jsxs5(Fragment3, { children: [
    /* @__PURE__ */ jsxs5(
      "label",
      {
        className: `panel-attach-btn${uploading ? "" : ""}`,
        "aria-label": "Attach file",
        style: { cursor: uploading ? "not-allowed" : "pointer" },
        children: [
          uploading ? /* @__PURE__ */ jsx5("span", { className: "panel-spinner" }) : /* @__PURE__ */ jsx5("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx5("path", { d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" }) }),
          /* @__PURE__ */ jsx5(
            "input",
            {
              type: "file",
              accept: "image/*,.pdf,.txt,.md",
              style: { display: "none" },
              onChange: handleChange,
              disabled: uploading
            }
          )
        ]
      }
    ),
    error && /* @__PURE__ */ jsx5("span", { className: "panel-attach-error", role: "alert", children: error })
  ] });
}

// src/chat/PanelChat.tsx
import { Fragment as Fragment4, jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
function PanelChat({ modeId, componentHint, submissionEnhancer, renderInputBarExtras }) {
  const { sdk } = usePanelContext();
  const [turns, setTurns] = useState6([]);
  const [preview, setPreview] = useState6(null);
  const [draft, setDraft] = useState6(null);
  const [phase, setPhase] = useState6("greeting");
  const [clarifyOptions, setClarifyOptions] = useState6(void 0);
  const [inputText, setInputText] = useState6("");
  const [isLoading, setIsLoading] = useState6(false);
  const [completed, setCompleted] = useState6(null);
  const [submitError, setSubmitError] = useState6(null);
  const [commentDraftBody, setCommentDraftBody] = useState6("");
  const [commentPosted, setCommentPosted] = useState6(null);
  const bottomRef = useRef3(null);
  const inputRef = useRef3(null);
  const started = useRef3(false);
  const submitInflightRef = useRef3(false);
  const syncFromSdk = () => {
    setTurns([...sdk.conversation.state.turns]);
    setDraft(sdk.conversation.state.draft ?? null);
    setPhase(sdk.conversation.state.phase);
    setClarifyOptions(sdk.conversation.state.clarifyOptions);
  };
  useEffect3(() => {
    if (started.current) return;
    started.current = true;
    if (sdk.conversation.state.turns.length > 0) {
      syncFromSdk();
      try {
        sdk.conversation.setMetadata(sdk.metadata.collect());
      } catch {
      }
      return () => {
        started.current = false;
      };
    }
    sdk.conversation.reset();
    setTurns([]);
    setPreview(null);
    setDraft(null);
    setCompleted(null);
    setCommentPosted(null);
    try {
      sdk.conversation.setMetadata(sdk.metadata.collect());
    } catch {
    }
    sdk.conversation.start(modeId).then(() => {
      syncFromSdk();
    }).catch(() => {
      setTurns([{
        role: "assistant",
        content: "Thanks for reaching out! What would you like to report?",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }]);
    });
    return () => {
      started.current = false;
    };
  }, [modeId]);
  useEffect3(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, preview, draft]);
  const sendUserText = async (text) => {
    if (!text.trim() || isLoading) return;
    setIsLoading(true);
    try {
      sdk.conversation.setMetadata(sdk.metadata.collect());
      if (phase === "commenting") {
        await sdk.conversation.respondToComment(text);
        setCommentDraftBody(sdk.conversation.getCommentDraftBody() ?? commentDraftBody);
      } else {
        const response = await sdk.conversation.respond(modeId, text);
        if (response.content === "__preview__") {
          setPreview(sdk.conversation.getPreview());
        }
      }
      syncFromSdk();
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText("");
    await sendUserText(text);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const handleDone = (issueUrl, issueNumber) => {
    setCompleted({ issueUrl, issueNumber });
  };
  const handleReset = () => {
    started.current = false;
    setCompleted(null);
    setCommentPosted(null);
    sdk.conversation.reset();
    setTurns([]);
    setPreview(null);
    setDraft(null);
    try {
      sdk.conversation.setMetadata(sdk.metadata.collect());
    } catch {
    }
    sdk.conversation.start(modeId).then(() => {
      syncFromSdk();
      started.current = true;
    });
  };
  const submitAgenticDraft = async (confirmBypass = false) => {
    if (submitInflightRef.current) return;
    if (!draft) return;
    submitInflightRef.current = true;
    setSubmitError(null);
    const metadata = sdk.metadata.collect();
    sdk.conversation.setMetadata(metadata);
    if (sdk.conversation.state.submissionId) {
      try {
        await sdk.conversation.patchDraft(draft);
      } catch (e) {
        console.warn("[Panel] patchDraft failed:", e);
      }
    }
    const payload = {
      transcript: sdk.conversation.state.turns.filter((t) => t.content !== "__preview__" && t.content !== "__draft__"),
      metadata,
      screenshotUrl: sdk.conversation.state.screenshotUrl,
      attachmentUrls: sdk.conversation.state.attachmentUrls,
      consoleErrors: sdk.metadata.collectConsoleErrors(),
      consoleWarnings: sdk.metadata.collectConsoleWarnings(),
      repo: sdk.config.repo,
      submissionId: sdk.conversation.state.submissionId,
      useDraft: true,
      confirmBypass,
      selectedModelId: sdk.conversation.state.selectedModelId
    };
    if (sdk.config.navigationTracking) {
      payload.navigationBreadcrumb = sdk.navigation.getBreadcrumb();
    }
    if (componentHint) payload.componentHint = componentHint;
    const finalPayload = submissionEnhancer ? submissionEnhancer(payload) : payload;
    try {
      const { id } = await sdk.client.submit(finalPayload);
      let pipelineError = null;
      await sdk.client.streamProcess(id, (event) => {
        if (event.type === "completed") {
          sdk.conversation.markSubmitted(event.issueUrl, event.issueNumber);
          setCompleted({ issueUrl: event.issueUrl ?? "", issueNumber: event.issueNumber });
        } else if (event.type === "error") {
          pipelineError = event.message ?? "Pipeline failed";
        }
      }, { repo: sdk.config.repo, panelRepo: sdk.config.panelRepo });
      if (pipelineError) {
        throw new Error(pipelineError);
      }
    } finally {
      submitInflightRef.current = false;
    }
  };
  const requestDraftChanges = async (text) => {
    await sendUserText(text);
  };
  const startCommentSession = async () => {
    if (!completed?.issueNumber) return;
    const issueBody = draft?.body ?? "";
    await sdk.conversation.startCommentSession(
      completed.issueNumber,
      completed.issueUrl,
      issueBody
    );
    syncFromSdk();
    setCompleted(null);
    setCommentDraftBody("");
  };
  const approveComment = async () => {
    const body = commentDraftBody.trim();
    if (!body) return;
    const result = await sdk.conversation.approveComment(body);
    setCommentPosted(result.commentUrl);
  };
  const isAgentic = sdk.conversation.state.mode === "agentic";
  if (completed && phase !== "commenting") {
    return /* @__PURE__ */ jsxs6("div", { className: "panel-chat", style: { alignItems: "center", justifyContent: "center", textAlign: "center" }, children: [
      /* @__PURE__ */ jsxs6("svg", { width: "40", height: "40", viewBox: "0 0 24 24", fill: "none", stroke: "#22c55e", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx6("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
        /* @__PURE__ */ jsx6("polyline", { points: "22 4 12 14.01 9 11.01" })
      ] }),
      /* @__PURE__ */ jsx6("p", { style: { fontSize: 14, marginTop: 8 }, children: "Issue created!" }),
      completed.issueUrl && /* @__PURE__ */ jsx6("a", { href: completed.issueUrl, target: "_blank", rel: "noopener noreferrer", style: { fontSize: 13, color: "var(--panel-accent)" }, children: "View on GitHub \u2192" }),
      /* @__PURE__ */ jsxs6("div", { style: { display: "flex", gap: 8, marginTop: 12 }, children: [
        completed.issueNumber && isAgentic && /* @__PURE__ */ jsx6(
          "button",
          {
            onClick: startCommentSession,
            style: { fontSize: 13, background: "var(--panel-accent)", color: "var(--panel-accent-fg)", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer" },
            children: "Request changes"
          }
        ),
        /* @__PURE__ */ jsx6(
          "button",
          {
            onClick: handleReset,
            style: { fontSize: 13, background: "none", border: "1px solid var(--panel-border)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", color: "var(--panel-fg)" },
            children: "Submit another"
          }
        )
      ] })
    ] });
  }
  if (commentPosted) {
    return /* @__PURE__ */ jsxs6("div", { className: "panel-chat", style: { alignItems: "center", justifyContent: "center", textAlign: "center" }, children: [
      /* @__PURE__ */ jsx6("p", { style: { fontSize: 14 }, children: "Comment posted!" }),
      /* @__PURE__ */ jsx6("a", { href: commentPosted, target: "_blank", rel: "noopener noreferrer", style: { fontSize: 13, color: "var(--panel-accent)" }, children: "View on GitHub \u2192" }),
      /* @__PURE__ */ jsx6(
        "button",
        {
          onClick: handleReset,
          style: { marginTop: 12, fontSize: 13, background: "none", border: "1px solid var(--panel-border)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", color: "var(--panel-fg)" },
          children: "Submit another"
        }
      )
    ] });
  }
  const visibleTurns = turns.filter((t) => t.content !== "__preview__" && t.content !== "__draft__");
  const inDrafting = phase === "drafting";
  const inCommenting = phase === "commenting";
  const inScriptedPreview = phase === "preview";
  const hideInput = inDrafting || inScriptedPreview;
  return /* @__PURE__ */ jsxs6(Fragment4, { children: [
    /* @__PURE__ */ jsxs6("div", { className: "panel-chat", children: [
      visibleTurns.map((turn, i) => /* @__PURE__ */ jsx6("div", { className: `panel-message ${turn.role} ${turn.kind ?? ""}`, children: turn.content }, i)),
      clarifyOptions && clarifyOptions.length > 0 && !isLoading && /* @__PURE__ */ jsx6("div", { className: "panel-clarify-options", children: clarifyOptions.map((opt) => /* @__PURE__ */ jsx6(
        "button",
        {
          className: "panel-clarify-option",
          onClick: () => sendUserText(opt),
          children: opt
        },
        opt
      )) }),
      isAgentic && inDrafting && draft && /* @__PURE__ */ jsx6(
        PreviewCard,
        {
          editable: true,
          draft,
          onDraftChange: (d) => {
            setDraft(d);
            sdk.conversation.updateDraft(d);
          },
          onSubmit: () => submitAgenticDraft(Boolean(submitError)),
          onRequestChanges: requestDraftChanges,
          screenshotUrl: sdk.conversation.state.screenshotUrl
        }
      ),
      isAgentic && inCommenting && /* @__PURE__ */ jsx6(
        PreviewCard,
        {
          editable: true,
          mode: "comment",
          draft: {
            title: "",
            body: commentDraftBody,
            severity: "medium",
            kind: "feedback"
          },
          onDraftChange: (d) => setCommentDraftBody(d.body),
          onSubmit: approveComment
        }
      ),
      !isAgentic && inScriptedPreview && preview && /* @__PURE__ */ jsxs6(Fragment4, { children: [
        /* @__PURE__ */ jsx6(PreviewCard, { preview }),
        /* @__PURE__ */ jsx6(
          SubmitButton,
          {
            modeId,
            onDone: handleDone,
            componentHint,
            submissionEnhancer
          }
        )
      ] }),
      isLoading && /* @__PURE__ */ jsxs6("div", { className: "panel-progress", children: [
        /* @__PURE__ */ jsx6("span", { className: "panel-spinner" }),
        /* @__PURE__ */ jsx6("span", { children: "Thinking\u2026" })
      ] }),
      /* @__PURE__ */ jsx6("div", { ref: bottomRef })
    ] }),
    !hideInput && /* @__PURE__ */ jsxs6("div", { className: "panel-input-bar", children: [
      /* @__PURE__ */ jsx6(ScreenshotCapture, { onCaptured: () => {
      } }),
      /* @__PURE__ */ jsx6(FileAttachment, { onUploaded: () => {
      } }),
      renderInputBarExtras?.(),
      /* @__PURE__ */ jsx6(
        "textarea",
        {
          ref: inputRef,
          className: "panel-input",
          value: inputText,
          onChange: (e) => setInputText(e.target.value),
          onKeyDown: handleKeyDown,
          placeholder: "Type your message\u2026",
          rows: 1,
          disabled: isLoading
        }
      ),
      /* @__PURE__ */ jsx6(
        "button",
        {
          className: "panel-send-btn",
          onClick: handleSend,
          disabled: !inputText.trim() || isLoading,
          "aria-label": "Send",
          children: /* @__PURE__ */ jsxs6("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ jsx6("line", { x1: "22", y1: "2", x2: "11", y2: "13" }),
            /* @__PURE__ */ jsx6("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })
          ] })
        }
      )
    ] })
  ] });
}

// src/chat/ModelPicker.tsx
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
function ModelPicker() {
  const { betaModelSelection, availableModels, selectedModelId, setSelectedModelId } = usePanelContext();
  if (!betaModelSelection || availableModels.length === 0) return null;
  return /* @__PURE__ */ jsxs7("div", { className: "panel-model-picker", children: [
    /* @__PURE__ */ jsx7("label", { className: "panel-model-picker-label", htmlFor: "panel-model-select", children: "Model" }),
    /* @__PURE__ */ jsx7(
      "select",
      {
        id: "panel-model-select",
        className: "panel-model-select",
        value: selectedModelId ?? "",
        onChange: (e) => setSelectedModelId(e.target.value),
        children: availableModels.map((m) => /* @__PURE__ */ jsxs7("option", { value: m.id, children: [
          m.label,
          " \xB7 ",
          m.provider
        ] }, m.id))
      }
    )
  ] });
}

// src/floating/SessionsBar.tsx
import { jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
function SessionsBar() {
  const { savedSessions, newSession, switchSession } = usePanelContext();
  if (savedSessions.length === 0) return null;
  return /* @__PURE__ */ jsxs8("div", { className: "panel-sessions-bar", role: "tablist", "aria-label": "Saved sessions", children: [
    savedSessions.map((s) => /* @__PURE__ */ jsx8(
      "button",
      {
        className: "panel-session-chip",
        onClick: () => switchSession(s.id),
        title: s.label,
        children: s.label
      },
      s.id
    )),
    /* @__PURE__ */ jsx8(
      "button",
      {
        className: "panel-session-chip panel-session-new",
        onClick: newSession,
        title: "Start a new conversation",
        "aria-label": "New session",
        children: "+ New"
      }
    )
  ] });
}

// src/floating/PanelSheet.tsx
import { jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
var MODE_LABELS = {
  feedback: "Feedback",
  "bug-report": "Bug Report",
  "ai-chat": "AI Chat",
  support: "Support"
};
function PanelSheet({ componentHint, submissionEnhancer, renderInputBarExtras } = {}) {
  const { isOpen, setIsOpen, capabilities, activeModeId, setActiveModeId, currentSessionId, registerPanelElement } = usePanelContext();
  const sheetRef = useRef4(null);
  useEffect4(() => {
    if (isOpen) {
      registerPanelElement(sheetRef.current);
      return () => registerPanelElement(null);
    }
    return void 0;
  }, [isOpen, registerPanelElement]);
  useEffect4(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, setIsOpen]);
  useEffect4(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) {
        const target = e.target;
        if (!target.closest(".panel-button")) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [isOpen, setIsOpen]);
  if (!isOpen || !capabilities) return null;
  const allModes = ["feedback", "bug-report", "ai-chat", "support"];
  const availableModes = capabilities.modes ?? ["feedback"];
  return /* @__PURE__ */ jsxs9("div", { className: "panel-sheet", ref: sheetRef, role: "dialog", "aria-label": "Feedback panel", children: [
    /* @__PURE__ */ jsx9(ModelPicker, {}),
    /* @__PURE__ */ jsx9(SessionsBar, {}),
    /* @__PURE__ */ jsx9("div", { className: "panel-tabs", role: "tablist", children: allModes.map((modeId) => {
      const isAvailable = availableModes.includes(modeId);
      return /* @__PURE__ */ jsxs9(
        "button",
        {
          role: "tab",
          className: `panel-tab ${activeModeId === modeId ? "active" : ""}`,
          disabled: !isAvailable,
          title: !isAvailable ? "Coming soon" : void 0,
          onClick: () => isAvailable && setActiveModeId(modeId),
          "aria-selected": activeModeId === modeId,
          children: [
            MODE_LABELS[modeId] ?? modeId,
            !isAvailable && " \u{1F512}"
          ]
        },
        modeId
      );
    }) }),
    /* @__PURE__ */ jsx9(
      PanelChat,
      {
        modeId: activeModeId,
        componentHint,
        submissionEnhancer,
        renderInputBarExtras
      },
      currentSessionId
    )
  ] });
}

export {
  PreviewCard,
  SubmitButton,
  AnnotationEditor,
  ScreenshotCapture,
  FileAttachment,
  PanelChat,
  PanelSheet
};
//# sourceMappingURL=chunk-CQ2G3ZBR.mjs.map