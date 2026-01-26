export interface PaylisherConfig {
    apiKey: string;
    dataStudioHost?: string; // e.g. https://ds.i.paylisher.com
    campaignHost?: string;   // e.g. https://api.usepublisher.com
    debug?: boolean;
}

export const DEFAULT_CONFIG: Partial<PaylisherConfig> = {
    dataStudioHost: 'https://ds.i.paylisher.com',
    campaignHost: 'https://link.usepublisher.com',
    debug: false,
};
