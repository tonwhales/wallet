import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';

export type DeviceEncryption = 'none' | 'passcode' | 'fingerprint' | 'face' | 'device';

export async function getDeviceEncryption(): Promise<DeviceEncryption> {

    // Android case
    if (Platform.OS === 'android') {

        // Strong protection
        let biometryType = await Keychain.getSupportedBiometryType();
        if (biometryType === Keychain.BIOMETRY_TYPE.FACE || biometryType === Keychain.BIOMETRY_TYPE.FACE_ID) {
            return 'face';
        }
        if (biometryType === Keychain.BIOMETRY_TYPE.FINGERPRINT || biometryType === Keychain.BIOMETRY_TYPE.TOUCH_ID) {
            return 'fingerprint'
        }

        // Fallback to lockal authentication
        const level = await LocalAuthentication.getEnrolledLevelAsync();
        return level !== LocalAuthentication.SecurityLevel.NONE ? 'device' : 'none';
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
        if (types.find((v) => v === LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            return 'fingerprint';
        }
        if (types.find((v) => v === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            return 'face';
        }
        throw Error('Unknown encryption type');
    }
}