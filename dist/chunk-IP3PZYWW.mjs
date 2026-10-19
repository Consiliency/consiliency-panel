import {
  usePanelContext
} from "./chunk-MJEBL2M5.mjs";

// src/floating/PanelButton.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function PanelButton() {
  const { isOpen, setIsOpen, capabilities } = usePanelContext();
  if (!capabilities) return null;
  return /* @__PURE__ */ jsx(
    "button",
    {
      className: "panel-button",
      "aria-label": isOpen ? "Close feedback panel" : "Open feedback panel",
      onClick: () => setIsOpen(!isOpen),
      children: isOpen ? (
        // X icon
        /* @__PURE__ */ jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", children: [
          /* @__PURE__ */ jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
          /* @__PURE__ */ jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
        ] })
      ) : (
        // Chat bubble icon
        /* @__PURE__ */ jsx("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) })
      )
    }
  );
}

export {
  PanelButton
};
//# sourceMappingURL=chunk-IP3PZYWW.mjs.map