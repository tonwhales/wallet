import { Address } from "@ton/core";
import { AuthParams, AuthWalletKeysType } from "../../../components/secure/AuthWalletKeys";
import { fetchAccountToken } from "../../api/holders/fetchAccountToken";
import { contractFromPublicKey, walletConfigFromContract } from "../../contractFromPublicKey";
import { deleteHoldersToken, getHoldersToken, setHoldersToken } from "./useHoldersAccountStatus";
import { useNetwork } from "../network/useNetwork";
import { useCreateDomainKeyIfNeeded } from "../dapps/useCreateDomainKeyIfNeeded";
import { createDomainSignature } from "../../utils/createDomainSignature";
import { DomainSubkey } from "../../state/domainKeys";
import { onHoldersEnroll } from "../../effects/onHoldersEnroll";

export type HoldersEnrollParams = {
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
}

export enum HoldersEnrollErrorType {
    NoDomainKey = 'NoDomainKey',
    DomainKeyFailed = 'DomainKeyFailed',
    FetchTokenFailed = 'FetchTokenFailed',
    CreateSignatureFailed = 'CreateSignatureFailed',
    AfterEnrollFailed = 'AfterEnrollFailed'
}

export type HoldersEnrollResult = { type: 'error', error: HoldersEnrollErrorType } | { type: 'success' };

export function useHoldersEnroll({ acc, domain, authContext, authStyle }: HoldersEnrollParams) {
    const { isTestnet } = useNetwork();
    const createDomainKeyIfNeeded = useCreateDomainKeyIfNeeded();
    return (async () => {
        let res = await (async () => {
            //
            // Create domain key if needed
            //

            let existingKey: DomainSubkey | false;

            try {
                existingKey = await createDomainKeyIfNeeded(domain, authContext, undefined, authStyle)
            } catch {
                return { type: 'error', error: HoldersEnrollErrorType.DomainKeyFailed };
            }

            if (!existingKey) {
                return { type: 'error', error: HoldersEnrollErrorType.NoDomainKey };
            }

            // 
            // Check holders token cloud value
            // 

            let existingToken = getHoldersToken(acc.address.toString({ testOnly: isTestnet }));

            if (existingToken && existingToken.toString().length > 0) {
                return { type: 'success' };
            } else {
                //
                // Create signnature and fetch token
                //

                let contract = contractFromPublicKey(acc.publicKey);
                let config = walletConfigFromContract(contract);
                let signed: { signature: string; time: number; subkey: { domain: string; publicKey: string; time: number; signature: string; }; };

                try {
                    signed = createDomainSignature(domain, existingKey)
                } catch {
                    return { type: 'error', error: HoldersEnrollErrorType.CreateSignatureFailed };
                }

                try {

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
                    return { type: 'error', error: HoldersEnrollErrorType.FetchTokenFailed };
                }
            }

            return { type: 'success' };
        })();

        //
        // Refetch state
        //

        try {
            await onHoldersEnroll(acc.address.toString({ testOnly: isTestnet }), isTestnet);
        } catch {
            console.warn(HoldersEnrollErrorType.AfterEnrollFailed);
        }

        return res as HoldersEnrollResult;
    })
}