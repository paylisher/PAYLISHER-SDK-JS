import { PaylisherConfig } from './config';
import { post } from './utils/http';
import { getUrlParams } from './utils/url';
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
    private sessionId: string | null = null;
    private sessionTimeout = 30 * 60 * 1000; // 30 minutes in milliseconds

    constructor(config: PaylisherConfig, adapter: PlatformAdapter) {
        this.config = config;
        this.adapter = adapter;
        this.initDistinctId();
        this.initSessionId();
    }

    private async initDistinctId() {
        let id = await this.adapter.getItem('paylisher_distinct_id');
        if (!id) {
            id = generateUUID();
            this.adapter.setItem('paylisher_distinct_id', id);
        }
        this.distinctId = id;
    }

    private async initSessionId() {
        const now = Date.now();
        const storedSessionId = await this.adapter.getItem('paylisher_session_id');
        const lastActivityStr = await this.adapter.getItem('paylisher_last_activity');
        const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : 0;

        // Check if session expired (30 minutes of inactivity)
        if (storedSessionId && lastActivity && (now - lastActivity < this.sessionTimeout)) {
            // Session is still valid, reuse it
            this.sessionId = storedSessionId;
        } else {
            // Create new session
            this.sessionId = generateUUID().toUpperCase();
            this.adapter.setItem('paylisher_session_id', this.sessionId);
        }

        // Update last activity timestamp
        this.adapter.setItem('paylisher_last_activity', now.toString());
    }

    private async refreshSession() {
        const now = Date.now();
        this.adapter.setItem('paylisher_last_activity', now.toString());
    }

    public trackPageView(): void {
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

    public async track(event: string, properties: any = {}, userProperties?: any, userPropertiesSetOnce?: any): Promise<void> {
        // Ensure ID is loaded
        if (!this.distinctId) {
            await this.initDistinctId();
        }

        // Ensure session is loaded
        if (!this.sessionId) {
            await this.initSessionId();
        }

        // Refresh session activity timestamp
        await this.refreshSession();

        const urlParams = getUrlParams(); // All URL query parameters (utm_*, fbclid, gclid, etc.)
        const deviceInfo = await this.adapter.getDeviceInfo();

        // Automatic $set properties (sent with every event, like iOS/Android SDK)
        const autoSetProperties = {
            $screen_width: deviceInfo.screenWidth,
            $screen_height: deviceInfo.screenHeight,
            $device_type: deviceInfo.deviceType,
            $device_manufacturer: deviceInfo.deviceManufacturer,
            $device_model: deviceInfo.deviceModel,
            $device_name: deviceInfo.deviceName,
            $os: deviceInfo.osName,
            $os_name: deviceInfo.osName,
            $os_version: deviceInfo.osVersion,
            $browser: deviceInfo.browser,
            $browser_version: deviceInfo.browserVersion,
            $locale: deviceInfo.locale,
            $timezone: deviceInfo.timezone,
            // Merge with user-provided properties
            ...userProperties,
        };

        // Automatic $set_once properties (initial values, only set once)
        const autoSetOnceProperties = {
            $initial_screen_width: deviceInfo.screenWidth,
            $initial_screen_height: deviceInfo.screenHeight,
            $initial_device_type: deviceInfo.deviceType,
            $initial_device_manufacturer: deviceInfo.deviceManufacturer,
            $initial_device_model: deviceInfo.deviceModel,
            $initial_device_name: deviceInfo.deviceName,
            $initial_os: deviceInfo.osName,
            $initial_os_name: deviceInfo.osName,
            $initial_os_version: deviceInfo.osVersion,
            $initial_browser: deviceInfo.browser,
            $initial_browser_version: deviceInfo.browserVersion,
            $initial_locale: deviceInfo.locale,
            $initial_timezone: deviceInfo.timezone,
            // Merge with user-provided set_once properties
            ...userPropertiesSetOnce,
        };

        // DataStudio uses /batch endpoint (same as mobile SDKs: iOS & Android)
        // Payload format matches mobile SDK structure
        const eventData: any = {
            event: event,
            properties: {
                distinct_id: this.distinctId,
                $session_id: this.sessionId,
                $lib: 'paylisher-js-sdk',
                $lib_version: '1.1.0',
                $screen_width: deviceInfo.screenWidth,
                $screen_height: deviceInfo.screenHeight,
                $device_type: deviceInfo.deviceType,
                $device_manufacturer: deviceInfo.deviceManufacturer,
                $device_model: deviceInfo.deviceModel,
                $device_name: deviceInfo.deviceName,
                $os: deviceInfo.osName,
                $os_name: deviceInfo.osName,
                $os_version: deviceInfo.osVersion,
                $browser: deviceInfo.browser,
                $browser_version: deviceInfo.browserVersion,
                $locale: deviceInfo.locale,
                $timezone: deviceInfo.timezone,
                $source: 'web', // Flag to indicate web origin
                $is_web_sdk: true, // Additional explicit flag
                ...urlParams, // Include all URL parameters for flexible attribution
                ...properties,
            },
            timestamp: new Date().toISOString(),
        };

        // Add $set (user properties that update on every event)
        eventData.properties.$set = autoSetProperties;

        // Add $set_once (user properties that only set on first occurrence)
        eventData.properties.$set_once = autoSetOnceProperties;

        const payload = {
            api_key: this.config.apiKey,
            batch: [eventData],
            sent_at: new Date().toISOString(),
        };

        if (this.config.debug) {
            console.log('Paylisher: Tracking event', payload);
        }

        // DataStudio Endpoint (matches iOS & Android SDKs)
        const url = `${this.config.dataStudioHost}/batch`;
        post(url, payload, false).catch(e => {
            if (this.config.debug) console.error("Track error", e);
        });
    }
}
