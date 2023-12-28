import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getSecureRandomBytes, openBox, pbkdf2_sha512, sealBox } from '@ton/crypto';
import { storage } from "./storage";
import * as LocalAuthentication from 'expo-local-authentication';
import * as KeyStore from './modules/KeyStore';

export const passcodeStateKey = 'passcode-state';
export const passcodeSaltKey = 'ton-storage-passcode-nacl';
export const passcodeEncKey = 'ton-storage-passcode-enc-key-';
export const passcodeLengthKey = 'passcode-length';

export const biometricsEncKey = 'ton-biometrics-enc-key';
export const biometricsStateKey = 'biometrics-state';

export enum BiometricsState {
    NotSet = 'not-set',
    DontUse = 'dont-use',
    InUse = 'in-use',
}
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

export async function getApplicationKey(passcode?: string) {

    if (passcode) {
        const salt = storage.getString(passcodeSaltKey);
        const ref = storage.getString('ton-storage-ref')
        const passEncKey = storage.getString(passcodeEncKey + ref);

        if (!salt || !passEncKey) {
            throw Error(`${!salt ? 'Salt ' : ''}${!passEncKey ? 'EncPassKey ' : ''}not found`);
        }

        return doDecryptWithPasscode(passcode, salt, Buffer.from(passEncKey, 'base64'));
    }

    const storageType = loadKeyStorageType();
    const ref = loadKeyStorageRef();

    // Local authentication
    if (storageType === 'local-authentication') {
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

export async function migrateAndroidKeyStore(passcode?: string) {

    // Pre-flight checks
    if (Platform.OS !== 'android') {
        return;
    }

    const appKey = await getApplicationKey(passcode);
    const ref = storage.getString('ton-storage-ref');

    if (!ref) {
        throw Error('Invalid ref');
    }

    await SecureStore.setItemAsync(ref, appKey.toString('base64'), { requireAuthentication: true });

    storage.set('ton-storage-kind', 'secure-store');
    storage.set('key-store-migrated', true);
}

export async function encryptAndStoreAppKeyWithBiometrics(passcode: string) {
    // Load existing app key with passcode
    const appKey = await getApplicationKey(passcode);
    const ref = storage.getString('ton-storage-ref');

    if (!ref) {
        throw Error('Invalid ref');
    }

    // Set storage kind and ref
    storage.set('ton-storage-kind', 'secure-store');
    storage.set('ton-storage-ref', ref);
    try {
        // Delete prev existing key
        await SecureStore.deleteItemAsync(ref);
    } catch (e) {
        // Ignore
    }
    await SecureStore.setItemAsync(ref, appKey.toString('base64'), {
        requireAuthentication: true,
        keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY
    });
}

export async function encryptAndStoreAppKeyWithPasscode(passcode: string) {
    try {
        // Load current app key from secure storage
        const appKey = await getApplicationKey();

        // Encrypt and store app key with new passcode
        const passcodeKey = await generateKeyFromPasscode(passcode);
        const passcodeEncAppKey = await doEncrypt(passcodeKey.key, appKey);
        const ref = storage.getString('ton-storage-ref');

        if (!ref) {
            throw Error('Invalid ref');
        }

        // Store
        storage.set(passcodeSaltKey, passcodeKey.salt);
        storage.set(passcodeEncKey + ref, passcodeEncAppKey.toString('base64'));
        storage.set(passcodeLengthKey, passcode.length);
    } catch (e) {
        throw Error('Failed to encrypt and store app key with passcode');
    }
}

export async function generateNewKeyAndEncryptWithPasscode(data: Buffer, passcode: string) {
    try {
        // Generate new ref
        let ref = (await getSecureRandomBytes(32)).toString('hex');

        // Generate new key
        let privateKey = await getSecureRandomBytes(32);

        // Encrypt with passcode
        const passcodeKey = await generateKeyFromPasscode(passcode);
        const passcodeEncPrivateKey = await doEncrypt(passcodeKey.key, privateKey);

        // Store
        storage.set('ton-storage-ref', ref);
        storage.set(passcodeSaltKey, passcodeKey.salt);
        storage.set(passcodeEncKey + ref, passcodeEncPrivateKey.toString('base64'));
        storage.set(passcodeLengthKey, passcode.length);

        // Encrypt data with new key
        return doEncrypt(privateKey, data);
    } catch (e) {
        throw Error('Failed to generate new key and encrypt data');
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

export async function updatePasscode(prevPasscode: string, newPasscode: string) {
    try {
        // Load app key with passcode
        const appKey = await getApplicationKey(prevPasscode);

        // Generate passcode key with new passcode
        const passcodeKey = await generateKeyFromPasscode(newPasscode);

        // Encrypt app key with passcode key
        const passcodeEncAppKey = await doEncrypt(passcodeKey.key, appKey);

        // Store passcode key salt and encrypted app key
        const ref = storage.getString('ton-storage-ref')
        storage.set(passcodeSaltKey, passcodeKey.salt);
        storage.set(passcodeEncKey + ref, passcodeEncAppKey.toString('base64'));
        storage.set(passcodeLengthKey, newPasscode.length);
    } catch (e) {
        throw Error('Unable to migrate to new passcode');
    }
}

export function getPasscodeState() {
    return (storage.getString(passcodeStateKey) ?? null) as PasscodeState | null;
}

export function storePasscodeState(state: PasscodeState) {
    storage.set(passcodeStateKey, state);
}

export function getBiometricsState() {
    return (storage.getString(biometricsStateKey) ?? null) as BiometricsState | null;
}

export function storeBiometricsState(state: BiometricsState) {
    storage.set(biometricsStateKey, state);
}