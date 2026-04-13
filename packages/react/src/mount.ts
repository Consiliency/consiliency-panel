import type { PanelConfig } from "@consiliency/panel-types";
import type { Root } from "react-dom/client";

/**
 * Mount the panel into a Shadow DOM attached to `container` (or auto-created).
 * Returns an unmount function.
 */
export function mountPanel(config: PanelConfig, container?: HTMLElement): () => void {
  // Dynamic import to keep this module tree-shakeable on server
  // All React/DOM work happens lazily
  let root: Root | null = null;
  let hostEl: HTMLElement | null = null;
  let shadowRoot: ShadowRoot | null = null;

  const mount = async () => {
    const [React, { createRoot }, { PanelProvider }, { PanelButton }, { PanelSheet }] =
      await Promise.all([
        import("react"),
        import("react-dom/client"),
        import("./PanelProvider"),
        import("./floating/PanelButton"),
        import("./floating/PanelSheet"),
      ]);

    // Load stylesheet as text and inject into shadow root
    // (bundlers typically inline CSS via ?raw or similar — consumers handle this)
    hostEl = container ?? document.createElement("div");
    hostEl.id = "consiliency-panel-root";
    if (!container) document.body.appendChild(hostEl);

    shadowRoot = hostEl.attachShadow({ mode: "open" });

    // Inject styles — consumers may also provide their own via CSS custom properties on :root
    const styleEl = document.createElement("style");
    // Minimal inline reset so the shadow DOM isn't affected by host page styles
    styleEl.textContent = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`;
    shadowRoot.appendChild(styleEl);

    const mountPoint = document.createElement("div");
    shadowRoot.appendChild(mountPoint);

    root = createRoot(mountPoint);
    root.render(
      React.createElement(PanelProvider, { config }, [
        React.createElement(PanelButton, { key: "btn" }),
        React.createElement(PanelSheet, { key: "sheet" }),
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
