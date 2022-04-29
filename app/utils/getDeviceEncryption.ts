import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type DeviceEncryption = 'none' | 'passcode' | 'fingerprint' | 'face';

export async function getDeviceEncryption(): Promise<DeviceEncryption> {

    // Fetch enrolled security
    const level = await LocalAuthentication.getEnrolledLevelAsync();

    // Fetch authentication types
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    const androidLevel = await SecureStore.getEnrolledLevelAsync();
    console.log({ androidLevel });

    // No encryption on device and simulator
    if (!Device.isDevice) {
        return 'none';
    }

    //Resolve SecureStore supported encryption for Android
    if (Platform.OS === 'android') {
        if (androidLevel === LocalAuthentication.SecurityLevel.NONE) {
            return 'none';
        } else if (androidLevel === LocalAuthentication.SecurityLevel.SECRET) {
            return 'passcode';
        } else if (androidLevel === LocalAuthentication.SecurityLevel.BIOMETRIC) {
            return 'fingerprint';
        } else {
            throw Error('Unknown encryption type');
        }
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