import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getSecureRandomBytes, openBox, sealBox } from 'ton-crypto';
import { storage } from "./storage";
import * as LocalAuthentication from 'expo-local-authentication';
import * as Keychain from 'react-native-keychain';
import * as KeyStore from './modules/KeyStore';

function loadKeyStorageType(): 'secure-store' | 'local-authentication' | 'keychain' | 'key-store' {
    let kind = storage.getString('ton-storage-kind');

    console.log('[loadKeyStorageType]', { kind });

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
    if (kind === 'keychain') {
        return 'keychain';
    }
    if (kind === 'key-store') {
        return 'key-store';
    }
    throw Error('Storage type invalid');
}

function loadKeyStorageRef() {
    let ref = storage.getString('ton-storage-ref');
    if (ref) {
        return ref;
    } else {
        return 'ton-application-key-v5'; // Legacy
    }
}

async function getApplicationKey() {

    const storageType = loadKeyStorageType();
    const ref = loadKeyStorageRef();

    // Local authentication
    if (storageType === 'local-authentication') {

        // Request local authentication
        let supportedAuthTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (supportedAuthTypes.length > 0) {
            let authRes = await LocalAuthentication.authenticateAsync();
            if (!authRes.success) {
                throw Error('Authentication canceled');
            }
        }

        // Read from keystore
        const ex = storage.getString('ton-storage-key-' + ref);
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

    // Keychain
    // if (storageType === 'keychain') {
    //     let ex = await Keychain.getGenericPassword({
    //         accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
    //         authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
    //         storage: Keychain.STORAGE_TYPE.RSA,
    //         service: ref
    //     });
    //     if (!ex) {
    //         throw Error('Broken keystore');
    //     }
    //     return Buffer.from(ex.password, 'base64');
    // }

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

export async function generateNewKey(disableEncryption: boolean) {

    // Generate new ref
    let ref = (await getSecureRandomBytes(32)).toString('hex');

    // Generate new key
    let privateKey = await getSecureRandomBytes(32);

    // Handle no-encryption
    if (disableEncryption) {
        storage.set('ton-storage-kind', 'local-authentication');
        storage.set('ton-storage-ref', ref);
        storage.set('ton-storage-key-' + ref, privateKey.toString('base64'));
        return;
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
    }

    // Handle Android
    if (Platform.OS === 'android') {
        storage.set('ton-storage-ref', ref);
        storage.set('ton-storage-kind', 'key-store');
        await KeyStore.setItemAsync(ref, privateKey.toString('base64'));
        // storage.set('ton-storage-kind', 'keychain');
        // await Keychain.setGenericPassword('username', privateKey.toString('base64'), {
        //     accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
        //     authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
        //     storage: Keychain.STORAGE_TYPE.RSA,
        //     service: ref
        // });
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