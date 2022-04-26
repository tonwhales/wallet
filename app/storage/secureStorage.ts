import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getSecureRandomBytes, openBox, sealBox } from 'ton-crypto';
import { storage } from "./storage";
import * as Keychain from 'react-native-keychain';
import * as CryptoJS from 'crypto-js';
import Pbkdf2 from "react-native-fast-pbkdf2";

export const TOKEN_KEY = 'ton-application-key-v5';
const USE_PASSCODE = 'ton-passcode-necryption';
const USE_KEYCHAIN = 'ton-use-keychain';

export function usePasscode() {
    return storage.getBoolean(USE_PASSCODE);
}

export function useKeychain() {
    return storage.getBoolean(USE_KEYCHAIN);
}

export function clearStorage() {
    storage.clearAll();
    const hasKeychain = useKeychain();
    if (hasKeychain) {
        Keychain.resetGenericPassword(androidKeichainOptions);
    }
}

const androidKeichainOptions = {
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
    authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
    storage: Keychain.STORAGE_TYPE.RSA
}

// Passcode storage
async function getPasscodeKey(passcode: string) {
    while (true) {
        let ex = storage.getString(TOKEN_KEY);
        if (!ex) {
            let privateKey = await getSecureRandomBytes(32);
            let encryptedKey = await encryptKeyWithPasscode(privateKey.toString('base64'), passcode);
            storage.set(TOKEN_KEY, encryptedKey);
            storage.set(USE_PASSCODE, true);
        } else {
            let decrypted = await decryptKeyWithPasscode(ex, passcode);
            return Buffer.from(decrypted, 'base64');
        }
    }
}

// Keychain storage
async function getKeychainKey() {
    let ex = await Keychain.getGenericPassword(androidKeichainOptions);
    if (ex === false || !ex.password) {
        let privateKey = await getSecureRandomBytes(32);
        await Keychain.setGenericPassword(
            TOKEN_KEY,
            privateKey.toString('base64'),
            androidKeichainOptions
        );
        storage.set(USE_KEYCHAIN, true);
    } else {
        return Buffer.from(ex.password, 'base64');
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
            const hasKeychain = useKeychain();
            if (Platform.OS === 'android' && hasKeychain) {
                let androidKey = await getKeychainKey();
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

export async function encryptDataWithPasscode(data: Buffer, passcode: string) {
    const key = await getPasscodeKey(passcode);
    const nonce = await getSecureRandomBytes(24);
    const sealed = sealBox(data, nonce, key);
    return Buffer.concat([nonce, sealed]);
}

export async function decryptDataWithPasscode(data: Buffer, passcode: string) {
    const key = await getPasscodeKey(passcode);
    let nonce = data.slice(0, 24);
    let cypherData = data.slice(24);
    let res = openBox(cypherData, nonce, key);
    if (!res) {
        throw Error('Unable to decrypt data');
    }
    return res;
}


const passcodeEncryptionConfig = {
    keySize: 128,
    iterations: 10000
}

export async function encryptKeyWithPasscode(data: string, passcode: string) {
    const salt = CryptoJS.lib.WordArray.random(32);
    const key = await Pbkdf2.derive(
        passcode,
        salt.toString(),
        passcodeEncryptionConfig.iterations,
        passcodeEncryptionConfig.keySize,
        'sha-1'
    );
    const iv = CryptoJS.lib.WordArray.random(32);

    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
    });

    const encryptedKey = salt.toString() + iv.toString() + encrypted.toString();
    if (encryptedKey.length > 0) {
        return encryptedKey;
    } else {
        throw Error('Failed to encrypt key');
    }
}

export async function decryptKeyWithPasscode(data: string, passcode: string) {
    const salt = CryptoJS.enc.Hex.parse(data.substring(0, 64));
    const iv = CryptoJS.enc.Hex.parse(data.substring(64, 128));
    const encrypted = data.substring(128);
    const key = await Pbkdf2.derive(
        passcode,
        salt.toString(),
        passcodeEncryptionConfig.iterations,
        passcodeEncryptionConfig.keySize,
        'sha-1'
    );

    const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
    });

    const decryptedKey = decrypted.toString(CryptoJS.enc.Utf8).replace(/\"/g, '');

    if (decryptedKey.length > 0) {
        return decryptedKey;
    } else {
        throw Error('Failed to decrypt key');
    }
}

export const PasscodeLength = 6;