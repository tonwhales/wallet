import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getSecureRandomBytes, openBox, pbkdf2_sha512, sealBox } from 'ton-crypto';
import { storage } from "./storage";
import * as LocalAuthentication from 'expo-local-authentication';
import * as KeyStore from './modules/KeyStore';
import { getAppState, setAppState } from './appState';
import { warn } from '../utils/log';
import { loadWalletKeys } from './walletKeys';

export const passcodeStateKey = 'passcode-state';
export const passcodeSaltKey = 'passcode-salt';
export const passcodeEncKey = 'ton-passcode-enc-key';

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
        const salt = storage.getString('ton-storage-passcode-nacl');
        const passEncKey = storage.getString('ton-storage-pass-key');

        if (!salt || !passEncKey) {
            throw Error(`${!!salt ? 'Salt ' : ''}${!!passEncKey ? 'EncPassKey ' : ''} not found`);
        }

        return doDecryptWithPasscode(passcode, salt, Buffer.from(passEncKey, 'base64'));
    }

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

export async function generateNewKeyAndEncrypt(disableEncryption: boolean, data: Buffer, passcode?: string) {

    if (passcode) {
        const passcodePrivateKey = await generateKeyFromPasscode(passcode);
        storage.set('ton-storage-passcode-nacl', passcodePrivateKey.salt);
        storage.set('ton-storage-pass-key', passcodePrivateKey.key.toString('base64'));
        storage.set(passcodeStateKey, PasscodeState.Set);
        return doEncrypt(passcodePrivateKey.key, data);
    }

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
        throw Error('Unsupported platform')
    }

    return doEncrypt(privateKey, data);
}

export async function encryptData(data: Buffer, passcode?: string) {
    const key = await getApplicationKey(passcode);
    const nonce = await getSecureRandomBytes(24);
    const sealed = sealBox(data, nonce, key);
    return Buffer.concat([nonce, sealed]);
}

export async function decryptDataBatch(data: Buffer[], passcode?: string) {
    const key = await getApplicationKey(passcode);
    data.map((item) => {
        let nonce = item.slice(0, 24);
        let cypherData = item.slice(24);
        let res = openBox(cypherData, nonce, key);
        if (!res) {
            throw Error('Unable to decrypt data');
        }
        return res;
    });
    return data;
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

export function migrateBiometricsEncKeys(isTestnet: boolean) {
    const migrated = storage.getBoolean(`migrated-biometrics-enc-keys-${isTestnet ? 'testnet' : 'mainnet'}`);
    if (migrated) {
        return;
    }

    const appState = getAppState();

    try {
        appState.addresses.forEach(addr => {
            storeBiometricsEncKey(
                addr.address.toFriendly({ testOnly: isTestnet }),
                addr.secretKeyEnc
            );
            storeBiometricsState(BiometricsState.InUse);
        });
        storage.set(`migrated-biometrics-enc-keys-${isTestnet ? 'testnet' : 'mainnet'}`, true);
    } catch (e) {
        warn('Unable to migrate biometrics enc keys');
    }
}

export async function migrateToNewPasscode(prevPasscode: string, newPasscode: string, isTestnet: boolean) {
    const appState = getAppState();
    const current = appState.addresses[appState.selected];
    try {
        const keys = await loadWalletKeys(current.secretKeyEnc, prevPasscode);
        // Generate new and save for current account
        const secretKeyEnc = await generateNewKeyAndEncrypt(false, Buffer.from(keys.mnemonics.join(' ')), newPasscode);

        const newSelectedAccount = {
            address: current.address,
            publicKey: current.publicKey,
            secretKeyEnc,
            utilityKey: current.utilityKey,
        };

        const newAddresses = [];
        // Migrate all keys to new passcode
        for (let i = 0; i < appState.addresses.length; i++) {
            const account = appState.addresses[i];
            if (i === appState.selected) {
                continue;
            }
            const keys = await loadWalletKeys(account.secretKeyEnc, prevPasscode);
            const newEncKey = await encryptData(Buffer.from(keys.mnemonics.join(' ')), newPasscode);
            newAddresses.push({
                address: account.address,
                publicKey: account.publicKey,
                secretKeyEnc: newEncKey,
                utilityKey: account.utilityKey,
            });
        }

        newAddresses.push(newSelectedAccount);

        // Save new appState
        setAppState({
            addresses: newAddresses,
            selected: newAddresses.length - 1,
        }, isTestnet);
    } catch (e) {
        warn('Unable to migrate to new passcode');
        throw Error('Unable to migrate to new passcode');
    }
}

export function getPasscodeState() {
    return (storage.getString(passcodeStateKey) ?? null) as PasscodeState | null;
}

export function getBiometricsState() {
    return (storage.getString(biometricsStateKey) ?? null) as BiometricsState | null;
}

export function getBiometricsEncKey(address: string) {
    const encKey = storage.getString(`${address}/${biometricsEncKey}`);
    if (!encKey) {
        return null;
    }
    return Buffer.from(encKey, 'base64');
}

export function storeBiometricsState(state: BiometricsState) {
    storage.set(biometricsStateKey, state);
}

export function storeBiometricsEncKey(address: string, data: Buffer) {
    storage.set(`${address}/${biometricsEncKey}`, data.toString('base64'));
}