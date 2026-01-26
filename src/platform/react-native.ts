import { PlatformAdapter, DeviceInfo } from './interface';

// Peer dependencies - User must install these
// We use 'require' to avoid build-time errors if they are not present in Web build context 
// (though this file shouldn't be imported in web build)
let AsyncStorage: any;
let DeviceInfoModule: any;
let Dimensions: any;
let Platform: any;

try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const info = require('react-native-device-info');
    DeviceInfoModule = info.default || info;
    const rn = require('react-native');
    Dimensions = rn.Dimensions;
    Platform = rn.Platform;
} catch (e) {
    console.warn('Paylisher: React Native dependencies not found. Make sure to install @react-native-async-storage/async-storage and react-native-device-info.');
}

export class ReactNativePlatformAdapter implements PlatformAdapter {

    public async getItem(key: string): Promise<string | null> {
        if (!AsyncStorage) return null;
        try {
            return await AsyncStorage.getItem(key);
        } catch (e) {
            console.error('Paylisher: AsyncStorage error', e);
            return null;
        }
    }

    public async setItem(key: string, value: string): Promise<void> {
        if (!AsyncStorage) return;
        try {
            await AsyncStorage.setItem(key, value);
        } catch (e) {
            console.error('Paylisher: AsyncStorage error', e);
        }
    }

    public async getDeviceInfo(): Promise<DeviceInfo> {
        if (!DeviceInfoModule || !Dimensions || !Platform) {
            return {
                userAgent: 'Paylisher/RN (Unknown)',
                platform: 'android', // Fallback
            };
        }

        const width = Dimensions.get('window').width;
        const height = Dimensions.get('window').height;
        const userAgent = await DeviceInfoModule.getUserAgent();
        const os = Platform.OS === 'ios' ? 'ios' : 'android';

        return {
            userAgent: userAgent,
            screenWidth: width,
            screenHeight: height,
            platform: os,
            language: 'en' // Hard to get async in some versions, keeps simple
        };
    }
}
