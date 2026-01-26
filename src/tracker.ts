import { PaylisherConfig } from './config';
import { post } from './utils/http';
import { getUtmParams } from './utils/url';
// Simple UUID generator if uuid package isn't installed
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getDistinctId(): string {
    let id = localStorage.getItem('paylisher_distinct_id');
    if (!id) {
        id = generateUUID();
        localStorage.setItem('paylisher_distinct_id', id);
    }
    return id;
}

export class Tracker {
    private config: PaylisherConfig;
    private distinctId: string;

    constructor(config: PaylisherConfig) {
        this.config = config;
        this.distinctId = getDistinctId();
    }

    public trackPageView(): void {
        this.track('$pageview', {
            $current_url: window.location.href,
            $pathname: window.location.pathname,
            $referrer: document.referrer,
            $title: document.title,
        });
    }

    public identify(id: string): void {
        this.distinctId = id;
        localStorage.setItem('paylisher_distinct_id', id);
        this.track('$identify', { distinct_id: id });
    }

    public track(event: string, properties: any = {}): void {
        const utm = getUtmParams();

        // PostHog /capture/ format
        const payload = {
            api_key: this.config.apiKey,
            event: event,
            properties: {
                distinct_id: this.distinctId,
                $lib: 'paylisher-web-sdk',
                $lib_version: '1.0.0',
                $screen_width: window.screen.width,
                $screen_height: window.screen.height,
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
