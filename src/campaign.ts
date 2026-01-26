import { PaylisherConfig } from './config';
import { generateFingerprint } from './fingerprint';
import { post } from './utils/http';
import { getUtmParams } from './utils/url';

export class Campaign {
    private config: PaylisherConfig;

    constructor(config: PaylisherConfig) {
        this.config = config;
    }

    public async recordClick(deeplinkUrl: string, campaignKey?: string, metadata?: any): Promise<void> {
        try {
            const fingerprint = await generateFingerprint();
            const utm = getUtmParams();

            // If campaignKey is missing, try to find it in UTM params
            const effectiveCampaignKey = campaignKey || utm['utm_campaign'] || 'organic';

            const payload = {
                fingerprint,
                deeplink_url: deeplinkUrl,
                campaign_key: effectiveCampaignKey,
                click_timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent,
                // IP address will be detected by server, but fingerprint hash relies on what we fetched
                utm: utm,
                metadata: metadata || {},
            };

            if (this.config.debug) {
                console.log('Paylisher: Recording click', payload);
            }

            const url = `${this.config.campaignHost}/deferred-deeplink/click`;
            await post(url, payload);

        } catch (error) {
            console.error('Paylisher: Failed to record click', error);
        }
    }
}
