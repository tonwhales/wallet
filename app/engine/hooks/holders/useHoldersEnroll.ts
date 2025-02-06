import { Address, beginCell, storeStateInit } from "@ton/core";
import { AuthParams, AuthWalletKeysType } from "../../../components/secure/AuthWalletKeys";
import { AccountKeyParam, fetchUserToken } from "../../api/holders/fetchUserToken";
import { contractFromPublicKey } from "../../contractFromPublicKey";
import { onHoldersEnroll } from "../../effects/onHoldersEnroll";
import { WalletKeys } from "../../../storage/walletKeys";
import { ConnectReplyBuilder } from "../../tonconnect/ConnectReplyBuilder";
import { holdersUrl } from "../../api/holders/fetchUserState";
import { getAppManifest } from "../../getters/getAppManifest";
import { AppManifest } from "../../api/fetchManifest";
import { CHAIN, ConnectItemReply, TonProofItemReplySuccess } from "@tonconnect/protocol";
import { useAppConnections, useConnectApp, useNetwork, useSaveAppConnection } from "..";
import { deleteHoldersToken, getHoldersToken, setHoldersToken } from "./useHoldersAccountStatus";
import { TonConnectBridgeType } from "../../tonconnect/types";
import { extensionKey } from "../dapps/useAddExtension";
import { useWalletVersion } from "../useWalletVersion";
import { getInviteId } from "../../../useLinkNavigator";
import { LedgerWallet, useLedgerTransport } from "../../../fragments/ledger/components/TransportContext";
import { pathFromAccountNumber } from "../../../utils/pathFromAccountNumber";
import { extractDomain } from "../../utils/extractDomain";
import { WalletVersions } from "../../types";
import { getTimeSec } from "../../../utils/getTimeSec";
import { warn } from "../../../utils/log";
import { Alert } from "react-native";
import { t } from "../../../i18n/t";
import { normalizeUrl } from "../../../utils/resolveUrl";
import { authParamsFromLedgerProof } from "../../../utils/holders/authParamsFromLedgerProof";

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
                    const proof = (replyItems.find((item) => item.name === 'ton_proof') as TonProofItemReplySuccess | undefined);

                    if (!proof) {
                        return { type: 'error', error: HoldersEnrollErrorType.NoProof };
                    }

                    let token = await fetchUserToken({
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
                    }, isTestnet, inviteId || storedInviteId);

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

