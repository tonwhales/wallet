import { KeyPair, mnemonicToWalletKey } from "@ton/crypto";
import { decryptData } from "./secureStorage";
import { Platform } from "react-native";
import { secp256k1 } from "@noble/curves/secp256k1";
import { ethereumAddressFromPrivateKey } from "../utils/ethereum/address";

export type EthKeyPair = {
    privateKey: Uint8Array;
    publicKey: Uint8Array;
    address: string;
}

export type WalletKeys = {
    keyPair: KeyPair,
    mnemonics: string[],
    ethKeyPair?: EthKeyPair
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
export async function loadWalletKeys(
    secretKeyEnc: Buffer,
    passcode?: string,
    ethereumSecretKeyEnc?: Buffer
): Promise<WalletKeys> {
    try {
        let plainText = await decryptData(secretKeyEnc, passcode);
        let mnemonics = plainText.toString().split(' ');
        let walletKey = await mnemonicToWalletKey(mnemonics);

        // Decrypt Ethereum keys if available
        let ethKeyPair: EthKeyPair | undefined;
        if (ethereumSecretKeyEnc) {
            try {
                const ethereumPrivateKey = await decryptData(ethereumSecretKeyEnc, passcode);
                const ethereumPrivateKeyArray = new Uint8Array(ethereumPrivateKey);
                const ethereumPublicKey = secp256k1.getPublicKey(ethereumPrivateKeyArray, false).slice(1);
                const ethereumAddress = ethereumAddressFromPrivateKey(ethereumPrivateKeyArray);
                ethKeyPair = {
                    privateKey: ethereumPrivateKeyArray,
                    publicKey: ethereumPublicKey,
                    address: ethereumAddress
                };
            } catch {
                // Ethereum keys decryption failed, continue without them
            }
        }

        return { keyPair: walletKey, mnemonics, ethKeyPair };
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