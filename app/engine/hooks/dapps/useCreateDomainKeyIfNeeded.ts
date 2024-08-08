import { beginCell, safeSign } from "@ton/core";
import { AuthParams, AuthWalletKeysType } from "../../../components/secure/AuthWalletKeys";
import { getCurrentAddress } from "../../../storage/appState";
import { WalletKeys } from "../../../storage/walletKeys";
import { warn } from "../../../utils/log";
import { contractFromPublicKey } from "../../contractFromPublicKey";
import { getSecureRandomBytes, keyPairFromSeed } from "@ton/crypto";
import { useDomainKeys } from "../../hooks/dapps/useDomainKeys";
import { DomainSubkey } from "../../state/domainKeys";
import { useWalletVersion } from "../useWalletVersion";

export function useCreateDomainKeyIfNeeded() {
    const [domainKeys, setDomainKeysState] = useDomainKeys();
    const version = useWalletVersion();

    return async (domain: string, authContext: AuthWalletKeysType, keys?: WalletKeys, authStyle?: AuthParams) => {
        // Normalize
        domain = domain.toLowerCase();

        const exising = domainKeys[domain] as DomainSubkey | undefined;

        if (!!exising) {
            return exising;
        }

        // Create new key
        const acc = getCurrentAddress();
        const contract = contractFromPublicKey(acc.publicKey, version);
        let time = Math.floor(Date.now() / 1000);

        // Create signing key
        let walletKeys: WalletKeys;
        if (keys) {
            walletKeys = keys;
        } else {
            try {
                walletKeys = await authContext.authenticate({ cancelable: true, ...authStyle });
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
        const newKey = { time, signature, secret };
        setDomainKeysState({ ...domainKeys, [domain]: newKey });

        return newKey;
    }
}
