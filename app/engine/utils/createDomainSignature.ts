import { beginCell, safeSign } from "@ton/core";
import { getCurrentAddress } from "../../storage/appState";
import { contractFromPublicKey } from "../contractFromPublicKey";
import { keyPairFromSeed } from "@ton/crypto";
import { DomainSubkey } from "../state/domainKeys";

export function createDomainSignature(domain: string, domainKey: DomainSubkey) {
    if (!domainKey) {
        throw new Error('Domain key not found');
    }

    const subkey = keyPairFromSeed(domainKey.secret);

    const currentAccount = getCurrentAddress();
    const contract = contractFromPublicKey(currentAccount.publicKey);
    const time = Math.floor((Date.now() / 1000));
    const toSign = beginCell()
        .storeCoins(1)
        .storeAddress(contract.address)
        .storeUint(time, 32)
        .storeRef(beginCell()
            .storeBuffer(Buffer.from(domain))
            .endCell())
        .endCell();
    const signature = safeSign(toSign, subkey.secretKey);

    return {
        signature: signature.toString('base64'),
        time,
        subkey: {
            domain: domain,
            publicKey: subkey.publicKey.toString('base64'),
            time: domainKey.time,
            signature: domainKey.signature.toString('base64')
        }
    };
}