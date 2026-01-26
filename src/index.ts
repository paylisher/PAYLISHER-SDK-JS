import { PaylisherConfig, DEFAULT_CONFIG } from './config';
import { Tracker } from './tracker';
import { Campaign } from './campaign';

class PaylisherSDK {
    public config: PaylisherConfig;
    private tracker: Tracker;
    private campaign: Campaign;
    private initialized = false;

    constructor() {
        this.config = DEFAULT_CONFIG as PaylisherConfig;
        this.tracker = new Tracker(this.config);
        this.campaign = new Campaign(this.config);
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
        this.tracker = new Tracker(this.config);
        this.campaign = new Campaign(this.config);
        this.initialized = true;

        if (this.config.debug) {
            console.log('Paylisher SDK Initialized', this.config);
        }

        // Auto-track page view
        this.tracker.trackPageView();
    }

    public track(event: string, properties?: any): void {
        this.tracker.track(event, properties);
    }

    public identify(id: string): void {
        this.tracker.identify(id);
    }

    public async deferredDeepLink(deeplinkUrl: string, campaignKey?: string): Promise<void> {
        this.track('install_intent_clicked', { deeplink_url: deeplinkUrl, campaign_key: campaignKey });
        await this.campaign.recordClick(deeplinkUrl, campaignKey);
    }
}

const paylisherInstance = new PaylisherSDK();

// --- Queue Draining Logic ---
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

export default paylisherInstance;
