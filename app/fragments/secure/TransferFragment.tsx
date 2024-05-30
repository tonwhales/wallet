import * as React from 'react';
import { Platform, View, Alert } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useRoute } from '@react-navigation/native';
import { getCurrentAddress } from '../../storage/appState';
import { fetchConfig } from '../../engine/api/fetchConfig';
import { t } from '../../i18n/t';
import { fragment } from '../../fragment';
import { ContractMetadata } from '../../engine/metadata/Metadata';
import { Order } from './ops/Order';
import { fetchMetadata } from '../../engine/metadata/fetchMetadata';
import { DNS_CATEGORY_WALLET, resolveDomain, validateDomain } from '../../utils/dns/dns';
import { TransferSingle } from './components/TransferSingle';
import { TransferBatch } from './components/TransferBatch';
import { parseBody } from '../../engine/transactions/parseWalletTransaction';
import { ScreenHeader } from '../../components/ScreenHeader';
import { TransferSkeleton } from '../../components/skeletons/TransferSkeleton';
import { useEffect, useMemo, useState } from 'react';
import { useBounceableWalletFormat, useClient4, useCommitCommand, useConfig, useNetwork, useSelectedAccount, useTheme } from '../../engine/hooks';
import { fetchSeqno } from '../../engine/api/fetchSeqno';
import { OperationType } from '../../engine/transactions/parseMessageBody';
import { Address, Cell, MessageRelaxed, loadStateInit, comment, internal, external, SendMode, storeMessage, storeMessageRelaxed, CommonMessageInfoRelaxedInternal } from '@ton/core';
import { getLastBlock } from '../../engine/accountWatcher';
import { estimateFees } from '../../utils/estimateFees';
import { internalFromSignRawMessage } from '../../utils/internalFromSignRawMessage';
import { StatusBar } from 'expo-status-bar';
import { resolveBounceableTag } from '../../utils/resolveBounceableTag';

export type TransferFragmentProps = {
    text: string | null,
    order: Order,
    job: string | null,
    callback?: ((ok: boolean, result: Cell | null) => void) | null,
    back?: number
};

export type OrderMessage = {
    addr: {
        address: Address;
        balance: bigint,
        active: boolean,
        bounceable?: boolean,
    },
    metadata: ContractMetadata,
    restricted: boolean,
    amount: bigint,
    amountAll: boolean,
    payload: Cell | null,
    stateInit: Cell | null,
}

export type ConfirmLoadedPropsSingle = {
    type: 'single',
    target: {
        isTestOnly: boolean;
        address: Address;
        balance: bigint,
        active: boolean,
        domain?: string,
        bounceable?: boolean
    },
    jettonTarget?: {
        isTestOnly: boolean;
        bounceable?: boolean;
        address: Address;
        balance: bigint;
        active: boolean;
        domain?: string | undefined;
    },
    text: string | null,
    order: Order,
    job: string | null,
    fees: bigint,
    metadata: ContractMetadata,
    restricted: boolean,
    callback: ((ok: boolean, result: Cell | null) => void) | null
    back?: number
}

export type ConfirmLoadedPropsBatch = {
    type: 'batch',
    text: string | null,
    job: string | null,
    order: {
        messages: OrderMessage[],
        app?: {
            domain: string,
            title: string,
            url: string
        }
    },
    fees: bigint,
    callback: ((ok: boolean, result: Cell | null) => void) | null,
    back?: number,
    totalAmount: bigint
};


export type ConfirmLoadedProps = ConfirmLoadedPropsSingle | ConfirmLoadedPropsBatch;

const TransferLoaded = React.memo((props: ConfirmLoadedProps) => {
    if (props.type === 'single') {
        return <TransferSingle {...props} />
    }

    return <TransferBatch {...props} />;
});

export const TransferFragment = fragment(() => {
    const { isTestnet } = useNetwork();
    const theme = useTheme();
    const params: TransferFragmentProps = useRoute().params! as any;
    const selectedAccount = useSelectedAccount();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const client = useClient4(isTestnet);
    const commitCommand = useCommitCommand();
    const [bounceableFormat,] = useBounceableWalletFormat();

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
                let target = Address.parseFriendly(params.order.messages[0].target);

                // Fetch data
                const [
                    config,
                    [metadata, state, seqno]
                ] = await Promise.all([
                    backoff('transfer', () => fetchConfig()),
                    backoff('transfer', async () => {
                        let block = await backoff('transfer', () => client.getLastBlock());
                        return Promise.all([
                            backoff('transfer', () => fetchMetadata(client, block.last.seqno, target.address, isTestnet, true)),
                            backoff('transfer', () => client.getAccount(block.last.seqno, target.address)),
                            backoff('transfer', () => fetchSeqno(client, block.last.seqno, target.address))
                        ])
                    }),
                ]);

                let jettonTarget: typeof target | null = null;
                let jettonTargetState: typeof state | null = null;

                // Read jetton master
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
                                    let queryId = sc.loadUint(64);
                                    let amount = sc.loadCoins();
                                    let jettonTargetAddress = sc.loadAddress();

                                    if (jettonTargetAddress) {
                                        const bounceable = await resolveBounceableTag(jettonTargetAddress, { testOnly: isTestnet, bounceableFormat });
                                        jettonTarget = Address.parseFriendly(jettonTargetAddress.toString({ testOnly: isTestnet, bounceable }));
                                    }
                                }
                            }
                        }
                    }
                }

                if (jettonTarget) {
                    let block = await backoff('transfer', () => client.getLastBlock());
                    jettonTargetState = await backoff('transfer', () => client.getAccount(block.last.seqno, target.address));
                }

                if (order.domain) {
                    try {
                        const tonZoneMatch = order.domain.match(/\.ton$/);
                        const tMeZoneMatch = order.domain.match(/\.t\.me$/);
                        let zone: string | null = null;
                        let domain: string | null = null;
                        if (tonZoneMatch || tMeZoneMatch) {
                            zone = tonZoneMatch ? '.ton' : '.t.me';
                            domain = zone === '.ton'
                                ? order.domain.slice(0, order.domain.length - 4)
                                : order.domain.slice(0, order.domain.length - 5)
                        }

                        if (!domain) {
                            throw Error('Invalid domain');
                        }

                        domain = domain.toLowerCase();

                        const valid = validateDomain(domain);
                        if (!valid) {
                            throw Error('Invalid domain');
                        }

                        const resolvedDomainWallet = await resolveDomain(client, tonDnsRootAddress, order.domain, DNS_CATEGORY_WALLET);
                        if (!resolvedDomainWallet) {
                            throw Error('Error resolving domain wallet');
                        }

                        if (!resolvedDomainWallet) {
                            throw Error('Error resolving domain wallet');
                        }

                        if (
                            !resolvedDomainWallet
                            || !Address.isAddress(resolvedDomainWallet)
                            || (
                                !!jettonTarget
                                    ? !resolvedDomainWallet.equals(jettonTarget.address)
                                    : !resolvedDomainWallet.equals(target!.address)
                            )
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
                        bounceable: target.isBounceable,
                        balance: BigInt(state.account.balance.coins),
                        active: state.account.state.type === 'active',
                        domain: order.domain,
                    },
                    jettonTarget: !!jettonTarget ? {
                        isTestOnly: jettonTarget.isTestOnly,
                        bounceable: jettonTarget.isBounceable,
                        address: jettonTarget.address,
                        balance: BigInt(jettonTargetState!.account.balance.coins),
                        active: jettonTargetState!.account.state.type === 'active',
                        domain: order.domain
                    } : undefined,
                    order,
                    text,
                    job,
                    fees,
                    metadata,
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
            const storageStats: ({
                lastPaid: number;
                duePayment: string | null;
                used: {
                    bits: number;
                    cells: number;
                    publicCells: number;
                }
            } | null)[] = [];
            const inMsgs: MessageRelaxed[] = [];
            const messages: OrderMessage[] = [];
            let totalAmount = BigInt(0);
            for (let i = 0; i < order.messages.length; i++) {

                let parsedDestFriendly: { isBounceable: boolean; isTestOnly: boolean; address: Address; } | undefined;
                try {
                    parsedDestFriendly = Address.parseFriendly(order.messages[i].target)
                } catch { }

                const msg = internalFromSignRawMessage(order.messages[i]);
                if (msg) {
                    inMsgs.push(msg);

                    if (!Address.isAddress(msg.info.dest)) {
                        continue;
                    }

                    const to = msg.info.dest as Address;

                    // Fetch data
                    const [metadata, state] = await Promise.all([
                        backoff('transfer', () => fetchMetadata(client, block.last.seqno, to, isTestnet, true)),
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
                            bounceable: parsedDestFriendly?.isBounceable
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
    }, [netConfig, selectedAccount, bounceableFormat]);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark', ios: 'light' })} />
            <ScreenHeader
                style={[{ paddingLeft: 16 }, Platform.select({ android: { paddingTop: safeArea.top } })]}
                onBackPressed={navigation.goBack}
                onClosePressed={() => navigation.navigateAndReplaceAll('Home')}
            />
            <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>
                {!loadedProps ? (
                    <View style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    }}>
                        <View style={{ flexGrow: 1, alignItems: 'center' }}>
                            <TransferSkeleton />
                        </View>
                    </View>
                ) : (
                    <TransferLoaded {...loadedProps} />
                )}
            </View>
        </View>
    );
});