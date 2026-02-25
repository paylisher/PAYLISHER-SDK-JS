import { Campaign } from '../campaign';
import { Tracker } from '../tracker';
import { PlatformAdapter } from '../platform/interface';
import { PaylisherDeepLinkManager } from '../deeplink/manager';
import { PaylisherDeferredDeepLinkConfig } from './config';

export interface DeferredDeepLinkResult {
    matched: boolean;
    url?: string;
    campaignKey?: string;
    jid?: string;
    metadata?: Record<string, any>;
    raw?: any;
}

export interface DeferredDeepLinkCallbacks {
    onSuccess: (result: DeferredDeepLinkResult) => void;
    onNoMatch: () => void;
    onError: (error: Error) => void;
}

export class PaylisherDeferredDeepLinkManager {
    private static readonly CHECKED_KEY = 'paylisher_deferred_checked';

    private campaign: Campaign;
    private tracker: Tracker;
    private adapter: PlatformAdapter;
    private deepLinkManager: PaylisherDeepLinkManager;
    private config: PaylisherDeferredDeepLinkConfig;
    private isChecking = false;

    constructor(
        campaign: Campaign,
        tracker: Tracker,
        adapter: PlatformAdapter,
        deepLinkManager: PaylisherDeepLinkManager,
        config?: Partial<PaylisherDeferredDeepLinkConfig>,
    ) {
        this.campaign = campaign;
        this.tracker = tracker;
        this.adapter = adapter;
        this.deepLinkManager = deepLinkManager;
        this.config = new PaylisherDeferredDeepLinkConfig(config || {});
    }

    public updateConfig(config?: Partial<PaylisherDeferredDeepLinkConfig>): void {
        this.config = new PaylisherDeferredDeepLinkConfig({ ...this.config, ...(config || {}) });
    }

    public async check(callbacks: DeferredDeepLinkCallbacks): Promise<void> {
        if (!this.config.enabled) {
            callbacks.onNoMatch();
            return;
        }

        if (this.isChecking) {
            callbacks.onNoMatch();
            return;
        }

        const checked = await Promise.resolve(this.adapter.getItem(PaylisherDeferredDeepLinkManager.CHECKED_KEY));
        if (checked === '1') {
            callbacks.onNoMatch();
            return;
        }

        this.isChecking = true;
        try {
            const response = await this.campaign.fetchDeferredDeeplink();
            await Promise.resolve(this.adapter.setItem(PaylisherDeferredDeepLinkManager.CHECKED_KEY, '1'));

            const normalized = this.normalizeResponse(response);
            if (!normalized.matched || !normalized.url) {
                this.captureNoMatchEvent();
                callbacks.onNoMatch();
                return;
            }

            this.captureAttributionEvent(normalized);
            callbacks.onSuccess(normalized);

            if (this.config.autoHandleDeepLink && normalized.url) {
                this.deepLinkManager.handleURL(normalized.url);
            }
        } catch (error) {
            const typedError = error instanceof Error ? error : new Error('Unknown deferred deep link error');
            this.captureErrorEvent(typedError);
            callbacks.onError(typedError);
        } finally {
            this.isChecking = false;
        }
    }

    public async resetForTesting(): Promise<void> {
        await Promise.resolve(this.adapter.setItem(PaylisherDeferredDeepLinkManager.CHECKED_KEY, '0'));
        this.isChecking = false;
    }

    private normalizeResponse(response: any): DeferredDeepLinkResult {
        if (!response) {
            return { matched: false };
        }

        const matched = response.matched === true || response.status === 'match';
        const url = response.url || response.deeplink_url;
        const campaignKey = response.campaignKey || response.campaign_key;
        const jid = response.jid;
        const metadata = response.metadata || {};

        if (!matched) {
            return { matched: false, raw: response };
        }

        const enriched = this.enrichUrl(url, campaignKey, jid);
        return {
            matched: true,
            url: enriched,
            campaignKey,
            jid,
            metadata,
            raw: response,
        };
    }

    private enrichUrl(url: string, campaignKey?: string, jid?: string): string {
        try {
            const parsed = typeof window !== 'undefined'
                ? new URL(url, window.location.origin)
                : new URL(url);

            if (campaignKey && !parsed.searchParams.get('keyName') && !parsed.searchParams.get('key') && !parsed.searchParams.get('k')) {
                parsed.searchParams.set('keyName', campaignKey);
            }
            if (jid && !parsed.searchParams.get('jid')) {
                parsed.searchParams.set('jid', jid);
            }
            return parsed.toString();
        } catch {
            return url;
        }
    }

    private captureAttributionEvent(result: DeferredDeepLinkResult): void {
        const properties: Record<string, any> = {
            url: result.url || '',
            campaign_key: result.campaignKey || '',
            jid: result.jid || '',
            source: 'deferred_deeplink',
            is_first_launch: true,
            ...this.config.additionalEventProperties,
        };

        if (result.campaignKey) {
            properties.$set_once = {
                deeplink_key: result.campaignKey,
            };
        }

        if (result.metadata) {
            properties.metadata = result.metadata;
        }

        this.tracker.track('Deferred Deep Link Match', properties);
    }

    private captureNoMatchEvent(): void {
        this.tracker.track('Deferred Deep Link Check', {
            is_first_launch: true,
            status: 'no_match',
            ...this.config.additionalEventProperties,
        });
    }

    private captureErrorEvent(error: Error): void {
        this.tracker.track('Deferred Deep Link Error', {
            is_first_launch: true,
            status: 'error',
            error_message: error.message,
            ...this.config.additionalEventProperties,
        });
    }
}

