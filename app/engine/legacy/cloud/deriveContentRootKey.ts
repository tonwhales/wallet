import { deriveSymmetricPath, keyPairFromSeed } from "ton-crypto";

export async function deriveContentKey(utilityKey: Buffer, contentId: string) {
    let signKey = await deriveSymmetricPath(utilityKey, ['content', contentId, 'sign']);
    let encryptKey = await deriveSymmetricPath(utilityKey, ['content', contentId, 'encrypt']);
    let signing = keyPairFromSeed(signKey);
    return {
        signKey: signing,
        encryption: encryptKey
    }
}