import { Address, beginCell, storeStateInit } from "@ton/core";
import { AuthParams, AuthWalletKeysType } from "../../../components/secure/AuthWalletKeys";
import { fetchAccountToken } from "../../api/holders/fetchAccountToken";
import { contractFromPublicKey } from "../../contractFromPublicKey";
import { onHoldersEnroll } from "../../effects/onHoldersEnroll";
import { WalletKeys } from "../../../storage/walletKeys";
import { ConnectReplyBuilder } from "../../tonconnect/ConnectReplyBuilder";
import { holdersUrl } from "../../api/holders/fetchAccountState";
import { getAppManifest } from "../../getters/getAppManifest";
import { AppManifest } from "../../api/fetchManifest";
import { ConnectItemReply, TonProofItemReplySuccess } from "@tonconnect/protocol";
import { useNetwork, useSaveAppConnection } from "..";
import { deleteHoldersToken, getHoldersToken, setHoldersToken } from "./useHoldersAccountStatus";
import { TonConnectBridgeType } from "../../tonconnect/types";

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
    AfterEnrollFailed = 'AfterEnrollFailed',
    SignFailed = 'SignFailed',
    ManifestFailed = 'ManifestFailed',
    ReplyItemsFailed = 'ReplyItemsFailed',
    NoProof = 'NoProof'
}

export type HoldersEnrollResult = { type: 'error', error: HoldersEnrollErrorType } | { type: 'success' };

export function useHoldersEnroll({ acc, domain, authContext, authStyle }: HoldersEnrollParams) {
    const { isTestnet } = useNetwork();
    const saveAppConnection = useSaveAppConnection();
    return (async () => {
        let res = await (async () => {

            // 
            // Check holders token value
            // 

            let existingToken = getHoldersToken(acc.address.toString({ testOnly: isTestnet }));

            if (existingToken && existingToken.toString().length > 0) {
                return { type: 'success' };
            } else {

                //
                // Create signnature and fetch token
                //

                const manifestUrl = `${holdersUrl}/tonconnect-manifest.json`;

                let manifest: AppManifest | null;
                try {
                    manifest = await getAppManifest(manifestUrl);
                } catch (error) {
                    return { type: 'error', error: HoldersEnrollErrorType.ManifestFailed };
                }

                if (!manifest) {
                    return { type: 'error', error: HoldersEnrollErrorType.ManifestFailed };
                }

                const contract = contractFromPublicKey(acc.publicKey);

                //
                // Sign
                //

                let walletKeys: WalletKeys;
                try {
                    walletKeys = await authContext.authenticate(authStyle);
                } catch (e) {
                    return { type: 'error', error: HoldersEnrollErrorType.SignFailed };
                }

                const initialCode = contract.init.code;
                const initialData = contract.init.data;
                const stateInitCell = beginCell().store(storeStateInit({ code: initialCode, data: initialData })).endCell();
                const stateInitStr = stateInitCell.toBoc({ idx: false }).toString('base64');

                const replyBuilder = new ConnectReplyBuilder(
                    {
                        items: [{ name: 'ton_addr' }, { name: 'ton_proof', payload: 'ton-proof-any' }],
                        manifestUrl
                    },
                    manifest
                );

                let replyItems: ConnectItemReply[];
                try {
                    replyItems = replyBuilder.createReplyItems(
                        acc.address.toString({ testOnly: isTestnet, urlSafe: true, bounceable: true }),
                        Uint8Array.from(walletKeys.keyPair.secretKey),
                        Uint8Array.from(walletKeys.keyPair.publicKey),
                        stateInitStr,
                        isTestnet
                    );
                } catch (e) {
                    return { type: 'error', error: HoldersEnrollErrorType.ReplyItemsFailed };
                }

                await saveAppConnection({
                    app: {
                        name: manifest.name,
                        // todo: use manifest.url instead of holdersUrl on stabel static endpoint
                        // url: manifest.url,
                        url: holdersUrl,
                        iconUrl: manifest.iconUrl,
                        autoConnectDisabled: false,
                        manifestUrl,
                    },
                    connections: [{
                        type: TonConnectBridgeType.Injected,
                        replyItems: replyItems,
                    }]
                });

                try {
                    const proof = (replyItems.find((item) => item.name === 'ton_proof') as TonProofItemReplySuccess | undefined);

                    if (!proof) {
                        return { type: 'error', error: HoldersEnrollErrorType.NoProof };
                    }

                    let token = await fetchAccountToken({
                        kind: 'tonconnect-v2',
                        wallet: 'tonhub',
                        config: {
                            address: acc.address.toRawString(),
                            proof: {
                                timestamp: proof.proof.timestamp,
                                domain: proof.proof.domain,
                                signature: proof.proof.signature,
                                payload: proof.proof.payload,
                                publicKey: walletKeys.keyPair.publicKey.toString('hex'),
                                walletStateInit: stateInitStr
                            }
                        }
                    }, isTestnet);

                    setHoldersToken(acc.address.toString({ testOnly: isTestnet }), token);
                } catch (e) {
                    console.warn(e);
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