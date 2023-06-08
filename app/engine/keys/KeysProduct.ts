import { beginCell, safeSign } from "ton";
import { getSecureRandomBytes, keyPairFromSeed } from "ton-crypto";
import { getCurrentAddress } from "../../storage/appState";
import { WalletKeys } from "../../storage/walletKeys";
import { warn } from "../../utils/log";
import { contractFromPublicKey } from "../contractFromPublicKey";
import { Engine } from "../Engine";
import { AuthWalletKeysType } from "../../components/secure/AuthWalletKeys";
import { storage } from "../../storage/storage";
import { extractDomain } from "../utils/extractDomain";
import { CloudValue } from "../cloud/CloudValue";
import { holdersUrl } from "../corp/HoldersProduct";

const currentVersion = 1;

export class KeysProduct {
    readonly engine: Engine;

    constructor(engine: Engine) {
        this.engine = engine;
        if ((storage.getNumber('keys-product-version') ?? 0) < currentVersion) {
            this.migrateKeys_v1();
        }
    }

    migrateKeys_v1() {
        const cloudExtensions: CloudValue<{ installed: { [key: string]: { url: string, date: number, title?: string | null, image?: { url: string, blurhash: string } | null } } }> = this.engine.cloud.get('wallet.extensions.v2', (src) => { src.installed = {} });
        const installed = cloudExtensions.value.installed;
        const acc = getCurrentAddress();
        Object.values(installed).forEach((value) => {
            try {
                const domain = extractDomain(value.url);
                const prev = this.engine.persistence.domainKeys.getValue(domain);
                if (prev) {
                    this.engine.persistence.domainKeys.setValue(
                        `${acc.address.toFriendly({ testOnly: this.engine.isTestnet })}/${domain}`,
                        prev
                    );

                    // Clear prev
                    this.engine.persistence.domainKeys.setValue(domain, null);
                }

            } catch (e) {
                warn('Failed to migrate key');
            }
        });

        // Migrate Holders key
        const holdersDomain = extractDomain(holdersUrl);
        const prev = this.engine.persistence.domainKeys.getValue(holdersDomain);
        if (prev) {
            this.engine.persistence.domainKeys.setValue(
                `${acc.address.toFriendly({ testOnly: this.engine.isTestnet })}/${holdersDomain}`,
                prev
            );

            // Clear prev
            this.engine.persistence.domainKeys.setValue(holdersDomain, null);
        }
        
        storage.set('keys-product-version', currentVersion);
    }

    async createDomainKeyIfNeeded(domain: string, authContext: AuthWalletKeysType, keys?: WalletKeys) {

        // Normalize
        domain = domain.toLowerCase();

        // Check if already exist and we don't have wallet keys loaded
        if (this.getDomainKey(domain) && !keys) {
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
        this.engine.persistence.domainKeys.setValue(
            `${acc.address.toFriendly({ testOnly: this.engine.isTestnet })}/${domain}`,
            { time, signature, secret }
        );

        return true;
    }

    getDomainKey(domain: string) {
        const acc = getCurrentAddress();
        let res = this.engine.persistence.domainKeys.getValue(`${acc.address.toFriendly({ testOnly: this.engine.isTestnet })}/${domain}`);
        return res;
    }

    createDomainSignature(domain: string) {
        const domainKey = this.getDomainKey(domain);

        if (!domainKey) {
            throw new Error('Domain key not found');
        }

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