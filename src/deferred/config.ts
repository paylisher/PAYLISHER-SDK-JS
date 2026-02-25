export interface PaylisherDeferredDeepLinkConfigOptions {
    enabled: boolean;
    attributionWindowMillis: number;
    includeIDFA: boolean;
    debugLogging: boolean;
    autoHandleDeepLink: boolean;
    additionalEventProperties: Record<string, any>;
    deferredDeepLinkAPIHost?: string;
    apiTimeoutMillis: number;
}

export class PaylisherDeferredDeepLinkConfig implements PaylisherDeferredDeepLinkConfigOptions {
    public enabled = false;
    public attributionWindowMillis = 24 * 60 * 60 * 1000;
    public includeIDFA = true;
    public debugLogging = false;
    public autoHandleDeepLink = true;
    public additionalEventProperties: Record<string, any> = {};
    public deferredDeepLinkAPIHost?: string;
    public apiTimeoutMillis = 10000;

    constructor(options: Partial<PaylisherDeferredDeepLinkConfigOptions> = {}) {
        Object.assign(this, options);
    }
}

