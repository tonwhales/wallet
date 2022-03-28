import { KeyPair, mnemonicToWalletKey } from "ton-crypto";
import { AuthContextType } from "../utils/AuthContext";
import { decryptData, decryptPasscodeData } from "./secureStorage";

export type WalletKeys = {
    keyPair: KeyPair,
    mnemonics: string[]
}

export async function loadWalletKeys(secretKeyEnc: Buffer): Promise<WalletKeys> {
    let plainText = await decryptData(secretKeyEnc);
    let mnemonics = plainText.toString().split(' ');
    let walletKey = await mnemonicToWalletKey(mnemonics);
    return { keyPair: walletKey, mnemonics };
}

export async function loadWalletKeysWithAuth(secretKeyEnc: Buffer, auth: AuthContextType): Promise<WalletKeys> {
    const authRes = await auth?.authenticateAsync();
    if (authRes === 'success') {
        let plainText = await decryptPasscodeData(secretKeyEnc);
        let mnemonics = plainText.toString().split(' ');
        let walletKey = await mnemonicToWalletKey(mnemonics);
        return { keyPair: walletKey, mnemonics };
    } else {
        throw Error('Auth error');
    }
}