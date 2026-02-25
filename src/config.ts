import type { PaylisherDeepLinkConfigOptions } from './deeplink/config';
import type { PaylisherDeferredDeepLinkConfigOptions } from './deferred/config';

export interface PaylisherConfig {
    apiKey: string;
    dataStudioHost?: string; // e.g. https://ds.i.paylisher.com
    campaignHost?: string;   // Optional deferred deeplink host
    campaignResolveHost?: string; // Optional campaign resolve host
    deepLinkConfig?: Partial<PaylisherDeepLinkConfigOptions>;
    deferredDeepLinkConfig?: Partial<PaylisherDeferredDeepLinkConfigOptions>;
    deferredDeepLinkAPIHost?: string;
    debug?: boolean;
    platformAdapter?: any; // To avoid circular dependency in config, type is loose, but implementation enforces it
}

export const DEFAULT_CONFIG: Partial<PaylisherConfig> = {
    dataStudioHost: process.env.DATA_STUDIO_HOST,
    campaignHost: process.env.CAMPAIGN_HOST,
    campaignResolveHost: process.env.CAMPAIGN_RESOLVE_HOST || 'https://api.paylisher.com',
    debug: false,
};
