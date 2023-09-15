import { beginCell, safeSign } from "@ton/core";
import { getSecureRandomBytes, keyPairFromSeed } from "ton-crypto";
import { getCurrentAddress } from "../../../storage/appState";
import { WalletKeys } from "../../../storage/walletKeys";
import { warn } from "../../../utils/log";
import { contractFromPublicKey } from "../../contractFromPublicKey";
import { Engine } from "../../Engine";
import { AuthWalletKeysType } from "../../../components/secure/AuthWalletKeys";

export class KeysProduct {
    readonly engine: Engine;

    constructor(engine: Engine) {
        this.engine = engine;
    }

    async createDomainKeyIfNeeded(domain: string, authContext: AuthWalletKeysType, keys?: WalletKeys) {

        // Normalize
        domain = domain.toLowerCase();

        // Check if already exist and we don't have wallet keys loaded
        if (this.engine.persistence.domainKeys.getValue(domain) && !keys) {
            return true;
        }

        // Create new key
        const acc = getCurrentAddress();
        const contract = contractFromPublicKey(acc.publicKey);
        let time = Math.floor(Date.now() / 1000);

        // Create signing key
        let walletKeys: WalletKeys;
        if (keys) {
            walletKeys = keys;
        } else {
            try {
                walletKeys = await authContext.authenticate({ cancelable: true });
            } catch (e) {
                warn('Failed to load wallet keys');
                return false;
            }
        }
        let secret = await getSecureRandomBytes(32);
        let subkey = keyPairFromSeed(secret);
        let toSign = beginCell()
            .storeCoins(1)
            .storeBuffer(subkey.publicKey)
            .storeUint(time, 32)
            .storeAddress(contract.address)
            .storeRef(beginCell().storeBuffer(Buffer.from(domain)).endCell())
            .endCell();
        let signature = safeSign(toSign, walletKeys.keyPair.secretKey);

        // Persist key
        this.engine.persistence.domainKeys.setValue(domain, { time, signature, secret });

        return true;
    }

    getDomainKey(domain: string) {
        let res = this.engine.persistence.domainKeys.getValue(domain);
        if (!res) {
            throw Error('Domain key not found');
        }
        return res;
    }

    createDomainSignature(domain: string) {
        const domainKey = this.getDomainKey(domain);

        const subkey = keyPairFromSeed(domainKey.secret);
        const contract = contractFromPublicKey(this.engine.publicKey);
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
}