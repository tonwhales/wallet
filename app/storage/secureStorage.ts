import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getSecureRandomBytes, openBox, pbkdf2_sha512, sealBox } from 'ton-crypto';
import { storage } from "./storage";
import * as LocalAuthentication from 'expo-local-authentication';
import * as KeyStore from './modules/KeyStore';

export const passcodeStateKey = 'passcode-state';
export const passcodeSaltKey = 'passcode-salt';
export const passcodeEncKey = 'ton-passcode-enc-key';
export enum PasscodeState {
    NotSet = 'not-set',
    Set = 'set',
}

export function loadKeyStorageType(): 'secure-store' | 'local-authentication' | 'key-store' {
    let kind = storage.getString('ton-storage-kind');

    // Legacy
    if (!kind) {
        if (storage.getBoolean('ton-bypass-encryption')) {
            return 'local-authentication';
        } else {
            return 'secure-store';
        }
    }

    if (kind === 'local-authentication') {
        return 'local-authentication';
    }
    if (kind === 'secure-store') {
        return 'secure-store';
    }
    if (kind === 'key-store') {
        return 'key-store';
    }
    throw Error('Storage type invalid');
}

export function loadKeyStorageRef() {
    let ref = storage.getString('ton-storage-ref');
    if (ref) {
        return ref;
    } else {
        return 'ton-application-key-v5'; // Legacy
    }
}

export async function getApplicationKey() {

    const storageType = loadKeyStorageType();
    const ref = loadKeyStorageRef();

    // Local authentication
    if (storageType === 'local-authentication') {

        // Request local authentication
        let supportedAuthTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (supportedAuthTypes.length > 0) {
            let authRes = await LocalAuthentication.authenticateAsync();
            if (!authRes.success) {
                // Ignore device not being secured with a PIN, pattern or password.
                if (authRes.error !== 'not_enrolled') {
                    throw Error('Authentication canceled');
                }
            }
        }

        // Read from keystore
        let key = (!!storage.getString('ton-storage-kind')) ? 'ton-storage-key-' + ref : ref; // Legacy hack
        const ex = storage.getString(key);
        if (!ex) {
            throw Error('Broken keystore');
        }
        return Buffer.from(ex, 'base64');
    }

    // Secure Store
    if (storageType === 'secure-store') {
        let ex = await SecureStore.getItemAsync(ref);
        if (!ex) {
            throw Error('Broken keystore');
        }
        return Buffer.from(ex, 'base64');
    }

    // Keystore
    if (storageType === 'key-store') {
        let ex = await KeyStore.getItemAsync(ref);
        if (!ex) {
            throw Error('Broken keystore');
        }
        return Buffer.from(ex, 'base64');
    }

    throw Error('Broken keystore');
}

async function doEncrypt(key: Buffer, data: Buffer) {
    const nonce = await getSecureRandomBytes(24);
    const sealed = sealBox(data, nonce, key);
    return Buffer.concat([nonce, sealed]);
}

export async function generateNewKeyAndEncrypt(disableEncryption: boolean, data: Buffer) {

    // Generate new ref
    let ref = (await getSecureRandomBytes(32)).toString('hex');

    // Generate new key
    let privateKey = await getSecureRandomBytes(32);

    // Handle no-encryption
    if (disableEncryption) {
        storage.set('ton-storage-kind', 'local-authentication');
        storage.set('ton-storage-ref', ref);
        storage.set('ton-storage-key-' + ref, privateKey.toString('base64'));
        return doEncrypt(privateKey, data);
    }

    // Handle iOS
    if (Platform.OS === 'ios') {
        storage.set('ton-storage-kind', 'secure-store');
        storage.set('ton-storage-ref', ref);
        try {
            await SecureStore.deleteItemAsync(ref);
        } catch (e) {
            // Ignore
        }
        await SecureStore.setItemAsync(ref, privateKey.toString('base64'), {
            requireAuthentication: true,
            keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY
        });
    } else if (Platform.OS === 'android') {
        storage.set('ton-storage-ref', ref);
        storage.set('ton-storage-kind', 'key-store');
        await KeyStore.setItemAsync(ref, privateKey.toString('base64'));
    } else {
        throw Error('Unsupporteed platform')
    }

    return doEncrypt(privateKey, data);
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

export async function generateKeyFromPasscode(pass: string, nacl?: string) {
    if (typeof pass !== 'string') {
        throw Error('Invalid password');
    }

    const salt = nacl ?? (await getSecureRandomBytes(32)).toString('hex');
    const iterations = 100000;
    const keyLength = 32; // 256 bits

    const derivedKey = await pbkdf2_sha512(
        pass,
        salt,
        iterations,
        keyLength
    );

    return { key: derivedKey, salt };
}

export async function doDecryptWithPasscode(pass: string, salt: string, data: Buffer) {
    const passKey = await generateKeyFromPasscode(pass, salt);
    let nonce = data.slice(0, 24);
    let cypherData = data.slice(24);
    let res = openBox(cypherData, nonce, passKey.key);
    if (!res) {
        throw Error('Unable to decrypt data');
    }
    return res;
}

export async function encryptAndStoreWithPasscode(address: string, pass: string, data: Buffer) {
    const passKey = await generateKeyFromPasscode(pass);
    storage.set(`${address}/${passcodeSaltKey}`, passKey.salt);
    const nonce = await getSecureRandomBytes(24);
    const sealed = sealBox(data, nonce, passKey.key);
    const encrypted = Buffer.concat([nonce, sealed]);
    storage.set(`${address}/${passcodeEncKey}`, encrypted.toString('base64'));
    storage.set(`${address}/${passcodeStateKey}`, PasscodeState.Set);
}