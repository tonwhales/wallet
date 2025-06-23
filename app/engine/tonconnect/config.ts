import { DeviceInfo, SendTransactionFeature, SignDataFeature } from '@tonconnect/protocol';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { whalesConnectEndpoint } from '../clients';
import { WalletVersions } from '../types';
import { CURRENT_PROTOCOL_VERSION } from './constants';

export const bridgeUrl = `${whalesConnectEndpoint}/tonconnect`;

export const getPlatform = (): DeviceInfo['platform'] => {
  if (Platform.OS === 'ios') {
    return 'iphone';
  }

  return Platform.OS as DeviceInfo['platform'];
};

export type SignDataType = 'text' | 'binary' | 'cell';

export function tonConnectDeviceInfo(walletVersion: WalletVersions): DeviceInfo {
  const maxMessages = walletVersion === WalletVersions.v5R1 ? 255 : 4;

  const sendTransactionFeature: SendTransactionFeature = {
    name: 'SendTransaction',
    maxMessages,
    extraCurrencySupported: true
  }

  const signDataTypes: SignDataType[] = ['text', 'binary', 'cell'];

  const signDataFeature = {
    name: 'SignData',
    types: signDataTypes
  } as SignDataFeature;

  return {
    platform: getPlatform(),
    appName: Application.applicationName ?? 'Tonhub',
    appVersion: Application.nativeApplicationVersion ?? '1.23.3',
    maxProtocolVersion: CURRENT_PROTOCOL_VERSION,
    features: ['SendTransaction', sendTransactionFeature, signDataFeature]
  }
}
