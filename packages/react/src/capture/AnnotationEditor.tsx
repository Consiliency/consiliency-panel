import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Tool = "arrow" | "rect" | "freehand" | "text" | "blur";

interface Annotation {
  id: string;
  type: Tool;
  points: number[];
  color: string;
  text?: string;
}

interface AnnotationEditorProps {
  imageDataUrl: string;
  onDone: (annotatedBlob: Blob) => void;
  onCancel: () => void;
}

/**
 * Full-viewport annotation overlay. Rendered into document.body via createPortal
 * so it's not clipped by Shadow DOM's overflow:hidden ancestors.
 */
export function AnnotationEditor({ imageDataUrl, onDone, onCancel }: AnnotationEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>("arrow");
  const [color, setColor] = useState("#ef4444");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<number[]>([]);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load image onto canvas
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      redraw([]);
    };
    img.src = imageDataUrl;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageDataUrl]);

  const redraw = useCallback((annots: Annotation[]) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Draw screenshot scaled to fit
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const x = (canvas.width - img.width * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

    // Draw annotations
    annots.forEach((a) => {
      ctx.strokeStyle = a.color;
      ctx.fillStyle = a.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      if (a.type === "arrow" && a.points.length >= 4) {
        const [x1, y1, x2, y2] = a.points;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        // Arrowhead
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

  const getPos = (e: React.MouseEvent) => ({ x: e.clientX, y: e.clientY });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === "text") {
      const input = prompt("Enter text:");
      if (input) {
        const newAnnot: Annotation = {
          id: Date.now().toString(),
          type: "text",
          points: [e.clientX, e.clientY],
          color,
          text: input,
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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);

    if (activeTool === "freehand") {
      setCurrentPoints((prev) => [...prev, x, y]);
    } else {
      setCurrentPoints((prev) => [prev[0], prev[1], x, y]);
    }

    // Preview current stroke
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    redraw(annotations);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    // Draw in-progress annotation
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

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const { x, y } = getPos(e);
    const finalPoints = activeTool === "freehand"
      ? [...currentPoints, x, y]
      : [currentPoints[0], currentPoints[1], x, y];

    if (finalPoints.length >= 2) {
      const newAnnot: Annotation = {
        id: Date.now().toString(),
        type: activeTool,
        points: finalPoints,
        color,
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if ((e.ctrlKey || e.metaKey) && e.key === "z") handleUndo();
      if (e.key === "Enter") handleDone();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotations]);

  const TOOLS: { id: Tool; label: string }[] = [
    { id: "arrow", label: "→" },
    { id: "rect", label: "□" },
    { id: "freehand", label: "✏" },
    { id: "text", label: "T" },
    { id: "blur", label: "◼" },
  ];

  const toolbar = (
    <div style={{
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
      alignItems: "center",
    }}>
      {TOOLS.map((t) => (
        <button
          key={t.id}
          title={t.id}
          onClick={() => setActiveTool(t.id)}
          style={{
            width: 32, height: 32, borderRadius: 6, border: "none",
            background: activeTool === t.id ? "#6366f1" : "#2d2d3d",
            color: "#fff", cursor: "pointer", fontSize: 16,
          }}
        >
          {t.label}
        </button>
      ))}
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 32, height: 32, border: "none", borderRadius: 6, cursor: "pointer" }} />
      <button onClick={handleUndo} title="Undo (Ctrl+Z)" style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#2d2d3d", color: "#fff", cursor: "pointer", fontSize: 12 }}>↩</button>
      <button onClick={handleDone} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Done ↵</button>
      <button onClick={onCancel} style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontSize: 12 }}>✕</button>
    </div>
  );

  return createPortal(
    <>
      <canvas
        ref={canvasRef}
        style={{ position: "fixed", inset: 0, zIndex: 2147483646, cursor: "crosshair" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      {toolbar}
    </>,
    document.body
  );
}
