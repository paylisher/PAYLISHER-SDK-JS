import { PaylisherSDK } from './index';
import { ReactNativePlatformAdapter } from './platform/react-native';

const adapter = new ReactNativePlatformAdapter();
const paylisher = new PaylisherSDK(adapter);

export default paylisher;
export { PaylisherSDK, ReactNativePlatformAdapter };
