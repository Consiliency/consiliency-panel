import type { CapabilitiesResponse, ModeId, PanelConfig } from "@consiliency/panel-types";
import { PanelApiClient } from "./client";
import { ConversationEngine } from "./conversation";
import { MetadataCollector } from "./metadata";
import { ModeRegistry } from "./modes";
import { VoiceInput } from "./voice";

export class PanelSDK {
  readonly config: PanelConfig;
  readonly client: PanelApiClient;
  readonly metadata: MetadataCollector;
  readonly modes: ModeRegistry;
  readonly voice: VoiceInput;
  readonly conversation: ConversationEngine;

  private capabilities: CapabilitiesResponse | null = null;

  constructor(config: PanelConfig) {
    if (!config.apiUrl) throw new Error("PanelSDK: apiUrl is required");
    if (!config.apiKey) throw new Error("PanelSDK: apiKey is required");
    if (!config.repo) throw new Error("PanelSDK: repo is required");

    this.config = config;
    this.client = new PanelApiClient({ apiUrl: config.apiUrl, apiKey: config.apiKey });
    this.metadata = new MetadataCollector();
    this.modes = new ModeRegistry();
    this.voice = new VoiceInput();
    this.conversation = new ConversationEngine(this.modes);
  }

  async init(): Promise<void> {
    this.capabilities = await this.client.getCapabilities();
  }

  getCapabilities(): CapabilitiesResponse | null {
    return this.capabilities;
  }

  getAvailableModes(): ModeId[] {
    return this.capabilities?.modes ?? [];
  }

  destroy(): void {
    this.metadata.destroy();
    this.voice.abort();
  }
}
