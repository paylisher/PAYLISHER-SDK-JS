export interface DeviceInfo {
    userAgent: string;
    screenWidth?: number;
    screenHeight?: number;
    platform: 'web' | 'android' | 'ios';
    language?: string;
}

export interface PlatformAdapter {
    // Key-Value Storage (Sync/Async handled by implementation, but interface returns Promise for RN compatibility)
    getItem(key: string): Promise<string | null> | string | null;
    setItem(key: string, value: string): Promise<void> | void;

    // Device Information
    getDeviceInfo(): Promise<DeviceInfo> | DeviceInfo;

    // Network (optional, if we want to abstract fetch later, but for now we assume global fetch or polyfill)
}
