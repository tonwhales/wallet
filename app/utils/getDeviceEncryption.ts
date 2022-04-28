import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';

export type DeviceEncryption = 'none' | 'passcode' | 'fingerprint' | 'face';

export async function getDeviceEncryption(): Promise<DeviceEncryption> {

    if (Platform.OS === 'android') {
        const supported = await Keychain.getSupportedBiometryType();
        if (supported === Keychain.BIOMETRY_TYPE.FINGERPRINT) {
            return 'fingerprint';
        } else {
            return 'passcode';
        }
    }

    // Fetch enrolled security
    const level = await LocalAuthentication.getEnrolledLevelAsync();

    // Fetch authentication types
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    // No encryption on device and simulator
    if (!Device.isDevice) {
        return 'none';
    }

    // Resolve encryption
    if (level === LocalAuthentication.SecurityLevel.NONE) {
        return 'none';
    } else if (level === LocalAuthentication.SecurityLevel.SECRET) {
        return 'passcode';
    } else {
        if (types.find((v) => v === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            return 'face';
        }
        if (types.find((v) => v === LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            return 'fingerprint';
        }
        throw Error('Unknown encryption type');
    }
}