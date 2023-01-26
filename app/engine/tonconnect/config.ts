import { DeviceInfo } from '@tonconnect/protocol';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

export const CURRENT_PROTOCOL_VERSION = 2;

export const MIN_PROTOCOL_VERSION = 2;

const getPlatform = (): DeviceInfo['platform'] => {
  if (Platform.OS === 'ios') {
    return 'iphone';
  }

  return Platform.OS as DeviceInfo['platform'];
};

export const tonConnectDeviceInfo: DeviceInfo = {
  platform: getPlatform(),
  appName: Application.applicationName ?? 'Tonhub',
  appVersion: Application.nativeApplicationVersion ?? '1.23.2',
  maxProtocolVersion: CURRENT_PROTOCOL_VERSION,
  features: ['SendTransaction'],
};
