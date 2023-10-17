import { Address } from "@ton/core";
import { AuthWalletKeysType } from "../../../components/secure/AuthWalletKeys";
import { fetchAccountToken } from "../../api/holders/fetchAccountToken";
import { contractFromPublicKey, walletConfigFromContract } from "../../contractFromPublicKey";
import { deleteHoldersToken, getHoldersToken, setHoldersToken, useHoldersAccountStatus } from "../../hooks/holders/useHoldersAccountStatus";
import { useNetwork } from "../../hooks/useNetwork";
import { useCreateDomainKeyIfNeeded } from "../dapps/useCreateDomainKeyIfNeeded";
import { useCreateDomainSignature } from "../dapps/useCreateDomainSignature";

export function useHoldersEnroll(
    acc: {
        address: Address;
        addressString: string;
        publicKey: Buffer;
        secretKeyEnc: Buffer;
        utilityKey: Buffer;
    },
    domain: string,
    authContext: AuthWalletKeysType
) {
    const { isTestnet } = useNetwork();
    const createDomainKeyIfNeeded = useCreateDomainKeyIfNeeded();
    const createDomainSignature = useCreateDomainSignature();
    const status = useHoldersAccountStatus(acc.addressString);
    return (async () => {
        let res = await (async () => {
            //
            // Create domain key if needed
            //

            let created = await createDomainKeyIfNeeded(domain, authContext);
            if (!created) {
                return false;
            }

            // 
            // Check holders token cloud value
            // 

            let existing = getHoldersToken(acc.addressString);
            if (existing && existing.toString().length > 0) {
                return true;
            } else {
                //
                // Create signnature and fetch token
                //

                try {
                    let contract = contractFromPublicKey(acc.publicKey);
                    let config = walletConfigFromContract(contract);
                    let signed = createDomainSignature(domain);
                    let token = await fetchAccountToken({
                        address: contract.address.toString({ testOnly: isTestnet }),
                        walletConfig: config.walletConfig,
                        walletType: config.type,
                        time: signed.time,
                        signature: signed.signature,
                        subkey: signed.subkey
                    }, isTestnet);

                    setHoldersToken(acc.addressString, token);
                } catch (e) {
                    console.warn(e);
                    deleteHoldersToken(acc.addressString);
                    throw Error('Failed to create signature and fetch token');
                }
            }

            return true;
        })();

        // Refetch state
        await status.refetch();

        return res;
    })
}