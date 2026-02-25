export interface PaylisherDeepLinkConfigOptions {
    captureDeepLinkEvents: boolean;
    autoHandleDeepLinks: boolean;
    authRequiredDestinations: string[];
    customSchemes: string[];
    universalLinkDomains: string[];
    debugLogging: boolean;
    pendingDeepLinkTimeoutSeconds: number;
    additionalEventProperties: Record<string, any>;
}

export class PaylisherDeepLinkConfig implements PaylisherDeepLinkConfigOptions {
    public captureDeepLinkEvents = true;
    public autoHandleDeepLinks = true;
    public authRequiredDestinations: string[] = [];
    public customSchemes: string[] = [];
    public universalLinkDomains: string[] = [];
    public debugLogging = false;
    public pendingDeepLinkTimeoutSeconds = 300;
    public additionalEventProperties: Record<string, any> = {};

    constructor(options: Partial<PaylisherDeepLinkConfigOptions> = {}) {
        Object.assign(this, options);
    }
}

