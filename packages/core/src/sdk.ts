import type { CapabilitiesResponse, ModeId, PanelConfig } from "@consiliency/panel-types";
import { PanelApiClient } from "./client";
import { ConversationEngine } from "./conversation";
import { MetadataCollector } from "./metadata";
import { ModeRegistry } from "./modes";
import { NavigationTracker } from "./navigation";
import { VoiceInput } from "./voice";

export class PanelSDK {
  readonly config: PanelConfig;
  readonly client: PanelApiClient;
  readonly metadata: MetadataCollector;
  readonly modes: ModeRegistry;
  readonly voice: VoiceInput;
  readonly conversation: ConversationEngine;
  readonly navigation: NavigationTracker;

  private capabilities: CapabilitiesResponse | null = null;
  private resolvedGithubLogin: string | undefined;

  constructor(config: PanelConfig) {
    if (!config.apiUrl) throw new Error("PanelSDK: apiUrl is required");
    if (!config.apiKey) throw new Error("PanelSDK: apiKey is required");
    if (!config.repo) throw new Error("PanelSDK: repo is required");

    this.config = config;
    this.resolvedGithubLogin = config.githubLogin;
    this.client = new PanelApiClient({
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      githubLoginGetter: () => this.resolvedGithubLogin,
    });
    this.metadata = new MetadataCollector();
    this.modes = new ModeRegistry();
    this.voice = new VoiceInput();
    this.conversation = new ConversationEngine(this.modes);
    this.conversation.setClient(this.client);
    this.conversation.setContext({
      repo: config.repo,
      panelRepo: config.panelRepo,
      githubLogin: this.resolvedGithubLogin,
    });
    if (config.defaultModelId) {
      this.conversation.setSelectedModelId(config.defaultModelId);
    }
    this.navigation = new NavigationTracker(config.navigationTracking === true);
  }

  async init(): Promise<void> {
    // Resolve the GitHub login first if a resolver is provided and we don't
    // already have one statically — capabilities depend on it for tier lookup.
    if (!this.resolvedGithubLogin && this.config.resolveGithubLogin) {
      try {
        const login = await this.config.resolveGithubLogin();
        if (login) {
          this.resolvedGithubLogin = login;
          this.conversation.setContext({
            repo: this.config.repo,
            panelRepo: this.config.panelRepo,
            githubLogin: login,
          });
        }
      } catch {
        /* fall back to anonymous */
      }
    }

    this.capabilities = await this.client.getCapabilities();
    // Prefer backend-recommended default if no embedder override
    if (!this.config.defaultModelId && this.capabilities?.defaultModelId) {
      this.conversation.setSelectedModelId(this.capabilities.defaultModelId);
    }
  }

  getGithubLogin(): string | undefined {
    return this.resolvedGithubLogin;
  }

  setSelectedModelId(id: string | undefined): void {
    this.conversation.setSelectedModelId(id);
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
    this.navigation.destroy();
  }
}
