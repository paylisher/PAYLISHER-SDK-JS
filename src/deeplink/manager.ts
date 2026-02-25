import { Tracker } from '../tracker';
import { Campaign } from '../campaign';
import { PaylisherDeepLinkConfig } from './config';
import { PaylisherDeepLinkTracker } from './tracker';
import { PaylisherResolvedDeepLinkPayload, toPropertiesDictionary } from './model';

export class PaylisherDeepLink {
    public url: URL;
    public scheme: string;
    public destination: string;
    public parameters: Record<string, string>;
    public authParamRequired: boolean;
    public campaignId?: string;
    public source?: string;
    public jid?: string;
    public timestamp: Date;
    public rawQuery?: string;
    public campaignKeyName?: string;
    public campaignData?: PaylisherResolvedDeepLinkPayload;

    constructor(args: {
        url: URL;
        scheme: string;
        destination: string;
        parameters: Record<string, string>;
        authParamRequired: boolean;
        campaignId?: string;
        source?: string;
        jid?: string;
        rawQuery?: string;
        campaignKeyName?: string;
    }) {
        this.url = args.url;
        this.scheme = args.scheme;
        this.destination = args.destination;
        this.parameters = args.parameters;
        this.authParamRequired = args.authParamRequired;
        this.campaignId = args.campaignId;
        this.source = args.source;
        this.jid = args.jid;
        this.rawQuery = args.rawQuery;
        this.campaignKeyName = args.campaignKeyName;
        this.timestamp = new Date();
    }
}

export interface PaylisherDeepLinkHandler {
    paylisherDidReceiveDeepLink: (deepLink: PaylisherDeepLink, requiresAuth: boolean) => void;
    paylisherDeepLinkRequiresAuth?: (deepLink: PaylisherDeepLink, completion: (success: boolean) => void) => void;
    paylisherDeepLinkDidFail?: (url: URL, error?: Error) => void;
}

export class PaylisherDeepLinkManager {
    public config: PaylisherDeepLinkConfig = new PaylisherDeepLinkConfig();
    public handler?: PaylisherDeepLinkHandler;
    public pendingDeepLink: PaylisherDeepLink | null = null;
    public lastDeepLink: PaylisherDeepLink | null = null;
    public pendingHandlerDeepLink: PaylisherDeepLink | null = null;

    private isInitialized = false;
    private pendingTimer: ReturnType<typeof setTimeout> | null = null;
    private tracker: Tracker;
    private campaign: Campaign;
    private deepLinkTracker: PaylisherDeepLinkTracker;
    private debugEnabled: boolean;

    constructor(tracker: Tracker, campaign: Campaign, debugEnabled = false) {
        this.tracker = tracker;
        this.campaign = campaign;
        this.deepLinkTracker = new PaylisherDeepLinkTracker(tracker);
        this.debugEnabled = debugEnabled;
    }

    public initialize(config?: Partial<PaylisherDeepLinkConfig>): void {
        if (config) {
            this.config = new PaylisherDeepLinkConfig({ ...this.config, ...config });
        }
        this.isInitialized = true;
        this.log('DeepLinkManager initialized');

        if (this.pendingHandlerDeepLink) {
            const pending = this.pendingHandlerDeepLink;
            this.pendingHandlerDeepLink = null;
            this.processDeepLink(pending);
        }
    }

    public handleCurrentUrl(): boolean {
        if (typeof window === 'undefined') {
            return false;
        }
        return this.handleURL(window.location.href);
    }

    public handleURL(rawUrl: string | URL): boolean {
        if (!this.isInitialized) {
            this.log('DeepLinkManager not initialized. Call initialize() first.');
            return false;
        }

        const url = this.normalizeUrl(rawUrl);
        if (!url) {
            return false;
        }

        this.log(`Handling URL: ${url.toString()}`);
        this.deepLinkTracker.logIncoming(url, this.getSource(url));

        const deepLink = this.parseURL(url);
        if (!deepLink) {
            if (this.config.captureDeepLinkEvents) {
                this.captureDeepLinkFailedEvent(url);
            }
            this.handler?.paylisherDeepLinkDidFail?.(url);
            return false;
        }

        this.lastDeepLink = deepLink;
        if (!this.handler) {
            this.pendingHandlerDeepLink = deepLink;
            return true;
        }

        this.processDeepLink(deepLink);
        return true;
    }

    public completePendingDeepLink(): void {
        if (!this.pendingDeepLink) {
            this.log('No pending deep link to complete');
            return;
        }

        const pending = this.pendingDeepLink;
        if (this.config.captureDeepLinkEvents) {
            this.captureDeepLinkCompletedEvent(pending);
        }
        this.handler?.paylisherDidReceiveDeepLink(pending, false);
        this.clearPendingDeepLink();
    }

    public clearPendingDeepLink(): void {
        if (this.pendingTimer) {
            clearTimeout(this.pendingTimer);
            this.pendingTimer = null;
        }
        this.pendingDeepLink = null;
    }

    public cancelPendingDeepLink(): void {
        if (!this.pendingDeepLink) {
            return;
        }
        if (this.config.captureDeepLinkEvents) {
            this.captureDeepLinkCancelledEvent(this.pendingDeepLink);
        }
        this.clearPendingDeepLink();
    }

    public hasPendingDeepLink(): boolean {
        return !!this.pendingDeepLink;
    }

    public getPendingDestination(): string | null {
        return this.pendingDeepLink?.destination || null;
    }

    private normalizeUrl(rawUrl: string | URL): URL | null {
        try {
            if (rawUrl instanceof URL) {
                return rawUrl;
            }
            if (typeof window !== 'undefined') {
                return new URL(rawUrl, window.location.origin);
            }
            return new URL(rawUrl);
        } catch (error) {
            this.log(`Invalid URL: ${String(rawUrl)}`);
            return null;
        }
    }

    private processDeepLink(deepLink: PaylisherDeepLink): void {
        if (deepLink.campaignKeyName) {
            this.resolveCampaignForDeepLink(deepLink, deepLink.campaignKeyName);
        } else if (this.config.captureDeepLinkEvents) {
            this.captureDeepLinkEvent(deepLink);
        }

        const requiresAuth = this.isAuthRequired(deepLink);
        this.log(`Deep link parsed - destination: ${deepLink.destination}, requiresAuth: ${requiresAuth}, jid: ${deepLink.jid || 'none'}`);

        if (this.config.autoHandleDeepLinks && requiresAuth) {
            this.setPendingDeepLink(deepLink);
            if (this.handler?.paylisherDeepLinkRequiresAuth) {
                this.handler.paylisherDeepLinkRequiresAuth(deepLink, (success: boolean) => {
                    if (success) {
                        this.completePendingDeepLink();
                    } else {
                        this.clearPendingDeepLink();
                    }
                });
            }
        }

        this.handler?.paylisherDidReceiveDeepLink(deepLink, requiresAuth);
    }

    private parseURL(url: URL): PaylisherDeepLink | null {
        const scheme = url.protocol.replace(':', '');
        let destination = '';
        if (scheme === 'http' || scheme === 'https') {
            destination = url.pathname.replace(/^\/+|\/+$/g, '');
        } else {
            destination = url.host;
        }
        if (!destination) {
            return null;
        }

        const parameters: Record<string, string> = {};
        Array.from(url.searchParams.entries()).forEach(([key, value]) => {
            parameters[key] = value;
        });

        const authParamRequired = (parameters.auth || '').toLowerCase() === 'required';
        const campaignId = parameters.campaign || parameters.campaign_id || parameters.utm_campaign;
        const source = parameters.source || parameters.utm_source;
        const jid = parameters.jid;
        const campaignKeyName = this.deepLinkTracker.extractCampaignKey(url) || undefined;

        return new PaylisherDeepLink({
            url,
            scheme,
            destination,
            parameters,
            authParamRequired,
            campaignId,
            source,
            jid,
            rawQuery: url.search.replace('?', ''),
            campaignKeyName,
        });
    }

    private async resolveCampaignForDeepLink(deepLink: PaylisherDeepLink, keyName: string): Promise<void> {
        try {
            const resolved = await this.campaign.resolveCampaign(keyName);
            if (resolved) {
                deepLink.campaignData = resolved;
                this.deepLinkTracker.logResolved(deepLink.url, this.getSource(deepLink.url), resolved);
            }
        } catch (error) {
            const typedError = error instanceof Error ? error : new Error('Unknown resolve error');
            this.deepLinkTracker.logResolutionFailed(deepLink.url, this.getSource(deepLink.url), keyName, typedError);
        } finally {
            if (this.config.captureDeepLinkEvents) {
                this.captureDeepLinkEvent(deepLink);
            }
        }
    }

    private isAuthRequired(deepLink: PaylisherDeepLink): boolean {
        if (this.config.authRequiredDestinations.includes(deepLink.destination)) {
            return true;
        }
        return deepLink.authParamRequired;
    }

    private setPendingDeepLink(deepLink: PaylisherDeepLink): void {
        this.clearPendingDeepLink();
        this.pendingDeepLink = deepLink;
        this.pendingTimer = setTimeout(() => {
            if (!this.pendingDeepLink) {
                return;
            }
            if (this.config.captureDeepLinkEvents) {
                this.captureDeepLinkTimeoutEvent(this.pendingDeepLink);
            }
            this.clearPendingDeepLink();
        }, this.config.pendingDeepLinkTimeoutSeconds * 1000);
    }

    private captureDeepLinkEvent(deepLink: PaylisherDeepLink): void {
        const properties: Record<string, any> = {
            destination: deepLink.destination,
            scheme: deepLink.scheme,
            full_url: deepLink.url.toString(),
            auth_required: this.isAuthRequired(deepLink),
            has_campaign_key: !!deepLink.campaignKeyName,
            campaign_resolved: !!deepLink.campaignData,
            ...this.config.additionalEventProperties,
        };

        if (deepLink.jid) properties.jid = deepLink.jid;
        if (deepLink.campaignId) properties.campaign_id = deepLink.campaignId;
        if (deepLink.source) properties.source = deepLink.source;
        if (deepLink.campaignKeyName) {
            properties.campaign_key = deepLink.campaignKeyName;
            properties.$set_once = { deeplink_key: deepLink.campaignKeyName };
        }
        if (Object.keys(deepLink.parameters).length > 0) {
            properties.parameters = deepLink.parameters;
        }
        if (deepLink.campaignData) {
            Object.assign(properties, toPropertiesDictionary(deepLink.campaignData));
        }

        this.tracker.track('Deep Link Opened', properties);
    }

    private captureDeepLinkCompletedEvent(deepLink: PaylisherDeepLink): void {
        this.tracker.track('Deep Link Completed', {
            destination: deepLink.destination,
            scheme: deepLink.scheme,
            was_pending: true,
            time_to_complete: (Date.now() - deepLink.timestamp.getTime()) / 1000,
            ...this.config.additionalEventProperties,
        });
    }

    private captureDeepLinkFailedEvent(url: URL): void {
        this.tracker.track('Deep Link Failed', {
            url: url.toString(),
            scheme: url.protocol.replace(':', ''),
            failure_reason: 'parse_error',
            ...this.config.additionalEventProperties,
        });
    }

    private captureDeepLinkTimeoutEvent(deepLink: PaylisherDeepLink): void {
        this.tracker.track('Deep Link Timeout', {
            destination: deepLink.destination,
            scheme: deepLink.scheme,
            full_url: deepLink.url.toString(),
            timeout_seconds: this.config.pendingDeepLinkTimeoutSeconds,
            waited_seconds: (Date.now() - deepLink.timestamp.getTime()) / 1000,
            ...this.config.additionalEventProperties,
        });
    }

    private captureDeepLinkCancelledEvent(deepLink: PaylisherDeepLink): void {
        this.tracker.track('Deep Link Cancelled', {
            destination: deepLink.destination,
            scheme: deepLink.scheme,
            full_url: deepLink.url.toString(),
            time_before_cancel: (Date.now() - deepLink.timestamp.getTime()) / 1000,
            ...this.config.additionalEventProperties,
        });
    }

    private getSource(url: URL): string {
        const scheme = url.protocol.replace(':', '');
        return scheme === 'http' || scheme === 'https' ? 'universal_link' : 'url_scheme';
    }

    private log(message: string): void {
        if (this.debugEnabled || this.config.debugLogging) {
            console.log(`[PaylisherDeepLink] ${message}`);
        }
    }
}

