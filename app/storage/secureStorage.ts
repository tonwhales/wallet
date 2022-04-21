import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getSecureRandomBytes, openBox, sealBox } from 'ton-crypto';
import { storage } from "./storage";
import * as Keychain from 'react-native-keychain';

export const TOKEN_KEY = 'ton-application-key-v5';

const androidKeichainOptions = {
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
    authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
    storage: Keychain.STORAGE_TYPE.RSA
}

async function getAndroidAppKey(passcode?: string) {
    if (!passcode) {
        // Working with fingerprint
        let ex = await Keychain.getGenericPassword(androidKeichainOptions);
        console.log('[getAndroidAppKey] fingerprint', { ex });
        if (ex === false || !ex.password) {
            let privateKey = await getSecureRandomBytes(32);
            await Keychain.setGenericPassword(
                TOKEN_KEY,
                privateKey.toString('base64'),
                androidKeichainOptions
            );
        } else {
            return Buffer.from(ex.password, 'base64');
        }
    } else {
        // Encrypting / Decrypting with provided passcode
        console.log('[getAndroidAppKey]', { passcode });
        let ex = storage.getString(TOKEN_KEY);
        console.log('[getAndroidAppKey] passcode', { ex });
        if (!ex) {
            let privateKey = await getSecureRandomBytes(32);
            let encryptedKey = await encryptKeyWithPasscode(privateKey, passcode);
            storage.set(TOKEN_KEY, encryptedKey.toString('base64'));;
        } else {
            let decrypted = await decryptKeyWithPasscode(Buffer.from(ex, 'base64'), passcode);
            if (decrypted) {
                return decrypted;
            }
        }
    }
}

async function getApplicationKey(passcode?: string) {
    console.log('[getApplicationKey]', { passcode });
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
                let androidKey = await getAndroidAppKey(passcode);
                if (androidKey) return androidKey;
                continue;
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

export async function encryptData(data: Buffer, passcode?: string) {
    const key = await getApplicationKey(passcode);
    const nonce = await getSecureRandomBytes(24);
    const sealed = sealBox(data, nonce, key);
    return Buffer.concat([nonce, sealed]);
}

export async function decryptData(data: Buffer, passcode?: string) {
    const key = await getApplicationKey(passcode);
    let nonce = data.slice(0, 24);
    let cypherData = data.slice(24);
    let res = openBox(cypherData, nonce, key);
    if (!res) {
        throw Error('Unable to decrypt data');
    }
    return res;
}

export async function encryptKeyWithPasscode(data: Buffer, passcode: string) {
    const nonce = await getSecureRandomBytes(24);
    let passcodeBuff = Buffer.alloc(32);
    passcodeBuff.write(passcode, 'base64');
    const sealed = sealBox(data, nonce, passcodeBuff);
    return Buffer.concat([nonce, sealed]);
}

export async function decryptKeyWithPasscode(data: Buffer, passcode: string) {
    let nonce = data.slice(0, 24);
    let cypherData = data.slice(24);
    let passcodeBuff = Buffer.alloc(32);
    passcodeBuff.write(passcode, 'base64');
    let res = openBox(cypherData, nonce, passcodeBuff);
    if (!res) {
        throw Error('Unable to decrypt data');;
    }
    return res;
}

export const PasscodeLength = 6;