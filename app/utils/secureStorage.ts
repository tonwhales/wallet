import * as SecureStore from 'expo-secure-store';
import { getSecureRandomBytes, openBox, sealBox } from 'ton-crypto';
import { storage } from './storage';

const TOKEN_KEY = 'ton-application-key-v5';
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