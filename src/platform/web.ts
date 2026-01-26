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

    public getDeviceInfo(): DeviceInfo {
        const ua = navigator.userAgent;
        const lowerUa = ua.toLowerCase();
        let platform: 'web' | 'android' | 'ios' = 'web';

        if (lowerUa.includes('android')) {
            platform = 'android';
        } else if (lowerUa.includes('iphone') || lowerUa.includes('ipad') || lowerUa.includes('ipod')) {
            platform = 'ios';
        }

        return {
            userAgent: ua,
            screenWidth: window.screen?.width || 0,
            screenHeight: window.screen?.height || 0,
            platform: platform,
            language: navigator.language
        };
    }
}
