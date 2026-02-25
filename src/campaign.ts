import { PaylisherConfig } from './config';
import { generateFingerprint } from './fingerprint';
import { post, get, getPublicIp } from './utils/http';
import { getUrlParams } from './utils/url';
import { PlatformAdapter } from './platform/interface';
import { PaylisherResolvedDeepLinkPayload } from './deeplink/model';

export class Campaign {
    private config: PaylisherConfig;
    private adapter: PlatformAdapter;

    constructor(config: PaylisherConfig, adapter: PlatformAdapter) {
        this.config = config;
        this.adapter = adapter;
    }

    private getDeferredHost(): string | null {
        return this.config.deferredDeepLinkAPIHost || this.config.campaignHost || null;
    }

    private getResolveHost(): string {
        return this.config.campaignResolveHost || 'https://api.paylisher.com';
    }

    private buildDeferredCheckUrl(baseHost: string, fingerprint: string): string {
        const trimmed = baseHost.replace(/\/+$/, '');
        if (trimmed.includes('/deferred-deeplink')) {
            return `${trimmed}?fingerprint=${encodeURIComponent(fingerprint)}`;
        }
        return `${trimmed}/deferred-deeplink?fingerprint=${encodeURIComponent(fingerprint)}`;
    }

    private buildDeferredClickUrl(baseHost: string): string {
        const trimmed = baseHost.replace(/\/+$/, '');
        if (trimmed.includes('/deferred-deeplink')) {
            return `${trimmed}/click`;
        }
        return `${trimmed}/deferred-deeplink/click`;
    }

    public async recordClick(deeplinkUrl: string, campaignKey?: string, metadata?: any): Promise<void> {
        try {
            const deferredHost = this.getDeferredHost();
            if (!deferredHost) {
                if (this.config.debug) {
                    console.warn('Paylisher: campaignHost is not set. Skipping deferred click recording.');
                }
                return;
            }

            const ip = await getPublicIp();
            const deviceInfo = await this.adapter.getDeviceInfo();
            const fingerprint = await generateFingerprint(deviceInfo.userAgent, ip);
            const urlParams = getUrlParams(); // Captures all URL query parameters

            // If campaignKey is missing, try to find it in URL params
            const effectiveCampaignKey = campaignKey || (urlParams ? urlParams['utm_campaign'] : undefined) || 'organic';

            const payload = {
                fingerprint,
                deeplink_url: deeplinkUrl,
                campaign_key: effectiveCampaignKey,
                click_timestamp: new Date().toISOString(),
                user_agent: deviceInfo.userAgent,
                ip_address: ip,
                platform: deviceInfo.platform,
                source: 'web', // Flag to indicate web origin
                metadata: {
                    ...(urlParams || {}), // All URL params (utm_*, fbclid, gclid, ttclid, custom params, etc.)
                    ...(metadata || {}),
                    is_web_sdk: true, // Additional web SDK flag
                },
            };

            if (this.config.debug) {
                console.log('Paylisher: Recording click', payload);
            }

            const url = this.buildDeferredClickUrl(deferredHost);
            await post(url, payload);

        } catch (error) {
            console.error('Paylisher: Failed to record click', error);
        }
    }

    /**
     * Fetch deferred deeplink match
     * Called by mobile app (or web) to check if there's a matching deeplink
     *
     * @returns Promise<any> - Returns matched deeplink data or null if no match
     */
    public async fetchDeferredDeeplink(): Promise<any> {
        try {
            const deferredHost = this.getDeferredHost();
            if (!deferredHost) {
                if (this.config.debug) {
                    console.warn('Paylisher: campaignHost is not set. Skipping deferred deeplink check.');
                }
                return null;
            }

            const ip = await getPublicIp();
            const deviceInfo = await this.adapter.getDeviceInfo();
            const fingerprint = await generateFingerprint(deviceInfo.userAgent, ip);

            if (this.config.debug) {
                console.log('Paylisher: Fetching deferred deeplink with fingerprint:', fingerprint.substring(0, 16) + '...');
            }

            const url = this.buildDeferredCheckUrl(deferredHost, fingerprint);
            const response = await get(url);

            if (this.config.debug) {
                console.log('Paylisher: Deferred deeplink response:', response);
            }

            // Response format from backend:
            // Match found: { matched: true, deeplink_url: "...", campaign_key: "...", metadata: {...} }
            // No match: { matched: false, message: "No match found" }
            return response;

        } catch (error) {
            console.error('Paylisher: Failed to fetch deferred deeplink', error);
            return null;
        }
    }

    public async resolveCampaign(keyName: string): Promise<PaylisherResolvedDeepLinkPayload | null> {
        try {
            const url = `${this.getResolveHost()}/campaign/resolve/${encodeURIComponent(keyName)}`;
            return await get(url);
        } catch (error) {
            if (this.config.debug) {
                console.warn('Paylisher: campaign resolve failed', error);
            }
            return null;
        }
    }
}
