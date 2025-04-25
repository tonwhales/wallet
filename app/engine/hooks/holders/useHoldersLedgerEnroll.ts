import { Address, beginCell, storeStateInit } from "@ton/core";
import { useAppConnections, useConnectApp, useNetwork, useSaveAppConnection } from "..";
import { useLedgerTransport } from "../../../fragments/ledger/components/TransportContext";
import { getInviteId } from "../../../useLinkNavigator";
import { pathFromAccountNumber } from "../../../utils/pathFromAccountNumber";
import { holdersUrl } from "../../api/holders/fetchUserState";
import { extensionKey } from "../dapps/useAddExtension";
import { TonConnectBridgeType } from "../../tonconnect/types";
import { deleteHoldersToken, getHoldersToken, setHoldersToken } from "./useHoldersAccountStatus";
import { contractFromPublicKey } from "../../contractFromPublicKey";
import { AppManifest } from "../../api/fetchManifest";
import { WalletVersions } from "../../types";
import { getAppManifest } from "../../getters/getAppManifest";
import { HoldersEnrollErrorType, HoldersEnrollResult } from "./useHoldersEnroll";
import { normalizeUrl } from "../../../utils/resolveUrl";
import { extractDomain } from "../../utils/extractDomain";
import { CHAIN, ConnectItemReply, TonProofItemReplySuccess } from "@tonconnect/protocol";
import { getTimeSec } from "../../../utils/getTimeSec";
import { authParamsFromLedgerProof } from "../../../utils/holders/authParamsFromLedgerProof";
import { AccountKeyParam, fetchUserToken, TonAuthRequest, TonSolanaAuthRequest } from "../../api/holders/fetchUserToken";
import { onHoldersEnroll } from "../../effects/onHoldersEnroll";
import { handleLedgerSignError } from "../../../utils/ledger/handleLedgerSignError";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { wait } from "../../../utils/wait";

export function useHoldersLedgerEnroll({ inviteId, setConfirming }: { inviteId?: string, setConfirming?: (value: boolean) => void }) {
    const { isTestnet } = useNetwork();
    const ledgerContext = useLedgerTransport();
    const navigation = useTypedNavigation();
    const ledgerAddress = ledgerContext?.addr;
    const addressString = ledgerAddress?.address ? Address.parse(ledgerAddress.address).toString({ testOnly: isTestnet }) : undefined;
    const saveAppConnection = useSaveAppConnection();
    const connectApp = useConnectApp(addressString);
    const connectAppConnections = useAppConnections(addressString);

    return (async () => {
        if (ledgerAddress && ledgerContext?.tonTransport) {
            const tokenRes = await (async () => {
                try {
                    const storedInviteId = getInviteId();
                    const path = pathFromAccountNumber(ledgerContext!.addr!.acc, isTestnet);
                    const url = holdersUrl(isTestnet);
                    const manifestUrl = `${url}/jsons/tonconnect-manifest.json`;
                    const app = connectApp(url);
                    const connections = !!app ? connectAppConnections(extensionKey(app.url)) : [];
                    const isInjected = connections.find((item) => item?.type === TonConnectBridgeType.Injected);

                    if (inviteId || storedInviteId) {

                        //
                        // Reset holders token with every invite attempt
                        //

                        deleteHoldersToken(addressString!);
                    }

                    // 
                    // Check holders token value
                    // 

                    let existingToken = getHoldersToken(addressString!);

                    if (!!existingToken && existingToken.toString().length > 0 && isInjected) {
                        return { type: 'success' };
                    } else {
                        const contract = contractFromPublicKey(ledgerAddress.publicKey, WalletVersions.v4R2, isTestnet);
                        const initialCode = contract.init.code;
                        const initialData = contract.init.data;
                        const stateInitCell = beginCell().store(storeStateInit({ code: initialCode, data: initialData })).endCell();
                        const walletStateInit = stateInitCell.toBoc({ idx: false }).toString('base64');
                        const publicKey = ledgerAddress.publicKey.toString('hex');
                        const rawAddress = Address.parse(ledgerAddress.address).toRawString();

                        let manifest: AppManifest | null;
                        try {
                            manifest = await getAppManifest(manifestUrl);
                        } catch (error) {
                            return { type: 'error', error: HoldersEnrollErrorType.ManifestFailed };
                        }

                        if (!manifest) {
                            return { type: 'error', error: HoldersEnrollErrorType.ManifestFailed };
                        }

                        const normalizedUrl = normalizeUrl(manifest.url);
                        const domain = extractDomain(normalizedUrl ?? url);
                        const domainBuffer = Buffer.from(domain);

                        const replyItems: ConnectItemReply[] = [{
                            name: 'ton_addr',
                            address: rawAddress,
                            network: isTestnet ? CHAIN.TESTNET : CHAIN.MAINNET,
                            walletStateInit,
                            publicKey
                        }];

                        try {
                            const timestamp = getTimeSec();

                            await wait(100);
                            setConfirming?.(true);
                            const proof = await ledgerContext.tonTransport?.getAddressProof(path,
                                {
                                    domain,
                                    timestamp,
                                    payload: Buffer.from('ton-proof-any')
                                },
                                { testOnly: isTestnet }
                            );

                            if (proof) {
                                replyItems.push({
                                    name: 'ton_proof',
                                    proof: {
                                        timestamp,
                                        domain: {
                                            lengthBytes: domainBuffer.byteLength,
                                            value: domain,
                                        },
                                        signature: proof.signature.toString('base64'),
                                        payload: 'ton-proof-any',
                                    },
                                });
                            }
                        } catch (error) {
                            handleLedgerSignError({ navigation, error, ledgerContext, type: 'proof', auth: true });
                            setConfirming?.(false);
                            return { type: 'error', error: HoldersEnrollErrorType.LedgerHandled };
                        }

                        const proof = (replyItems.find((item) => item.name === 'ton_proof') as TonProofItemReplySuccess | undefined);

                        const tokenParams: TonAuthRequest = authParamsFromLedgerProof(
                            Address.parse(rawAddress),
                            proof!,
                            publicKey,
                            {
                                lengthBytes: domainBuffer.byteLength,
                                value: domain,
                            },
                            walletStateInit
                        )

                        await saveAppConnection({
                            address: addressString!,
                            app: {
                                name: manifest.name,
                                // todo: use manifest.url instead of holdersUrl on stabel static endpoint
                                // url: manifest.url,
                                url,
                                iconUrl: manifest.iconUrl,
                                autoConnectDisabled: false,
                                manifestUrl
                            },
                            connections: [{
                                type: TonConnectBridgeType.Injected,
                                replyItems
                            }]
                        });

                        const token = await fetchUserToken(tokenParams, isTestnet);
                        setHoldersToken(addressString!, token);
                    }
                    return { type: 'success' };
                } catch {
                    deleteHoldersToken(addressString!);
                    return { type: 'error', error: HoldersEnrollErrorType.FetchTokenFailed };
                }
            })();

            try {
                await onHoldersEnroll({ account: addressString!, isTestnet });
            } catch {
                console.warn(HoldersEnrollErrorType.AfterEnrollFailed);
            }

            return tokenRes as HoldersEnrollResult;
        } else {
            navigation.goBack();
            ledgerContext.onShowLedgerConnectionError();
            return { type: 'error', error: HoldersEnrollErrorType.LedgerHandled };
        }
    });
}