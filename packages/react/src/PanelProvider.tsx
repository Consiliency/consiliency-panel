import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { PanelSDK } from "@consiliency/panel-core";
import type {
  CapabilitiesResponse,
  ModeId,
  PanelConfig,
  PanelModelOption,
  SavedSession,
} from "@consiliency/panel-types";

interface PanelContextValue {
  sdk: PanelSDK;
  capabilities: CapabilitiesResponse | null;
  activeModeId: ModeId;
  setActiveModeId: (id: ModeId) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedModelId: string | undefined;
  setSelectedModelId: (id: string) => void;
  betaModelSelection: boolean;
  availableModels: PanelModelOption[];
  /** Snapshots of prior conversations from this panel-open lifecycle */
  savedSessions: SavedSession[];
  currentSessionId: string;
  newSession: () => void;
  switchSession: (id: string) => void;
  /** Ref of the panel sheet root, used by ScreenshotCapture for dual-capture */
  panelElementRef: React.MutableRefObject<HTMLElement | null>;
  registerPanelElement: (el: HTMLElement | null) => void;
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

  const sdk = useMemo(() => {
    if (sdkRef.current) sdkRef.current.destroy();
    const s = new PanelSDK(config);
    sdkRef.current = s;
    return s;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.apiUrl, config.apiKey, config.repo, config.panelRepo, config.githubLogin]);

  const [capabilities, setCapabilities] = useState<CapabilitiesResponse | null>(null);
  const [activeModeId, setActiveModeId] = useState<ModeId>("feedback");
  const [isOpen, setIsOpenState] = useState(false);
  const [selectedModelId, setSelectedModelIdState] = useState<string | undefined>(
    config.defaultModelId,
  );
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() =>
    sdk.conversation.getCurrentSessionId(),
  );
  const panelElementRef = useRef<HTMLElement | null>(null);

  const setIsOpen = (open: boolean) => {
    if (!open && isOpen) {
      // Closing the panel — clear saved sessions to mirror prior portal lifecycle
      sdk.conversation.clearSavedSessions();
      setSavedSessions([]);
      setCurrentSessionId(sdk.conversation.getCurrentSessionId());
    }
    setIsOpenState(open);
  };

  const newSession = () => {
    const newId = sdk.conversation.newSession();
    setSavedSessions(sdk.conversation.listSavedSessions());
    setCurrentSessionId(newId);
  };

  const switchSession = (id: string) => {
    const switched = sdk.conversation.switchToSession(id);
    setSavedSessions(sdk.conversation.listSavedSessions());
    setCurrentSessionId(switched);
  };

  const registerPanelElement = (el: HTMLElement | null) => {
    panelElementRef.current = el;
  };

  useEffect(() => {
    let cancelled = false;
    sdk.init().then(() => {
      if (!cancelled) {
        const caps = sdk.getCapabilities();
        setCapabilities(caps);
        const modes = sdk.getAvailableModes();
        if (modes.length > 0) setActiveModeId(modes[0]);
        // If no embedder-side default, adopt the backend recommendation
        if (!config.defaultModelId && caps?.defaultModelId) {
          setSelectedModelIdState(caps.defaultModelId);
          sdk.setSelectedModelId(caps.defaultModelId);
        }
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
  }, [sdk, config.defaultModelId]);

  const setSelectedModelId = (id: string) => {
    setSelectedModelIdState(id);
    sdk.setSelectedModelId(id);
  };

  const betaModelSelection =
    config.betaModelSelection ?? capabilities?.betaModelSelection ?? false;

  const availableModels = useMemo<PanelModelOption[]>(() => {
    if (config.availableModels && config.availableModels.length > 0) return config.availableModels;
    return capabilities?.models ?? [];
  }, [config.availableModels, capabilities?.models]);

  const value = useMemo(
    () => ({
      sdk,
      capabilities,
      activeModeId,
      setActiveModeId,
      isOpen,
      setIsOpen,
      selectedModelId,
      setSelectedModelId,
      betaModelSelection,
      availableModels,
      savedSessions,
      currentSessionId,
      newSession,
      switchSession,
      panelElementRef,
      registerPanelElement,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sdk, capabilities, activeModeId, isOpen, selectedModelId, betaModelSelection, availableModels, savedSessions, currentSessionId],
  );

  return <PanelContext.Provider value={value}>{children}</PanelContext.Provider>;
}
