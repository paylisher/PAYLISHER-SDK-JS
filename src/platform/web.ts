import { PlatformAdapter, DeviceInfo } from './interface';

export class WebPlatformAdapter implements PlatformAdapter {

    public getItem(key: string): string | null {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('Paylisher: localStorage not available', e);
            return null;
        }
    }

    public setItem(key: string, value: string): void {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('Paylisher: localStorage not available', e);
        }
    }

    private parseBrowser(ua: string): { browser: string; browserVersion: string } {
        let browser = 'Unknown';
        let browserVersion = '';

        // Chrome (check before Safari since Chrome includes Safari in UA)
        if (ua.includes('Chrome/') && !ua.includes('Edg')) {
            browser = 'Chrome';
            const match = ua.match(/Chrome\/([\d.]+)/);
            browserVersion = match ? match[1] : '';
        }
        // Edge
        else if (ua.includes('Edg/')) {
            browser = 'Edge';
            const match = ua.match(/Edg\/([\d.]+)/);
            browserVersion = match ? match[1] : '';
        }
        // Safari
        else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
            browser = 'Safari';
            const match = ua.match(/Version\/([\d.]+)/);
            browserVersion = match ? match[1] : '';
        }
        // Firefox
        else if (ua.includes('Firefox/')) {
            browser = 'Firefox';
            const match = ua.match(/Firefox\/([\d.]+)/);
            browserVersion = match ? match[1] : '';
        }
        // Opera
        else if (ua.includes('OPR/')) {
            browser = 'Opera';
            const match = ua.match(/OPR\/([\d.]+)/);
            browserVersion = match ? match[1] : '';
        }

        return { browser, browserVersion };
    }

    private parseOS(ua: string): { osName: string; osVersion: string; deviceManufacturer: string } {
        let osName = 'Unknown';
        let osVersion = '';
        let deviceManufacturer = 'Unknown';

        // Windows
        if (ua.includes('Windows NT')) {
            osName = 'Windows';
            deviceManufacturer = 'Microsoft';
            const match = ua.match(/Windows NT ([\d.]+)/);
            if (match) {
                const version = match[1];
                // Map Windows NT versions to friendly names
                const versionMap: { [key: string]: string } = {
                    '10.0': '10/11',
                    '6.3': '8.1',
                    '6.2': '8',
                    '6.1': '7',
                };
                osVersion = versionMap[version] || version;
            }
        }
        // macOS
        else if (ua.includes('Mac OS X')) {
            osName = 'macOS';
            deviceManufacturer = 'Apple';
            const match = ua.match(/Mac OS X ([\d_]+)/);
            osVersion = match ? match[1].replace(/_/g, '.') : '';
        }
        // iOS
        else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) {
            osName = ua.includes('iPad') ? 'iPadOS' : 'iOS';
            deviceManufacturer = 'Apple';
            const match = ua.match(/OS ([\d_]+)/);
            osVersion = match ? match[1].replace(/_/g, '.') : '';
        }
        // Android
        else if (ua.includes('Android')) {
            osName = 'Android';
            deviceManufacturer = 'Google';
            const match = ua.match(/Android ([\d.]+)/);
            osVersion = match ? match[1] : '';
        }
        // Linux
        else if (ua.includes('Linux')) {
            osName = 'Linux';
            deviceManufacturer = 'Linux';
        }

        return { osName, osVersion, deviceManufacturer };
    }

    private getDeviceType(ua: string): string {
        // Check for mobile/tablet patterns
        if (ua.includes('Mobile') || ua.includes('iPhone') || ua.includes('Android')) {
            return 'Mobile';
        }
        if (ua.includes('iPad') || ua.includes('Tablet')) {
            return 'Tablet';
        }
        return 'Desktop';
    }

    public getDeviceInfo(): DeviceInfo {
        const ua = navigator.userAgent;
        const lowerUa = ua.toLowerCase();
        let platform: 'web' | 'android' | 'ios' = 'web';

        if (lowerUa.includes('android')) {
            platform = 'android';
        } else if (lowerUa.includes('iphone') || lowerUa.includes('ipad') || lowerUa.includes('ipod')) {
            platform = 'ios';
        }

        const { browser, browserVersion } = this.parseBrowser(ua);
        const { osName, osVersion, deviceManufacturer } = this.parseOS(ua);
        const deviceType = this.getDeviceType(ua);

        // Get timezone
        let timezone = 'Unknown';
        try {
            timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (e) {
            // Fallback if timezone detection fails
        }

        return {
            userAgent: ua,
            screenWidth: window.screen?.width || 0,
            screenHeight: window.screen?.height || 0,
            platform: platform,
            language: navigator.language,

            // Extended properties
            deviceType: deviceType,
            deviceManufacturer: deviceManufacturer,
            deviceModel: `${browser} ${browserVersion}`,
            deviceName: browser,
            osName: osName,
            osVersion: osVersion,
            browser: browser,
            browserVersion: browserVersion,
            locale: navigator.language,
            timezone: timezone,
        };
    }
}
