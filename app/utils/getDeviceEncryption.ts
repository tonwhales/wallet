import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';

// export type DeviceEncryption = 'none' | 'passcode' | 'fingerprint' | 'face';

export type DeviceEncryption = {
    level: LocalAuthentication.SecurityLevel,
    types: LocalAuthentication.AuthenticationType[]
} | 'none';


export async function getDeviceEncryption(): Promise<DeviceEncryption> {

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
    } else {
        return { level, types };
    }
}