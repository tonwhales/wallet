import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getSecureRandomBytes, openBox, sealBox } from 'ton-crypto';
import { storage } from "./storage";
import * as Keychain from 'react-native-keychain';
import * as CryptoJS from 'crypto-js';

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
        // Switch to passcode encryption
        let ex = storage.getString(TOKEN_KEY);
        if (!ex) {
            let privateKey = await getSecureRandomBytes(32);
            let encryptedKey = await encryptKeyWithPasscode(privateKey.toString('base64'), passcode);
            storage.set(TOKEN_KEY, encryptedKey);
        } else {
            let decrypted = await decryptKeyWithPasscode(ex, passcode);
            return Buffer.from(decrypted, 'base64');
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

export async function encryptKeyWithPasscode(data: string, passcode: string) {
    return await new Promise<string>((res, reg) => {
        try {
            const salt = CryptoJS.lib.WordArray.random(32);

            const key = CryptoJS.PBKDF2(passcode, salt, {
                keySize: 4,
                iterations: 100
            });

            const iv = CryptoJS.lib.WordArray.random(32);

            const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
                iv: iv,
                padding: CryptoJS.pad.Pkcs7,
                mode: CryptoJS.mode.CBC
            });

            const encryptedKey = salt.toString() + iv.toString() + encrypted.toString();
            if (encryptedKey.length > 0) {
                res(encryptedKey);
            }
        } catch (error) {
            reg(error);
        }
    });
}

export async function decryptKeyWithPasscode(data: string, passcode: string) {
    return await new Promise<string>((res, reg) => {
        try {
            const salt = CryptoJS.enc.Hex.parse(data.substring(0, 64));
            const iv = CryptoJS.enc.Hex.parse(data.substring(64, 128));
            const encrypted = data.substring(128);

            console.log('decrypt', { encrypted });

            const key = CryptoJS.PBKDF2(passcode, salt, {
                keySize: 4,
                iterations: 100
            });

            const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
                iv: iv,
                padding: CryptoJS.pad.Pkcs7,
                mode: CryptoJS.mode.CBC
            });
            console.log('decrypt', { data, decrypted: decrypted.toString(CryptoJS.enc.Utf8).replace(/\"/g, '') });
            const decryptedKey = decrypted.toString(CryptoJS.enc.Utf8).replace(/\"/g, '')
            if (decryptedKey.length > 0) {
                res(decryptedKey);
            }
        } catch (error) {
            reg(error);
        }
    });
}

export const PasscodeLength = 6;