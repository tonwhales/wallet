import { Platform } from "react-native";
import { createInjectSource } from "../../fragments/apps/components/inject/createInjectSource";
import { createDomainSignature } from "./createDomainSignature";
import { getDomainKey } from "../state/domainKeys";
import { contractFromPublicKey, walletConfigFromContract } from "../contractFromPublicKey";
import { getCurrentAddress } from "../../storage/appState";
import { EdgeInsets } from "react-native-safe-area-context";
import { useNotBounceableWalletFormat } from "../hooks";

export function injectSourceFromDomain(domain: string, isTestnet: boolean, safeArea: EdgeInsets) {
    const currentAccount = getCurrentAddress();
    const [notBounceable,] = useNotBounceableWalletFormat();
    const contract = contractFromPublicKey(currentAccount.publicKey);
    const config = walletConfigFromContract(contract);

    const walletConfig = config.walletConfig;
    const walletType = config.type;

    const domainKey = getDomainKey(domain);

    if (!domainKey) {
        return '';
    }

    const domainSign = createDomainSignature(domain, domainKey);
    return createInjectSource({
        config: {
            version: 1,
            platform: Platform.OS,
            platformVersion: Platform.Version,
            network: isTestnet ? 'testnet' : 'mainnet',
            address: currentAccount.address.toString({ testOnly: isTestnet, bounceable: !notBounceable }),
            publicKey: currentAccount.publicKey.toString('base64'),
            walletConfig,
            walletType,
            signature: domainSign.signature,
            time: domainSign.time,
            subkey: {
                domain: domainSign.subkey.domain,
                publicKey: domainSign.subkey.publicKey,
                time: domainSign.subkey.time,
                signature: domainSign.subkey.signature
            }
        },
        safeArea: safeArea
    });
}