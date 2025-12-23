import { KeyPair, mnemonicToWalletKey } from "@ton/crypto";
import { decryptDataBatch } from "./secureStorage";
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
        // Decrypt all keys in a single batch to avoid multiple auth prompts
        const [plainText, ethereumPrivateKey] = await decryptDataBatch(
            [secretKeyEnc, ethereumSecretKeyEnc],
            passcode
        );

        if (!plainText) {
            throw new Error('Failed to decrypt main key');
        }

        const mnemonics = plainText.toString().split(' ');
        const walletKey = await mnemonicToWalletKey(mnemonics);

        // Process Ethereum keys if decryption succeeded
        let ethKeyPair: EthKeyPair | undefined;
        if (ethereumPrivateKey) {
            try {
                const ethereumPrivateKeyArray = new Uint8Array(ethereumPrivateKey);
                const ethereumPublicKey = secp256k1.getPublicKey(ethereumPrivateKeyArray, false).slice(1);
                const ethereumAddress = ethereumAddressFromPrivateKey(ethereumPrivateKeyArray);
                ethKeyPair = {
                    privateKey: ethereumPrivateKeyArray,
                    publicKey: ethereumPublicKey,
                    address: ethereumAddress
                };
            } catch {
                // Ethereum keys processing failed, continue without them
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