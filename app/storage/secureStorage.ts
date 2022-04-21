import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getSecureRandomBytes, openBox, sealBox } from 'ton-crypto';
import { passcodeStorage, storage } from "./storage";
import * as Keychain from 'react-native-keychain';
import { getDeviceEncryption } from '../utils/getDeviceEncryption';

export const TOKEN_KEY = 'ton-application-key-v5';

async function getAndroidAppKey() {
    const encyption = await getDeviceEncryption();
    if (encyption === 'fingerprint') {
        let ex = await Keychain.getGenericPassword({
            accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
            authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
            storage: Keychain.STORAGE_TYPE.RSA
        });
        console.log('[getAndroidAppKey] fingerprint', { ex });
        if (ex === false || !ex.password) {
            let privateKey = await getSecureRandomBytes(32);
            try {
                const res = await Keychain.setGenericPassword(
                    TOKEN_KEY,
                    privateKey.toString('base64'),
                    {
                        authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
                        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
                        storage: Keychain.STORAGE_TYPE.RSA
                    }
                );
                if (res) return Buffer.from(privateKey.toString('base64'), 'base64');
            } catch (error) {
                console.log('[getAndroidAppKey] fingerprint', { error })
            }
        } else {
            return Buffer.from(ex.password, 'base64');
        }
    } else if (encyption === 'passcode') {
        const storage = passcodeStorage('0000');
        let ex = storage.getString(TOKEN_KEY);
        console.log('[getAndroidAppKey] passcode', { ex });
        if (!ex) {
            let privateKey = await getSecureRandomBytes(32);
            storage.set(TOKEN_KEY, privateKey.toString('base64'));;
        } else {
            return Buffer.from(ex, 'base64');
        }
    }
}

async function getApplicationKey() {
    while (true) {
        if (storage.getBoolean('ton-bypass-encryption')) {
            const ex = storage.getString(TOKEN_KEY);
            if (!ex) {
                let privateKey = await getSecureRandomBytes(32);
                storage.set(TOKEN_KEY, privateKey.toString('base64'));
            } else {
                return Buffer.from(ex, 'base64');
            }
        } else {
            if (Platform.OS === 'android') {
                return await getAndroidAppKey();
            }
            let ex = await SecureStore.getItemAsync(TOKEN_KEY);
            if (!ex) {
                let privateKey = await getSecureRandomBytes(32);
                await SecureStore.setItemAsync(TOKEN_KEY, privateKey.toString('base64'), {
                    requireAuthentication: true,
                    keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY
                });
            } else {
                return Buffer.from(ex, 'base64');
            }
        }
    }
}

export async function ensureKeystoreReady() {
    if (Platform.OS === 'android') {
        try {
            await SecureStore.getItemAsync(TOKEN_KEY);
        } catch (e) {
            console.warn('Resetting keystore');
            await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
    }
}

export async function encryptData(data: Buffer) {
    const key = await getApplicationKey();
    const nonce = await getSecureRandomBytes(24);
    const sealed = sealBox(data, nonce, key);
    return Buffer.concat([nonce, sealed]);
}

export async function decryptData(data: Buffer) {
    const key = await getApplicationKey();
    let nonce = data.slice(0, 24);
    let cypherData = data.slice(24);
    let res = openBox(cypherData, nonce, key);
    if (!res) {
        throw Error('Unable to decrypt data');
    }
    return res;
}