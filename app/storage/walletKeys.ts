import { KeyPair, mnemonicToWalletKey } from "ton-crypto";
import { decryptData } from "./secureStorage";
import { storage } from "./storage";

export type WalletKeys = {
    keyPair: KeyPair,
    mnemonics: string[]
}

export async function loadWalletKeys(): Promise<WalletKeys> {
    const cypherData = Buffer.from(storage.getString('ton-mnemonics')!, 'base64');
    let plainText = await decryptData(cypherData);
    let mnemonics = plainText.toString().split(' ');
    let walletKey = await mnemonicToWalletKey(mnemonics);
    return { keyPair: walletKey, mnemonics };
}