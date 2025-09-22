import { sha256_sync } from "@ton/crypto";
import { WalletKeys } from "../../../storage/walletKeys";
import nacl from "tweetnacl";
import { Base64 } from "@tonconnect/protocol";

export async function signWalletRequest(message: string, authWalletKeys: WalletKeys) {
    const messageBuffer = Buffer.from(message, 'utf-8');
    const messageHash = sha256_sync(messageBuffer);

    const signed = nacl.sign.detached(
        new Uint8Array(messageHash),
        new Uint8Array(authWalletKeys.keyPair.secretKey),
    );

    return Base64.encode(signed);
}