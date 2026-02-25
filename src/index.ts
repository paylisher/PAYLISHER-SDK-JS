import { PaylisherConfig, DEFAULT_CONFIG } from './config';
import { Tracker } from './tracker';
import { Campaign } from './campaign';
import { PlatformAdapter } from './platform/interface';
import { WebPlatformAdapter } from './platform/web';
import { PaylisherDeepLinkConfig } from './deeplink/config';
import { PaylisherDeepLinkManager, PaylisherDeepLinkHandler } from './deeplink/manager';
import { PaylisherDeferredDeepLinkConfig } from './deferred/config';
import { DeferredDeepLinkCallbacks, PaylisherDeferredDeepLinkManager } from './deferred/manager';

export class PaylisherSDK {
    public config: PaylisherConfig;
    private tracker: Tracker;
    private campaign: Campaign;
    private deepLinkManager: PaylisherDeepLinkManager;
    private deferredDeepLinkManager: PaylisherDeferredDeepLinkManager;
    private adapter: PlatformAdapter;
    private initialized = false;

    constructor(adapter?: PlatformAdapter) {
        this.config = DEFAULT_CONFIG as PaylisherConfig;
        this.adapter = adapter || new WebPlatformAdapter();
        this.config.platformAdapter = this.adapter;

        this.tracker = new Tracker(this.config, this.adapter);
        this.campaign = new Campaign(this.config, this.adapter);
        this.deepLinkManager = new PaylisherDeepLinkManager(this.tracker, this.campaign);
        this.deferredDeepLinkManager = new PaylisherDeferredDeepLinkManager(this.campaign, this.tracker, this.adapter, this.deepLinkManager);
    }

    public init(apiKey: string, config: Partial<PaylisherConfig> = {}): void {
        if (this.initialized) {
            console.warn('Paylisher SDK already initialized');
            return;
        }

        // Map legacy/snippet config to new config
        const legacyConfig = config as any;
        if (legacyConfig.api_host) {
            config.dataStudioHost = legacyConfig.api_host;
        }

        this.config = { ...DEFAULT_CONFIG, ...config, apiKey };
        // If config passed a new adapter, use it, otherwise keep default
        if (config.platformAdapter) {
            this.adapter = config.platformAdapter;
        }

        this.tracker = new Tracker(this.config, this.adapter);
        this.campaign = new Campaign(this.config, this.adapter);
        this.deepLinkManager = new PaylisherDeepLinkManager(this.tracker, this.campaign, !!this.config.debug);
        this.deferredDeepLinkManager = new PaylisherDeferredDeepLinkManager(
            this.campaign,
            this.tracker,
            this.adapter,
            this.deepLinkManager,
            {
                ...(new PaylisherDeferredDeepLinkConfig()),
                ...(this.config.deferredDeepLinkConfig || {}),
            },
        );
        this.initialized = true;

        if (this.config.debug) {
            console.log('Paylisher SDK Initialized', this.config);
        }

        // Auto-track page view
        this.tracker.trackPageView();

        this.deepLinkManager.initialize({
            ...(new PaylisherDeepLinkConfig()),
            ...(this.config.deepLinkConfig || {}),
        });
        this.deepLinkManager.handleCurrentUrl();
    }

    public track(event: string, properties?: any, userProperties?: any, userPropertiesSetOnce?: any): void {
        this.tracker.track(event, properties, userProperties, userPropertiesSetOnce);
    }

    public identify(id: string): void {
        this.tracker.identify(id);
    }

    public configureDeepLinks(config: Partial<PaylisherDeepLinkConfig>): void {
        this.deepLinkManager.initialize(config);
    }

    public configureDeferredDeepLink(config: Partial<PaylisherDeferredDeepLinkConfig>): void {
        this.deferredDeepLinkManager.updateConfig(config);
    }

    public setDeepLinkHandler(handler: PaylisherDeepLinkHandler): void {
        this.deepLinkManager.handler = handler;
    }

    public handleDeepLink(url: string): boolean {
        return this.deepLinkManager.handleURL(url);
    }

    public completePendingDeepLink(): void {
        this.deepLinkManager.completePendingDeepLink();
    }

    public clearPendingDeepLink(): void {
        this.deepLinkManager.clearPendingDeepLink();
    }

    public cancelPendingDeepLink(): void {
        this.deepLinkManager.cancelPendingDeepLink();
    }

    public hasPendingDeepLink(): boolean {
        return this.deepLinkManager.hasPendingDeepLink();
    }

    public getPendingDeepLinkDestination(): string | null {
        return this.deepLinkManager.getPendingDestination();
    }

    public async deferredDeepLink(deeplinkUrl: string, campaignKey?: string): Promise<void> {
        this.track('install_intent_clicked', { deeplink_url: deeplinkUrl, campaign_key: campaignKey });
        await this.campaign.recordClick(deeplinkUrl, campaignKey);
    }

    /**
     * Fetch deferred deeplink match from campaign backend
     * Used to check if there's a matching deeplink for this device
     *
     * @returns Promise<any> - Matched deeplink data or null
     */
    public async fetchDeferredDeeplink(): Promise<any> {
        return await this.campaign.fetchDeferredDeeplink();
    }

    public async checkDeferredDeepLink(callbacks: DeferredDeepLinkCallbacks): Promise<void> {
        await this.deferredDeepLinkManager.check(callbacks);
    }

    public async resetDeferredDeepLinkForTesting(): Promise<void> {
        await this.deferredDeepLinkManager.resetForTesting();
    }
}

// Default export for Web (auto-instantiated)
const paylisherInstance = new PaylisherSDK(new WebPlatformAdapter());

// --- Queue Draining Logic (Web Only) ---
if (typeof window !== 'undefined') {
    // The snippet creates: window.paylisher = { _i: [], init: ..., push: ... }
    const win = window as any;
    const existingStub = win.paylisher;

    if (existingStub && Array.isArray(existingStub._i)) {
        // Process the '_i' array which contains init arguments: [[apiKey, config, name]]
        existingStub._i.forEach((args: any[]) => {
            if (args.length >= 1) {
                const apiKey = args[0];
                const config = args[1] || {};
                paylisherInstance.init(apiKey, config);
            }
        });
    }

    // Replace the stub with the real instance
    win.paylisher = paylisherInstance;
}

export default paylisherInstance;
export { PaylisherDeepLinkConfig, PaylisherDeepLinkManager };
export type { PaylisherDeepLinkHandler } from './deeplink/manager';
export { PaylisherDeferredDeepLinkConfig };
export type { DeferredDeepLinkCallbacks } from './deferred/manager';
