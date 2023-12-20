import { KeyPair, mnemonicToWalletKey } from "@ton/crypto";
import { decryptData } from "./secureStorage";
import { Platform } from "react-native";

export type WalletKeys = {
    keyPair: KeyPair,
    mnemonics: string[]
}

export class SecureAuthenticationCancelledError extends Error {
    name = 'AuthenticationCancelled';

    constructor() {
        super('Authentication cancelled');
    }
}
export class SecureFailedLoadKeysError extends Error {
    name = 'FailedToLoadKeys';

    constructor() {
        super('Unable to load wallet keys');
    }
}

/**
 * @throws {SecureAuthenticationCancelledError} If the user cancels the authentication.
 * @throws {SecureFailedLoadKeysError} If unable to load wallet keys.
 * @returns {Promise<WalletKeys>}
 */
export async function loadWalletKeys(secretKeyEnc: Buffer, passcode?: string): Promise<WalletKeys> {
    try {
        let plainText = await decryptData(secretKeyEnc, passcode);
        let mnemonics = plainText.toString().split(' ');
        let walletKey = await mnemonicToWalletKey(mnemonics);
        return { keyPair: walletKey, mnemonics };
    } catch (e) {
        if (e instanceof Error) {
            if (Platform.OS === 'android' && e.message.includes('User canceled the authentication')) {
                throw new SecureAuthenticationCancelledError();
            }
    
            if (Platform.OS === 'ios' && e.message.includes('User canceled the operation')) {
                throw new SecureAuthenticationCancelledError();
            }
        }
        throw new SecureFailedLoadKeysError();
    }
}