import { Tracker } from '../tracker';
import { PaylisherResolvedDeepLinkPayload, toPropertiesDictionary } from './model';

export class PaylisherDeepLinkTracker {
    private tracker: Tracker;

    constructor(tracker: Tracker) {
        this.tracker = tracker;
    }

    public logIncoming(url: URL, source: string): void {
        const components = new URL(url.toString());
        const queryItems = Array.from(components.searchParams.entries());
        const queryDict: Record<string, string> = {};
        queryItems.forEach(([key, value]) => {
            queryDict[key] = value;
        });

        const pathComponents = components.pathname.split('/').filter(Boolean);
        const properties: Record<string, any> = {
            source,
            timestamp: new Date().toISOString(),
            full_url: components.toString(),
            scheme: components.protocol.replace(':', ''),
            host: components.host,
            path: components.pathname,
            path_components: pathComponents,
            query: components.search.replace('?', ''),
            query_items: queryDict,
            fragment: components.hash.replace('#', ''),
            query_param_count: queryItems.length,
            path_component_count: pathComponents.length,
            has_campaign_key: false,
        };

        const campaignKey = this.extractCampaignKey(url);
        if (campaignKey) {
            properties.campaign_key_detected = campaignKey;
            properties.has_campaign_key = true;
        }

        this.tracker.track('deeplink_received', properties);
    }

    public logResolved(url: URL, source: string, resolved: PaylisherResolvedDeepLinkPayload): void {
        const properties: Record<string, any> = {
            source,
            timestamp: new Date().toISOString(),
            opened_full_url: url.toString(),
            opened_scheme: url.protocol.replace(':', ''),
            opened_host: url.host,
            opened_path: url.pathname,
            ...toPropertiesDictionary(resolved),
            has_web_url: !!resolved.webUrl,
            has_ios_url: !!resolved.iosUrl,
            has_android_url: !!resolved.androidUrl,
            has_fallback_url: !!resolved.fallbackUrl,
            has_custom_scheme: !!resolved.scheme,
            has_webhook: !!resolved.webhookUrl,
            has_metadata: !!resolved.metaData && Object.keys(resolved.metaData).length > 0,
        };

        this.tracker.track('deeplink_resolved', properties);
    }

    public logResolutionFailed(url: URL, source: string, keyName: string, error: Error): void {
        this.tracker.track('deeplink_resolve_failed', {
            source,
            timestamp: new Date().toISOString(),
            full_url: url.toString(),
            campaign_key: keyName,
            error_description: error.message,
            error_type: error.name,
        });
    }

    public logNavigation(destination: string, url: URL, source: string): void {
        this.tracker.track('deeplink_navigation', {
            destination,
            source,
            timestamp: new Date().toISOString(),
            full_url: url.toString(),
            navigation_category: 'deeplink',
        });
    }

    public logUniversalLink(url: URL, host: string, path: string): void {
        const queryDict: Record<string, string> = {};
        Array.from(url.searchParams.entries()).forEach(([key, value]) => {
            queryDict[key] = value;
        });

        this.tracker.track('universal_link_received', {
            host,
            path,
            full_url: url.toString(),
            timestamp: new Date().toISOString(),
            query_items: queryDict,
            navigation_category: 'universal_link',
            campaign_key: this.extractCampaignKey(url) || '',
        });
    }

    public extractCampaignKey(url: URL): string | null {
        const keyName = url.searchParams.get('keyName');
        if (keyName) return keyName;
        const key = url.searchParams.get('key');
        if (key) return key;
        const shortKey = url.searchParams.get('k');
        if (shortKey) return shortKey;

        const pathParts = url.pathname.split('/').filter(Boolean);
        const campaignIndex = pathParts.indexOf('campaign');
        if (campaignIndex >= 0 && pathParts[campaignIndex + 1]) {
            return pathParts[campaignIndex + 1];
        }

        const cIndex = pathParts.indexOf('c');
        if (cIndex >= 0 && pathParts[cIndex + 1]) {
            return pathParts[cIndex + 1];
        }

        if (pathParts.length === 1 && pathParts[0].length >= 10) {
            return pathParts[0];
        }

        return null;
    }
}

