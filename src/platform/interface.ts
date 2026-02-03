export interface DeviceInfo {
    userAgent: string;
    screenWidth?: number;
    screenHeight?: number;
    platform: 'web' | 'android' | 'ios';
    language?: string;

    // Extended properties (matching iOS/Android SDK)
    deviceType?: string; // "Desktop", "Mobile", "Tablet"
    deviceManufacturer?: string; // "Apple", "Google", "Microsoft", etc.
    deviceModel?: string; // Browser name and version
    deviceName?: string; // Browser name
    osName?: string; // "Windows", "macOS", "Linux", "iOS", "Android"
    osVersion?: string; // OS version
    browser?: string; // Browser name
    browserVersion?: string; // Browser version
    locale?: string; // Language code
    timezone?: string; // Timezone (e.g., "Europe/Istanbul")
}

export interface PlatformAdapter {
    // Key-Value Storage (Sync/Async handled by implementation, but interface returns Promise for RN compatibility)
    getItem(key: string): Promise<string | null> | string | null;
    setItem(key: string, value: string): Promise<void> | void;

    // Device Information
    getDeviceInfo(): Promise<DeviceInfo> | DeviceInfo;

    // Network (optional, if we want to abstract fetch later, but for now we assume global fetch or polyfill)
}
