import { KeyPair, mnemonicToWalletKey } from "ton-crypto";
import { decryptData } from "./secureStorage";

export type WalletKeys = {
    keyPair: KeyPair,
    mnemonics: string[]
}

export async function loadWalletKeys(secretKeyEnc: Buffer, passcode?: string): Promise<WalletKeys> {
    let plainText = await decryptData(secretKeyEnc, passcode);
    let mnemonics = plainText.toString().split(' ');
    let walletKey = await mnemonicToWalletKey(mnemonics);
    return { keyPair: walletKey, mnemonics };
}