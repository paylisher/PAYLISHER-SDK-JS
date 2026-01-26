import { PaylisherConfig } from './config';
import { post } from './utils/http';
import { getUtmParams } from './utils/url';
import { PlatformAdapter } from './platform/interface';

// Simple UUID generator if uuid package isn't installed
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export class Tracker {
    private config: PaylisherConfig;
    private adapter: PlatformAdapter;
    private distinctId: string | null = null;

    constructor(config: PaylisherConfig, adapter: PlatformAdapter) {
        this.config = config;
        this.adapter = adapter;
        this.initDistinctId();
    }

    private async initDistinctId() {
        let id = await this.adapter.getItem('paylisher_distinct_id');
        if (!id) {
            id = generateUUID();
            this.adapter.setItem('paylisher_distinct_id', id);
        }
        this.distinctId = id;
    }

    public trackPageView(): void {
        const deviceInfo = this.adapter.getDeviceInfo();
        // PageView is mostly a web concept, but we keep it safe for RN too
        if (typeof window !== 'undefined') {
            this.track('$pageview', {
                $current_url: window.location.href,
                $pathname: window.location.pathname,
                $referrer: document.referrer,
                $title: document.title,
            });
        } else {
            this.track('$screen_view', {
                $screen_name: 'App', // RN users should pass properties manually
            });
        }
    }

    public identify(id: string): void {
        this.distinctId = id;
        this.adapter.setItem('paylisher_distinct_id', id);
        this.track('$identify', { distinct_id: id });
    }

    public async track(event: string, properties: any = {}): Promise<void> {
        // Ensure ID is loaded
        if (!this.distinctId) {
            await this.initDistinctId();
        }

        const utm = getUtmParams(); // This handles window check internally? No, need to verify
        const deviceInfo = await this.adapter.getDeviceInfo();

        // PostHog /capture/ format
        const payload = {
            api_key: this.config.apiKey,
            event: event,
            properties: {
                distinct_id: this.distinctId,
                $lib: 'paylisher-js-sdk',
                $lib_version: '1.1.0',
                $screen_width: deviceInfo.screenWidth,
                $screen_height: deviceInfo.screenHeight,
                ...utm,
                ...properties,
            },
            timestamp: new Date().toISOString(),
        };

        if (this.config.debug) {
            console.log('Paylisher: Tracking event', payload);
        }

        // DataStudio (PostHog) Endpoint
        const url = `${this.config.dataStudioHost}/capture/`;
        post(url, payload, true).catch(e => {
            if (this.config.debug) console.error("Track error", e);
        });
    }
}
