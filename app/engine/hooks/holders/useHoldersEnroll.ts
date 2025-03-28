import { Address, beginCell, storeStateInit } from "@ton/core";
import { AuthParams, AuthWalletKeysType } from "../../../components/secure/AuthWalletKeys";
import { fetchUserToken, TonSolanaAuthRequest } from "../../api/holders/fetchUserToken";
import { contractFromPublicKey } from "../../contractFromPublicKey";
import { onHoldersEnroll } from "../../effects/onHoldersEnroll";
import { WalletKeys } from "../../../storage/walletKeys";
import { ConnectReplyBuilder, ExtendedConnectItemReply, SolanaProofItemReply } from "../../tonconnect/ConnectReplyBuilder";
import { holdersUrl } from "../../api/holders/fetchUserState";
import { getAppManifest } from "../../getters/getAppManifest";
import { AppManifest } from "../../api/fetchManifest";
import { TonProofItemReplySuccess } from "@tonconnect/protocol";
import { useAppConnections, useConnectApp, useNetwork, useSaveAppConnection } from "..";
import { deleteHoldersToken, getHoldersToken, setHoldersToken } from "./useHoldersAccountStatus";
import { TonConnectBridgeType } from "../../tonconnect/types";
import { extensionKey } from "../dapps/useAddExtension";
import { useWalletVersion } from "../useWalletVersion";
import { getInviteId } from "../../../useLinkNavigator";
import { LedgerWallet } from "../../../fragments/ledger/components/TransportContext";
import { PublicKey } from "@solana/web3.js";

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
    authStyle?: AuthParams | undefined,
    inviteId?: string
}

export type HoldersLedgerEnrollParams = {
    acc: LedgerWallet,
    domain: string,
    inviteId?: string
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
    NoProof = 'NoProof',
    LedgerHandled = 'LedgerHandled'
}

export type HoldersEnrollResult = { type: 'error', error: HoldersEnrollErrorType } | { type: 'success' };

export function useHoldersEnroll({ acc, authContext, authStyle, inviteId }: HoldersEnrollParams) {
    const { isTestnet } = useNetwork();
    const version = useWalletVersion();
    const saveAppConnection = useSaveAppConnection();
    const connectApp = useConnectApp();
    const connectAppConnections = useAppConnections();

    return (async () => {
        let res = await (async () => {

            //
            // Check if app is already connected
            //

            const url = holdersUrl(isTestnet);
            const app = connectApp(url);
            const connections = app ? connectAppConnections(extensionKey(app.url)) : [];
            const isInjected = connections.find((item) => item.type === TonConnectBridgeType.Injected);

            const storedInviteId = getInviteId();

            if (inviteId || storedInviteId) {

                //
                // Reset holders token with every invite attempt
                //

                deleteHoldersToken(acc.address.toString({ testOnly: isTestnet }))
            }

            // 
            // Check holders token value
            // 

            let existingToken = getHoldersToken(acc.address.toString({ testOnly: isTestnet }));

            if (!!existingToken && existingToken.toString().length > 0 && isInjected) {
                return { type: 'success' };
            } else {

                //
                // Create signnature and fetch token
                //

                const manifestUrl = `${url}/jsons/tonconnect-manifest.json`;

                let manifest: AppManifest | null;
                try {
                    manifest = await getAppManifest(manifestUrl);
                } catch (error) {
                    return { type: 'error', error: HoldersEnrollErrorType.ManifestFailed };
                }

                if (!manifest) {
                    return { type: 'error', error: HoldersEnrollErrorType.ManifestFailed };
                }

                const contract = contractFromPublicKey(acc.publicKey, version, isTestnet);

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
                        items: [{ name: 'ton_addr' }, { name: 'ton_proof', payload: 'ton-proof-any' }, { name: 'solana_proof', payload: 'solana-proof-any' }],
                        manifestUrl
                    },
                    manifest
                );

                let replyItems: ExtendedConnectItemReply[];
                try {
                    replyItems = replyBuilder.createReplyItems(
                        acc.address.toString({ testOnly: isTestnet, urlSafe: true, bounceable: true }),
                        Uint8Array.from(walletKeys.keyPair.secretKey),
                        Uint8Array.from(walletKeys.keyPair.publicKey),
                        stateInitStr,
                        isTestnet
                    );
                } catch {
                    return { type: 'error', error: HoldersEnrollErrorType.ReplyItemsFailed };
                }

                await saveAppConnection({
                    address: acc.addressString,
                    app: {
                        name: manifest.name,
                        // todo: use manifest.url instead of holdersUrl on stabel static endpoint
                        // url: manifest.url,
                        url,
                        iconUrl: manifest.iconUrl,
                        autoConnectDisabled: false,
                        manifestUrl,
                    },
                    connections: [{
                        type: TonConnectBridgeType.Injected,
                        replyItems
                    }]
                });

                try {
                    const tonProof = (replyItems.find((item) => item.name === 'ton_proof') as TonProofItemReplySuccess | undefined);
                    const solanaProof = (replyItems.find((item) => item.name === 'solana_proof') as SolanaProofItemReply | undefined);

                    if (!tonProof || !solanaProof) {
                        return { type: 'error', error: HoldersEnrollErrorType.NoProof };
                    }

                    const solanaPublicKey = new PublicKey(walletKeys.keyPair.publicKey);

                    const requestParams: TonSolanaAuthRequest = [
                        {
                            stack: 'ton',
                            network: isTestnet ? 'ton-testnet' : 'ton-mainnet',
                            key: {
                                kind: 'tonconnect-v2',
                                wallet: 'tonhub',
                                config: {
                                    address: acc.address.toRawString(),
                                    proof: {
                                        timestamp: tonProof.proof.timestamp,
                                        domain: tonProof.proof.domain,
                                        signature: tonProof.proof.signature,
                                        payload: tonProof.proof.payload,
                                        publicKey: walletKeys.keyPair.publicKey.toString('hex'),
                                        walletStateInit: stateInitStr
                                    }
                                }
                            },
                            inviteId
                        },
                        {
                            stack: 'solana',
                            network: isTestnet ? 'solana-devnet' : 'solana-mainnet',
                            key: {
                                kind: 'tonconnect-v2',
                                wallet: 'tonhub',
                                config: {
                                    address: solanaPublicKey.toBase58(),
                                    proof: {
                                        timestamp: solanaProof.proof.timestamp,
                                        domain: solanaProof.proof.domain,
                                        signature: solanaProof.proof.signature,
                                        payload: solanaProof.proof.payload,
                                        publicKey: solanaPublicKey.toBase58()
                                    }
                                }
                            }
                        }
                    ];

                    const token = await fetchUserToken(requestParams, isTestnet);

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

