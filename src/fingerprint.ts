import { getPublicIp } from './utils/http';
import { sha256 } from './utils/sha256';

// Replicates backend logic from campaign module
export const extractOS = (userAgent: string): string => {
    if (!userAgent) return 'unknown';
    const ua = userAgent.toLowerCase();

    // iOS
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
        const match = ua.match(/os (\d+[_\d]*)/);
        if (match) {
            return `iOS ${match[1].replace(/_/g, '.')}`;
        }
        return 'iOS unknown';
    }

    // Huawei HarmonyOS
    if (ua.includes('huawei') || ua.includes('harmonyos')) {
        const match = ua.match(/android (\d+[\.\d]*)/);
        if (match) return `HarmonyOS ${match[1]}`;
        return 'HarmonyOS unknown';
    }

    // Android
    if (ua.includes('android')) {
        const match = ua.match(/android (\d+[\.\d]*)/);
        if (match) return `Android ${match[1]}`;
        return 'Android unknown';
    }

    // macOS
    if (ua.includes('macintosh') || ua.includes('mac os x')) {
        const match = ua.match(/mac os x (\d+[_\d]*)/);
        if (match) return `macOS ${match[1].replace(/_/g, '.')}`;
        return 'macOS unknown';
    }

    // Windows
    if (ua.includes('windows')) {
        if (ua.includes('windows nt 10')) return 'Windows 10/11';
        if (ua.includes('windows nt 6.3')) return 'Windows 8.1';
        if (ua.includes('windows nt 6.2')) return 'Windows 8';
        if (ua.includes('windows nt 6.1')) return 'Windows 7';
        if (ua.includes('windows nt 6.0')) return 'Windows Vista';
        return 'Windows unknown';
    }

    return 'unknown';
};

export const getTimeWindow = (timestamp: number, windowMs = 30 * 60 * 1000): number => {
    return Math.floor(timestamp / windowMs) * windowMs;
};

export const generateFingerprint = async (userAgent: string, ip?: string): Promise<string> => {
    if (!ip) {
        ip = await getPublicIp(); // Fetch public IP if not provided
    }
    const os = extractOS(userAgent);
    const timeWindow = getTimeWindow(Date.now());

    const data = `${ip}|${os}|${timeWindow}`;
    return sha256(data);
};
