import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getSecureRandomBytes, openBox, sealBox } from 'ton-crypto';
import { storage } from "./storage";
import * as Keychain from 'react-native-keychain';

const TOKEN_KEY = 'ton-application-key-v5';
const USE_KEYCHAIN = 'ton-use-keychain';

export function useKeychain() {
    return storage.getBoolean(USE_KEYCHAIN);
}

export async function clearStorage() {
    const hasKeychain = useKeychain();
    if (hasKeychain) {
        await Keychain.resetGenericPassword(androidKeichainOptions);
    }
    storage.clearAll();
}

const androidKeichainOptions = {
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
    authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
    storage: Keychain.STORAGE_TYPE.RSA
}

async function getKeychainKey() {
    const res = await Keychain.getGenericPassword(androidKeichainOptions);
    if (res) {
        return res.password;
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
            let ex = useKeychain() ? await getKeychainKey() : await SecureStore.getItemAsync(TOKEN_KEY);
            if (!ex) {
                let privateKey = await getSecureRandomBytes(32);
                if (Platform.OS === 'android') {
                    await Keychain.setGenericPassword(
                        TOKEN_KEY,
                        privateKey.toString('base64'),
                        androidKeichainOptions
                    );
                    storage.set(USE_KEYCHAIN, true);
                    continue;
                }
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