import { Address } from "@ton/core";
import { AuthParams, AuthWalletKeysType } from "../../../components/secure/AuthWalletKeys";
import { fetchAccountToken } from "../../api/holders/fetchAccountToken";
import { contractFromPublicKey, walletConfigFromContract } from "../../contractFromPublicKey";
import { deleteHoldersToken, getHoldersToken, setHoldersToken, useHoldersAccountStatus } from "./useHoldersAccountStatus";
import { useNetwork } from "../network/useNetwork";
import { useCreateDomainKeyIfNeeded } from "../dapps/useCreateDomainKeyIfNeeded";
import { createDomainSignature } from "../../utils/createDomainSignature";

export function useHoldersEnroll(
    acc: {
        address: Address;
        addressString: string;
        publicKey: Buffer;
        secretKeyEnc: Buffer;
        utilityKey: Buffer;
    },
    domain: string,
    authContext: AuthWalletKeysType,
    authStyle?: AuthParams | undefined
) {
    const { isTestnet } = useNetwork();
    const createDomainKeyIfNeeded = useCreateDomainKeyIfNeeded();
    const status = useHoldersAccountStatus(acc.address);
    return (async () => {
        let res = await (async () => {
            //
            // Create domain key if needed
            //

            let existingKey = await createDomainKeyIfNeeded(domain, authContext, undefined, authStyle);

            if (!existingKey) {
                return false;
            }

            // 
            // Check holders token cloud value
            // 

            let existingToken = getHoldersToken(acc.address.toString({ testOnly: isTestnet }));

            if (existingToken && existingToken.toString().length > 0) {
                return true;
            } else {
                //
                // Create signnature and fetch token
                //

                try {
                    let contract = contractFromPublicKey(acc.publicKey);
                    let config = walletConfigFromContract(contract);
                    let signed = createDomainSignature(domain, existingKey);

                    let token = await fetchAccountToken({
                        address: contract.address.toString({ testOnly: isTestnet }),
                        walletConfig: config.walletConfig,
                        walletType: config.type,
                        time: signed.time,
                        signature: signed.signature,
                        subkey: signed.subkey
                    }, isTestnet);

                    setHoldersToken(acc.address.toString({ testOnly: isTestnet }), token);
                } catch {
                    deleteHoldersToken(acc.address.toString({ testOnly: isTestnet }));
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