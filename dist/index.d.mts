import { PanelConfig, CapabilitiesResponse, ModeId, PanelModelOption, SavedSession, SubmissionPayload, IssuePreview, IssueDraft } from '@consiliency/panel-types';
import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';
import { PanelSDK } from '@consiliency/panel-core';

/**
 * Mount the panel into a Shadow DOM attached to `container` (or auto-created).
 * Returns an unmount function.
 */
declare function mountPanel(config: PanelConfig, container?: HTMLElement): () => void;

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
declare function usePanelContext(): PanelContextValue;
interface PanelProviderProps {
    config: PanelConfig;
    children?: React.ReactNode;
}
declare function PanelProvider({ config, children }: PanelProviderProps): react_jsx_runtime.JSX.Element;

/** Floating action button that toggles the panel open/closed */
declare function PanelButton(): react_jsx_runtime.JSX.Element | null;

interface PanelSheetProps {
    componentHint?: string;
    submissionEnhancer?: (payload: SubmissionPayload) => SubmissionPayload;
    renderInputBarExtras?: () => React.ReactNode;
}
/** Floating panel sheet containing mode tabs + chat */
declare function PanelSheet({ componentHint, submissionEnhancer, renderInputBarExtras }?: PanelSheetProps): react_jsx_runtime.JSX.Element | null;

interface PanelChatProps {
    modeId: ModeId;
    componentHint?: string;
    submissionEnhancer?: (payload: SubmissionPayload) => SubmissionPayload;
    renderInputBarExtras?: () => React.ReactNode;
}
declare function PanelChat({ modeId, componentHint, submissionEnhancer, renderInputBarExtras }: PanelChatProps): react_jsx_runtime.JSX.Element;

interface ReadOnlyProps {
    preview: IssuePreview;
    editable?: false;
}
interface EditableProps {
    editable: true;
    draft: IssueDraft;
    onDraftChange: (draft: IssueDraft) => void;
    onSubmit: () => Promise<void> | void;
    onRequestChanges?: (text: string) => void;
    screenshotUrl?: string;
    /** When mode is "comment", hide title + kind inputs — body is the only field */
    mode?: "issue" | "comment";
}
type PreviewCardProps = ReadOnlyProps | EditableProps;
declare function PreviewCard(props: PreviewCardProps): react_jsx_runtime.JSX.Element;

interface SubmitButtonProps {
    modeId: ModeId;
    onDone: (issueUrl: string) => void;
    componentHint?: string;
    submissionEnhancer?: (payload: SubmissionPayload) => SubmissionPayload;
}
declare function SubmitButton({ modeId, onDone, componentHint, submissionEnhancer }: SubmitButtonProps): react_jsx_runtime.JSX.Element;

interface AnnotationEditorProps {
    imageDataUrl: string;
    onDone: (annotatedBlob: Blob) => void;
    onCancel: () => void;
}
/**
 * Full-viewport annotation overlay. Rendered into document.body via createPortal
 * so it's not clipped by Shadow DOM's overflow:hidden ancestors.
 */
declare function AnnotationEditor({ imageDataUrl, onDone, onCancel }: AnnotationEditorProps): React.ReactPortal;

interface ScreenshotCaptureProps {
    onCaptured: (url: string) => void;
}
/** Screenshot button + annotation workflow */
declare function ScreenshotCapture({ onCaptured }: ScreenshotCaptureProps): react_jsx_runtime.JSX.Element;

interface VoiceInputProps {
    modeId: ModeId;
    onTranscript: (text: string) => void;
}
/** Push-to-talk voice input button. Falls back gracefully if Web Speech API unavailable. */
declare function VoiceInput({ modeId: _modeId, onTranscript }: VoiceInputProps): react_jsx_runtime.JSX.Element | null;

interface FileAttachmentProps {
    onUploaded: (url: string, filename: string) => void;
}
/** Attachment button — click to browse, shows upload progress */
declare function FileAttachment({ onUploaded }: FileAttachmentProps): react_jsx_runtime.JSX.Element;

export { AnnotationEditor, FileAttachment, PanelButton, PanelChat, PanelProvider, PanelSheet, PreviewCard, ScreenshotCapture, SubmitButton, VoiceInput, mountPanel, usePanelContext };
