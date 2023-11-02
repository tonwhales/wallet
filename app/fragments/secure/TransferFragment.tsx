import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, View, Alert, Text } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Address, Cell, CommonMessageInfoRelaxedInternal, MessageRelaxed, SendMode, comment, external, fromNano, internal, loadStateInit, storeMessage, storeMessageRelaxed } from '@ton/core';
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
import { useConfig } from '../../engine/hooks';
import { useClient4 } from '../../engine/hooks';
import { fetchJettonMaster } from '../../engine/getters/getJettonMaster';
import { useNetwork } from '../../engine/hooks';
import { useSelectedAccount } from '../../engine/hooks';
import { fetchSeqno } from '../../engine/api/fetchSeqno';
import { JettonMasterState } from '../../engine/metadata/fetchJettonMasterContent';
import { useCommitCommand } from '../../engine/hooks';
import { memo, useEffect, useMemo, useState } from 'react';
import { OperationType } from '../../engine/transactions/parseMessageBody';
import { getLastBlock } from '../../engine/accountWatcher';
import { parseBody } from '../../engine/transactions/parseWalletTransaction';
import { estimateFees } from '../../utils/estimateFees';
import { internalFromSignRawMessage } from '../../utils/internalFromSignRawMessage';

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
        balance: bigint,
        active: boolean,
        domain?: string
    },
    text: string | null,
    order: Order,
    job: string | null,
    fees: bigint,
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
                balance: bigint,
                active: boolean
            },
            metadata: ContractMetadata,
            restricted: boolean,
            amount: bigint,
            amountAll: boolean,
            payload: Cell | null,
            stateInit: Cell | null,
        }[],
        app?: {
            domain: string,
            title: string
        }
    },
    fees: bigint,
    callback: ((ok: boolean, result: Cell | null) => void) | null,
    back?: number,
    totalAmount: bigint
};

const TransferLoaded = memo((props: ConfirmLoadedProps) => {
    if (props.type === 'single') {
        return <TransferSingle {...props} />
    }
    return (
        <View>
            <Text>
                {fromNano(props.fees)}
            </Text>
        </View>
    );

    // return <TransferBatch {...props} />;
});

export const TransferFragment = fragment(() => {
    const { isTestnet } = useNetwork();
    const params: TransferFragmentProps = useRoute().params! as any;
    const selectedAccount = useSelectedAccount();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const client = useClient4(isTestnet);
    const commitCommand = useCommitCommand();

    // Memmoize all parameters just in case
    const from = useMemo(() => getCurrentAddress(), []);
    const text = useMemo(() => params.text, []);
    const order = useMemo(() => params.order, []);
    const job = useMemo(() => params.job, []);
    const callback = useMemo(() => params.callback, []);

    // Auto-cancel job on unmount
    useEffect(() => {
        return () => {
            if (params && params.job) {
                commitCommand(false, params.job, new Cell());
            }
            if (params && params.callback) {
                params.callback(false, null);
            }
        }
    }, []);

    // Fetch all required parameters
    const [loadedProps, setLoadedProps] = useState<ConfirmLoadedProps | null>(null);
    const netConfig = useConfig();
    useEffect(() => {

        // Await data
        if (!netConfig) {
            return;
        }

        let exited = false;

        backoff('transfer', async () => {
            // Get contract
            const contract = contractFromPublicKey(from.publicKey);
            const tonDnsRootAddress = Address.parse(netConfig.rootDnsAddress);

            const emptySecret = Buffer.alloc(64);

            if (order.messages.length === 1) {
                let target = Address.parseFriendly(
                    Address.parse(params.order.messages[0].target).toString({ testOnly: isTestnet })
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
                ]);

                const internalStateInit = order.messages[0].stateInit
                    ? loadStateInit(order.messages[0].stateInit.asSlice())
                    : null;

                const body = order.messages[0].payload
                    ? order.messages[0].payload
                    : comment(text || '');

                // Create transfer
                let intMessage = internal({
                    to: target.address,
                    value: order.messages[0].amount,
                    bounce: false,
                    init: internalStateInit,
                    body,
                });

                const accSeqno = await backoff('transfer-seqno', async () => fetchSeqno(client, await getLastBlock(), contract.address));

                let transfer = contract.createTransfer({
                    seqno: accSeqno,
                    secretKey: emptySecret,
                    sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATELY,
                    messages: [intMessage]
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
                            if (sc.remainingBits > 32) {
                                let op = sc.loadUint(32);
                                // Jetton transfer op
                                if (op === OperationType.JettonTransfer) {
                                    jettonMaster = await fetchJettonMaster(metadata.jettonWallet!.master, isTestnet);
                                }
                            }
                        }
                    }
                }

                const externalMessage = external({
                    to: contract.address,
                    body: transfer,
                    init: seqno === 0 ? contract.init : null
                });

                let inMsg = new Cell().asBuilder();
                storeMessage(externalMessage)(inMsg);

                let outMsg = new Cell().asBuilder();
                storeMessageRelaxed(intMessage)(outMsg);

                let fees = estimateFees(netConfig!, inMsg.endCell(), [outMsg.endCell()], [state!.account.storageStat]);

                // Set state
                setLoadedProps({
                    type: 'single',
                    restricted,
                    target: {
                        isTestOnly: target.isTestOnly,
                        address: target.address,
                        balance: BigInt(state.account.balance.coins),
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
            const inMsgs: MessageRelaxed[] = [];
            const messages = [];
            let totalAmount = BigInt(0);
            for (let i = 0; i < order.messages.length; i++) {
                const msg = internalFromSignRawMessage(order.messages[i]);
                if (msg) {
                    inMsgs.push(msg);

                    if (!Address.isAddress(msg.info.dest)) {
                        continue;
                    }

                    const to = msg.info.dest as Address;

                    // Fetch data
                    const [metadata, state] = await Promise.all([
                        backoff('transfer', () => fetchMetadata(client, block.last.seqno, to)),
                        backoff('transfer', () => client.getAccount(block.last.seqno, to))
                    ]);

                    storageStats.push(state!.account.storageStat);

                    // Check if wallet is restricted
                    let restricted = false;
                    for (let r of config.wallets.restrict_send) {
                        if (Address.parse(r).equals(to)) {
                            restricted = true;
                            break;
                        }
                    }
                    let outMsg = new Cell().asBuilder();
                    storeMessageRelaxed(msg)(outMsg);

                    outMsgs.push(outMsg.endCell());
                    totalAmount = totalAmount + (msg.info as CommonMessageInfoRelaxedInternal).value.coins;

                    messages.push({
                        ...order.messages[i],
                        metadata,
                        restricted,
                        addr: {
                            address: to,
                            balance: BigInt(state.account.balance.coins),
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

                    if (params && params.job) {
                        commitCommand(false, params.job, new Cell());
                    }
                    if (params && params.callback) {
                        params.callback(false, null);
                    }
                    return;
                }

            }

            // Create transfer
            const accountSeqno = await fetchSeqno(client, block.last.seqno, contract.address);
            let transfer = await contract.createTransfer({
                seqno: accountSeqno,
                secretKey: emptySecret,
                sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATELY,
                messages: inMsgs
            });

            const externalMessage = external({
                to: contract.address,
                body: transfer,
                init: accountSeqno === 0 ? contract.init : null
            });

            // Estimate fee
            let inMsg = new Cell().asBuilder();
            storeMessage(externalMessage)(inMsg);

            let fees = estimateFees(netConfig!, inMsg.endCell(), outMsgs, storageStats);

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
    }, [netConfig, selectedAccount]);

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