import BN from 'bn.js';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, View, Alert } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Address, Cell, CellMessage, CommentMessage, CommonMessageInfo, ExternalMessage, fromNano, InternalMessage, parseSupportedMessage, resolveKnownInterface, SendMode, StateInit } from 'ton';
import { AndroidToolbar } from '../../components/topbar/AndroidToolbar';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useRoute } from '@react-navigation/native';
import { getCurrentAddress } from '../../storage/appState';
import { fetchConfig } from '../../engine/api/fetchConfig';
import { t } from '../../i18n/t';
import { fragment } from '../../fragment';
import { ContractMetadata } from '../../engine/metadata/Metadata';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { CloseButton } from '../../components/CloseButton';
import { Order } from './ops/Order';
import { fetchMetadata } from '../../engine/metadata/fetchMetadata';
import { DNS_CATEGORY_WALLET, resolveDomain, validateDomain } from '../../utils/dns/dns';
import { TransferSingle } from './components/TransferSingle';
import { TransferBatch } from './components/TransferBatch';
import { useConfig } from '../../engine/hooks/useConfig';
import { JettonMasterState } from '../../engine/legacy/sync/startJettonMasterSync';
import { useClient4 } from '../../engine/hooks/useClient4';
import { getJettonMaster } from '../../engine/getters/getJettonMaster';
import { parseBody } from '../../engine/legacy/transactions/parseWalletTransaction';
import { estimateFees } from '../../engine/legacy/estimate/estimateFees';
import { createWalletTransferV4, internalFromSignRawMessage } from '../../engine/legacy/utils/createWalletTransferV4';
import { useNetwork } from '../../engine/hooks/useNetwork';
import { useAccountLite } from '../../engine/hooks/useAccountLite';
import { useSelectedAccount } from '../../engine/hooks/useSelectedAccount';
import { fetchSeqno } from '../../engine/api/fetchSeqno';

export type ATextInputRef = {
    focus: () => void;
}

export type TransferFragmentProps = {
    text: string | null,
    order: Order,
    job: string | null,
    callback?: ((ok: boolean, result: Cell | null) => void) | null,
    back?: number
};

export type ConfirmLoadedProps = {
    type: 'single',
    target: {
        isTestOnly: boolean;
        address: Address;
        balance: BN,
        active: boolean,
        domain?: string
    },
    text: string | null,
    order: Order,
    job: string | null,
    fees: BN,
    metadata: ContractMetadata,
    restricted: boolean,
    jettonMaster: JettonMasterState | null
    callback: ((ok: boolean, result: Cell | null) => void) | null
    back?: number
} | {
    type: 'batch',
    text: string | null,
    job: string | null,
    order: {
        messages: {
            addr: {
                address: Address;
                balance: BN,
                active: boolean
            },
            metadata: ContractMetadata,
            restricted: boolean,
            amount: BN,
            amountAll: boolean,
            payload: Cell | null,
            stateInit: Cell | null,
        }[],
        app?: {
            domain: string,
            title: string
        }
    },
    fees: BN,
    callback: ((ok: boolean, result: Cell | null) => void) | null,
    back?: number,
    totalAmount: BN
};

const TransferLoaded = React.memo((props: ConfirmLoadedProps) => {
    if (props.type === 'single') {
        return <TransferSingle {...props} />
    }

    return <TransferBatch {...props} />;
});

export const TransferFragment = fragment(() => {
    const { isTestnet } = useNetwork();
    const params: TransferFragmentProps = useRoute().params! as any;
    let account = useSelectedAccount();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const client = useClient4(isTestnet);

    // Memmoize all parameters just in case
    const from = React.useMemo(() => getCurrentAddress(), []);
    const text = React.useMemo(() => params.text, []);
    const order = React.useMemo(() => params.order, []);
    const job = React.useMemo(() => params.job, []);
    const callback = React.useMemo(() => params.callback, []);

    // Auto-cancel job on unmount
    React.useEffect(() => {
        // return () => {
        //     if (params && params.job) {
        //         engine.products.apps.commitCommand(false, params.job, new Cell());
        //     }
        //     if (params && params.callback) {
        //         params.callback(false, null);
        //     }
        // }
    }, []);

    // Fetch all required parameters
    const [loadedProps, setLoadedProps] = React.useState<ConfirmLoadedProps | null>(null);
    const netConfig = useConfig();
    React.useEffect(() => {

        // Await data
        if (!netConfig) {
            return;
        }

        let exited = false;

        backoff('transfer', async () => {
            // Get contract
            const contract = contractFromPublicKey(from.publicKey);
            const tonDnsRootAddress = netConfig.rootDnsAddress;

            if (order.messages.length === 1) {
                let target = Address.parseFriendly(
                    Address.parse(params.order.messages[0].target).toFriendly({ testOnly: isTestnet })
                );

                if (order.domain) {
                    try {
                        const tonZoneMatch = order.domain.match(/\.ton$/);
                        const tMeZoneMatch = order.domain.match(/\.t\.me$/);
                        let zone = null;
                        let domain = null;
                        if (tonZoneMatch || tMeZoneMatch) {
                            zone = tonZoneMatch ? '.ton' : '.t.me';
                            domain = zone === '.ton'
                                ? order.domain.slice(0, order.domain.length - 4)
                                : order.domain.slice(0, order.domain.length - 5)
                        }

                        if (!domain) {
                            throw Error('Invalid domain');
                        }

                        const valid = validateDomain(domain);
                        if (!valid) {
                            throw Error('Invalid domain');
                        }

                        const resolvedDomainWallet = await resolveDomain(client, tonDnsRootAddress, order.domain, DNS_CATEGORY_WALLET);
                        if (!resolvedDomainWallet) {
                            throw Error('Error resolving domain wallet');
                        }

                        if (
                            !resolvedDomainWallet
                            || !Address.isAddress(resolvedDomainWallet)
                            || !resolvedDomainWallet.equals(target!.address)
                        ) {
                            throw Error('Error resolving wallet address');
                        }
                    } catch (e) {
                        Alert.alert(t('transfer.error.invalidDomain'), undefined, [{
                            text: t('common.close'),
                            onPress: () => navigation.goBack()
                        }]);
                        return;
                    }
                }

                // Fetch data
                const [
                    config,
                    [metadata, state, seqno]
                ] = await Promise.all([
                    backoff('transfer', () => fetchConfig()),
                    backoff('transfer', async () => {
                        let block = await backoff('transfer', () => client.getLastBlock());
                        return Promise.all([
                            backoff('transfer', () => fetchMetadata(client, block.last.seqno, target.address)),
                            backoff('transfer', () => client.getAccount(block.last.seqno, target.address)),
                            backoff('transfer', () => fetchSeqno(client, block.last.seqno, target.address))
                        ])
                    }),
                ])
                // Create transfer
                let intMessage = new InternalMessage({
                    to: target.address,
                    value: order.messages[0].amount,
                    bounce: false,
                    body: new CommonMessageInfo({
                        stateInit: order.messages[0].stateInit ? new CellMessage(order.messages[0].stateInit) : null,
                        body: order.messages[0].payload ? new CellMessage(order.messages[0].payload) : new CommentMessage(text || '')
                    })
                });
                let transfer = await contract.createTransfer({
                    seqno,
                    walletId: contract.source.walletId,
                    secretKey: null,
                    sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY,
                    order: intMessage
                });


                if (exited) {
                    return;
                }

                // Check if wallet is restricted
                let restricted = false;
                for (let r of config.wallets.restrict_send) {
                    if (Address.parse(r).equals(target.address)) {
                        restricted = true;
                        break;
                    }
                }

                // Read jetton master
                let jettonMaster: JettonMasterState | null = null;
                if (metadata.jettonWallet) {
                    let body = order.messages[0].payload ? parseBody(order.messages[0].payload) : null;
                    if (body && body.type === 'payload') {
                        const temp = order.messages[0].payload;
                        let sc = temp?.beginParse();
                        if (sc) {
                            if (sc.remaining > 32) {
                                let op = sc.readUintNumber(32);
                                // Jetton transfer op
                                if (op === 0xf8a7ea5) {
                                    jettonMaster = getJettonMaster(metadata.jettonWallet!.master);
                                }
                            }
                        }
                    }
                }

                // Estimate fee
                let inMsg = new Cell();
                new ExternalMessage({
                    to: contract.address,
                    body: new CommonMessageInfo({
                        stateInit: seqno === 0 ? new StateInit({ code: contract.source.initialCode, data: contract.source.initialData }) : null,
                        body: new CellMessage(transfer)
                    })
                }).writeTo(inMsg);
                let outMsg = new Cell();
                intMessage.writeTo(outMsg);
                let fees = estimateFees(netConfig!, inMsg, [outMsg], [state!.account.storageStat]);

                // Set state
                setLoadedProps({
                    type: 'single',
                    restricted,
                    target: {
                        isTestOnly: target.isTestOnly,
                        address: target.address,
                        balance: new BN(state.account.balance.coins, 10),
                        active: state.account.state.type === 'active',
                        domain: order.domain
                    },
                    order,
                    text,
                    job,
                    fees,
                    metadata,
                    jettonMaster,
                    callback: callback ? callback : null,
                    back: params.back
                });
                return;
            }

            if (exited) {
                return;
            }

            const block = await backoff('transfer', () => client.getLastBlock());
            const config = await backoff('transfer', () => fetchConfig());

            const outMsgs: Cell[] = [];
            const storageStats = [];
            const inMsgs: InternalMessage[] = [];
            const messages = [];
            let totalAmount = new BN(0);
            for (let i = 0; i < order.messages.length; i++) {
                const msg = internalFromSignRawMessage(order.messages[i]);
                if (msg) {
                    inMsgs.push(msg);
                    // Fetch data
                    const [metadata, state] = await Promise.all([
                        backoff('transfer', () => fetchMetadata(client, block.last.seqno, msg.to)),
                        backoff('transfer', () => client.getAccount(block.last.seqno, msg.to))
                    ]);

                    storageStats.push(state!.account.storageStat);

                    // Check if wallet is restricted
                    let restricted = false;
                    for (let r of config.wallets.restrict_send) {
                        if (Address.parse(r).equals(msg.to)) {
                            restricted = true;
                            break;
                        }
                    }
                    let outMsg = new Cell();
                    msg.writeTo(outMsg);
                    outMsgs.push(outMsg);
                    totalAmount = totalAmount.add(msg.value);

                    messages.push({
                        ...order.messages[i],
                        metadata,
                        restricted,
                        addr: {
                            address: msg.to,
                            balance: new BN(state.account.balance.coins, 10),
                            active: state.account.state.type === 'active',
                        },
                    });
                } else {
                    Alert.alert(t('transfer.error.invalidTransaction'), undefined, [{
                        text: t('common.back'),
                        onPress: () => {
                            if (params.back && params.back > 0) {
                                for (let i = 0; i < params.back; i++) {
                                    navigation.goBack();
                                }
                            } else {
                                navigation.popToTop();
                            }
                        }
                    }]);
                    exited = true;
                    // TODO:
                    // if (params && params.job) {
                    //     engine.products.apps.commitCommand(false, params.job, new Cell());
                    // }
                    if (params && params.callback) {
                        params.callback(false, null);
                    }
                    return;
                }

            }

            // Create transfer
            let transfer = await createWalletTransferV4({
                seqno: account.seqno,
                walletId: contract.source.walletId,
                secretKey: null,
                sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY,
                messages: inMsgs
            });

            // Estimate fee
            let inMsg = new Cell();
            new ExternalMessage({
                to: contract.address,
                body: new CommonMessageInfo({
                    stateInit: account.seqno === 0 ? new StateInit({ code: contract.source.initialCode, data: contract.source.initialData }) : null,
                    body: new CellMessage(transfer)
                })
            }).writeTo(inMsg);

            let fees = estimateFees(netConfig!, inMsg, outMsgs, storageStats);

            // Set state
            setLoadedProps({
                type: 'batch',
                order: { messages, app: order.app },
                text,
                job,
                fees,
                callback: callback ? callback : null,
                back: params.back,
                totalAmount,
            });

        });

        return () => {
            exited = true;
        };
    }, [netConfig, account]);

    return (
        <>
            <AndroidToolbar style={{ marginTop: safeArea.top }} pageTitle={t('transfer.confirmTitle')} />
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <View style={{ flexGrow: 1, flexBasis: 0, paddingBottom: safeArea.bottom }}>
                {!loadedProps && (<View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}><LoadingIndicator simple={true} /></View>)}
                {!!loadedProps && <TransferLoaded {...loadedProps} />}
            </View>
            {
                Platform.OS === 'ios' && (
                    <CloseButton
                        style={{ position: 'absolute', top: 12, right: 10 }}
                        onPress={() => {
                            navigation.goBack();
                        }}
                    />
                )
            }
        </>
    );
});