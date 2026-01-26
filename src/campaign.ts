import { PaylisherConfig } from './config';
import { generateFingerprint } from './fingerprint';
import { post, getPublicIp } from './utils/http';
import { getUtmParams } from './utils/url';
import { PlatformAdapter } from './platform/interface';

export class Campaign {
    private config: PaylisherConfig;
    private adapter: PlatformAdapter;

    constructor(config: PaylisherConfig, adapter: PlatformAdapter) {
        this.config = config;
        this.adapter = adapter;
    }

    public async recordClick(deeplinkUrl: string, campaignKey?: string, metadata?: any): Promise<void> {
        try {
            const ip = await getPublicIp();
            const deviceInfo = await this.adapter.getDeviceInfo();
            const fingerprint = await generateFingerprint(deviceInfo.userAgent, ip);
            const utm = getUtmParams(); // Safe (guarded)

            // If campaignKey is missing, try to find it in UTM params
            const effectiveCampaignKey = campaignKey || (utm ? utm['utm_campaign'] : undefined) || 'organic';

            const payload = {
                fingerprint,
                deeplink_url: deeplinkUrl,
                campaign_key: effectiveCampaignKey,
                click_timestamp: new Date().toISOString(),
                user_agent: deviceInfo.userAgent,
                ip_address: ip,
                platform: deviceInfo.platform,
                metadata: {
                    ...(utm || {}),
                    ...(metadata || {})
                },
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
