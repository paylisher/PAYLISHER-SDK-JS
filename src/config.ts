export interface PaylisherConfig {
    apiKey: string;
    dataStudioHost?: string; // e.g. https://ds.i.paylisher.com
    campaignHost?: string;   // e.g. https://api.usepublisher.com
    debug?: boolean;
}

export const DEFAULT_CONFIG: Partial<PaylisherConfig> = {
    dataStudioHost: process.env.DATA_STUDIO_HOST,
    campaignHost: process.env.CAMPAIGN_HOST,
    debug: false,
};
