import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import * as KeyStore from './modules/KeyStore';

export type DeviceEncryption =
    | 'none'
    | 'passcode'
    | 'fingerprint'
    | 'face'
    | 'device-biometrics'
    | 'device-passcode'
    | 'secret'
    | 'biometric';

export async function getDeviceEncryption(): Promise<DeviceEncryption> {

    // Android case
    if (Platform.OS === 'android') {

        //
        // Strong protection
        // NOTE: We are checking here enrolled level via our custom code
        //       to support both secure-store and our key-store.
        //       secure-store library itself does not provide right
        //       way to detect strong encryption parameters only soft
        //       one and info is not related to encryption on Android.
        //

        let securityLevel = await KeyStore.getEnrolledLevelAsync();
        if (securityLevel === KeyStore.SecurityLevel.BIOMETRIC) {
            return 'biometric';
        } else {
            return 'none'; // using only strong biometric encryption so no need to check other options
        }
    }

    // Fetch enrolled security
    const level = await LocalAuthentication.getEnrolledLevelAsync();

    // Fetch authentication types
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    // No encryption on emulator and simulator
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