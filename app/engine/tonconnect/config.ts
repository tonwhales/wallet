import { DeviceInfo } from '@tonconnect/protocol';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { WalletVersions } from '../types';

export const CURRENT_PROTOCOL_VERSION = 2;

export const MIN_PROTOCOL_VERSION = 2;

export const bridgeUrl = 'https://connect.tonhubapi.com/tonconnect';

export const getPlatform = (): DeviceInfo['platform'] => {
  if (Platform.OS === 'ios') {
    return 'iphone';
  }

  return Platform.OS as DeviceInfo['platform'];
};

export function tonConnectDeviceInfo(walletVersion: WalletVersions): DeviceInfo {
  const maxMessages = walletVersion === WalletVersions.v5R1 ? 255 : 4;
  return {
    platform: getPlatform(),
    appName: Application.applicationName ?? 'Tonhub',
    appVersion: Application.nativeApplicationVersion ?? '1.23.3',
    maxProtocolVersion: CURRENT_PROTOCOL_VERSION,
    features: ['SendTransaction', { name: 'SendTransaction', maxMessages, extraCurrencySupported: true }]
  }
}
