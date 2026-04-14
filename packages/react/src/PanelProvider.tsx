import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { PanelSDK } from "@consiliency/panel-core";
import type { CapabilitiesResponse, ModeId, PanelConfig } from "@consiliency/panel-types";

interface PanelContextValue {
  sdk: PanelSDK;
  capabilities: CapabilitiesResponse | null;
  activeModeId: ModeId;
  setActiveModeId: (id: ModeId) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const PanelContext = createContext<PanelContextValue | null>(null);

export function usePanelContext(): PanelContextValue {
  const ctx = useContext(PanelContext);
  if (!ctx) throw new Error("usePanelContext must be used within PanelProvider");
  return ctx;
}

interface PanelProviderProps {
  config: PanelConfig;
  children?: React.ReactNode;
}

export function PanelProvider({ config, children }: PanelProviderProps) {
  const sdkRef = useRef<PanelSDK | null>(null);

  // Stable SDK instance — only recreated if config changes identity
  const sdk = useMemo(() => {
    if (sdkRef.current) sdkRef.current.destroy();
    const s = new PanelSDK(config);
    sdkRef.current = s;
    return s;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.apiUrl, config.apiKey, config.repo]);

  const [capabilities, setCapabilities] = useState<CapabilitiesResponse | null>(null);
  const [activeModeId, setActiveModeId] = useState<ModeId>("feedback");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    sdk.init().then(() => {
      if (!cancelled) {
        setCapabilities(sdk.getCapabilities());
        const modes = sdk.getAvailableModes();
        if (modes.length > 0) setActiveModeId(modes[0]);
      }
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[Panel] SDK init failed: ${msg}. ` +
        "Check your apiUrl, apiKey, and PANEL_ALLOWED_ORIGINS backend config. " +
        "The panel button will not render until init succeeds."
      );
    });
    return () => {
      cancelled = true;
      sdk.destroy();
    };
  }, [sdk]);

  const value = useMemo(
    () => ({ sdk, capabilities, activeModeId, setActiveModeId, isOpen, setIsOpen }),
    [sdk, capabilities, activeModeId, isOpen]
  );

  return <PanelContext.Provider value={value}>{children}</PanelContext.Provider>;
}
