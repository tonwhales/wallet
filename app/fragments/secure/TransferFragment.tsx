import * as React from 'react';
import { Platform, View, Alert, Linking, BackHandler } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { backoff, backoffFailaible } from '../../utils/time';
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
import { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBounceableWalletFormat, useClient4, useConfig, useNetwork, useSelectedAccount, useTheme } from '../../engine/hooks';
import { fetchSeqno } from '../../engine/api/fetchSeqno';
import { OperationType } from '../../engine/transactions/parseMessageBody';
import { Address, Cell, MessageRelaxed, loadStateInit, comment, internal, external, SendMode, storeMessage, storeMessageRelaxed, CommonMessageInfoRelaxedInternal, beginCell, toNano } from '@ton/core';
import { estimateFees } from '../../utils/estimateFees';
import { internalFromSignRawMessage } from '../../utils/internalFromSignRawMessage';
import { StatusBar } from 'expo-status-bar';
import { resolveBounceableTag } from '../../utils/resolveBounceableTag';
import { ReturnStrategy } from '../../engine/tonconnect/types';
import Minimizer from '../../modules/Minimizer';
import { warn } from '../../utils/log';
import { clearLastReturnStrategy } from '../../engine/tonconnect/utils';
import { parseAnyStringAddress } from '../../utils/parseAnyStringAddress';
import { useWalletVersion } from '../../engine/hooks/useWalletVersion';
import { WalletContractV4, WalletContractV5R1 } from '@ton/ton';
import { useGaslessConfig } from '../../engine/hooks/jettons/useGaslessConfig';
import { fetchGaslessEstimate, GaslessEstimate } from '../../engine/api/gasless/fetchGaslessEstimate';
import { getQueryData } from '../../engine/utils/getQueryData';
import { queryClient } from '../../engine/clients';
import { Queries } from '../../engine/queries';
import { JettonMasterState } from '../../engine/metadata/fetchJettonMasterContent';
import { toBnWithDecimals } from '../../utils/withDecimals';
import { updateTargetAmount } from '../../utils/gasless/updateTargetAmount';
import { MintlessJetton } from '../../engine/api/fetchMintlessHints';

export type TransferRequestSource = { type: 'tonconnect', returnStrategy?: ReturnStrategy | null }

export type TransferFragmentProps = {
    source?: TransferRequestSource
    text: string | null,
    order: Order,
    callback?: ((ok: boolean, result: Cell | null) => void) | null,
    back?: number,
    useGasless?: boolean
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

export type TransferEstimate = {
    type: 'ton', value: bigint
} | {
    type: 'gasless', value: bigint, tonFees: bigint,
    params: GaslessEstimate
}

export type TransferTarget = {
    isTestOnly: boolean;
    address: Address;
    balance: bigint,
    active: boolean,
    domain?: string | undefined,
    bounceable?: boolean
}

export type ConfirmLoadedPropsSingle = {
    type: 'single',
    source?: TransferRequestSource
    target: TransferTarget,
    jettonTarget?: TransferTarget,
    text: string | null,
    order: Order,
    fees: TransferEstimate,
    metadata: ContractMetadata,
    restricted: boolean,
    callback: ((ok: boolean, result: Cell | null) => void) | null,
    back?: number,
    useGasless: boolean,
    onSetUseGasless?: (useGasless: boolean) => void
}

export type ConfirmLoadedPropsBatch = {
    type: 'batch',
    source?: TransferRequestSource
    text: string | null,
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

const Skeleton = memo(() => {
    return (
        <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        }}>
            <View style={{ flexGrow: 1, alignItems: 'center' }}>
                <TransferSkeleton />
            </View>
        </View>
    );
});

const TransferLoaded = memo((props: ConfirmLoadedProps) => {

    return (
        <Suspense fallback={<Skeleton />}>
            {props.type === 'single' ? (
                <TransferSingle {...props} />
            ) : (
                <TransferBatch {...props} />
            )}
        </Suspense>
    );
});

export const TransferFragment = fragment(() => {
    const { isTestnet } = useNetwork();
    const theme = useTheme();
    const params: TransferFragmentProps = useRoute().params! as any;
    const selectedAccount = useSelectedAccount();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const client = useClient4(isTestnet);
    const walletVersion = useWalletVersion();
    const gaslessConfig = useGaslessConfig();
    const netConfig = useConfig();
    const [bounceableFormat] = useBounceableWalletFormat();

    // Memmoize all parameters just in case
    const from = useMemo(() => getCurrentAddress(), []);
    const text = useMemo(() => params.text, []);
    const order = useMemo(() => params.order, []);
    const callback = useMemo(() => params.callback, []);

    const [useGasless, setUseGasless] = useState(params.useGasless ?? false);

    const handleReturnStrategy = useCallback((returnStrategy: string) => {
        if (returnStrategy === 'back') {
            Minimizer.goBack();
        } else if (returnStrategy !== 'none') {
            try {
                const url = new URL(decodeURIComponent(returnStrategy));
                Linking.openURL(url.toString());
            } catch {
                warn('Failed to open url');
            }
        }
        clearLastReturnStrategy();
    }, []);

    const finished = useRef(false);

    // Auto-cancel job on unmount
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (!params.source || !params.source.returnStrategy) {
                return false;
            }

            const returnStrategy = params.source.returnStrategy;

            // close modal
            navigation.goBack();

            // resolve return strategy
            if (!!returnStrategy) {
                handleReturnStrategy(returnStrategy);
            }

            return true;
        });

        return () => {
            finished.current = true;
            backHandler.remove();

            if (params && params.callback) {
                params.callback(false, null);
            }
        }
    }, []);

    // Fetch all required parameters
    const [loadedProps, setLoadedProps] = useState<ConfirmLoadedProps | null>(null);

    const onError = useCallback(({ message, title, gaslessEstimate }: { message?: string, title: string, gaslessEstimate?: boolean }) => {
        if (finished.current) {
            return;
        }

        finished.current = true;

        if (gaslessEstimate) {
            Alert.alert(title, message,
                [{
                    text: t('common.back'),
                    onPress: () => {
                        if (params.back && params.back > 0) {
                            for (let i = 0; i < params.back; i++) {
                                navigation.goBack();
                            }
                        } else {
                            navigation.goBack();
                        }
                    }
                },
                {
                    text: t('transfer.error.gaslessCooldownPayTon'),
                    onPress: () => onSetUseGasless?.(false)
                }]
            );

            return;
        }

        Alert.alert(title, message,
            [{
                text: t('common.back'),
                onPress: () => {
                    if (params.back && params.back > 0) {
                        for (let i = 0; i < params.back; i++) {
                            navigation.goBack();
                        }
                    } else {
                        navigation.goBack();
                    }
                }
            }]
        );

    }, []);

    const onSetUseGasless = useCallback((useGasless: boolean) => {
        finished.current = false;
        setUseGasless(useGasless);
    }, []);

    useEffect(() => {
        // Await data
        if (!netConfig) {
            return;
        }

        backoff('txLoad', async () => {
            if (finished.current) {
                return;
            }

            setLoadedProps(null);

            // Get contract
            const contract = contractFromPublicKey(from.publicKey, walletVersion, isTestnet);
            const isV5 = walletVersion === 'v5R1';
            const tonDnsRootAddress = Address.parse(netConfig.rootDnsAddress);

            const emptySecret = Buffer.alloc(64);

            const block = await backoff('txLoad-blc', () => client.getLastBlock());

            //
            // Single transfer
            //
            if (order.messages.length === 1) {
                let target: {
                    isBounceable: boolean;
                    isTestOnly: boolean;
                    address: Address;
                };

                try {
                    target = parseAnyStringAddress(params.order.messages[0].target, isTestnet);
                } catch {
                    onError({
                        title: t('transfer.error.invalidAddress'),
                        message: t('transfer.error.invalidAddressMessage')
                    });
                    return;
                }

                // Fetch data
                const [config, metadata, state, seqno] = await Promise.all([
                    backoff('txLoad-conf', () => fetchConfig()),
                    backoff('txLoad-meta', () => fetchMetadata(client, block.last.seqno, target.address, isTestnet, true)),
                    backoff('txLoad-acc', () => client.getAccount(block.last.seqno, target.address)),
                    backoff('txLoad-seqno', () => fetchSeqno(client, block.last.seqno, target.address))
                ]);

                let jettonTransfer: {
                    queryId: number | bigint;
                    amount: bigint;
                    destination: {
                        isBounceable: boolean;
                        isTestOnly: boolean;
                        address: Address;
                    };
                    responseDestination: Address | null;
                    customPayload: Cell | null;
                    stateInit: Cell | null;
                    forwardTonAmount: bigint;
                    forwardPayload: Cell | null;
                    jettonWallet: Address;
                } | null = null;
                let jettonTargetState: typeof state | null = null;
                let jettonTarget: typeof target | null = null;

                // check if its a mintless jetton 
                const queryCache = queryClient.getQueryCache();
                const address = selectedAccount!.address.toString({ testOnly: isTestnet }) || '';
                const mintlessJettons = getQueryData<MintlessJetton[]>(queryCache, Queries.Mintless(address));
                const mintlessJetton = mintlessJettons?.find(j => Address.parse(j.walletAddress.address).equals(target.address));

                if (!!mintlessJetton) {
                    metadata.jettonWallet = {
                        balance: BigInt(mintlessJetton.balance),
                        owner: selectedAccount!.address,
                        master: Address.parse(mintlessJetton.jetton.address),
                        address: target.address
                    };
                }

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
                                    let queryId = sc.loadUintBig(64);
                                    let jettonAmount = sc.loadCoins();
                                    let jettonTargetAddress = sc.loadAddress();
                                    let responseDestination = sc.loadMaybeAddress();
                                    let customPayload = sc.loadBit() ? sc.loadRef() : null;
                                    let forwardTonAmount = sc.loadCoins();
                                    let forwardPayload = null;
                                    if (sc.remainingBits > 0) {
                                        forwardPayload = sc.loadMaybeRef() ?? sc.asCell();
                                    }

                                    const destination = Address.parseFriendly(jettonTargetAddress.toString({ testOnly: isTestnet, bounceable: bounceableFormat }));

                                    jettonTransfer = {
                                        queryId,
                                        amount: jettonAmount,
                                        destination,
                                        responseDestination,
                                        customPayload,
                                        forwardTonAmount,
                                        forwardPayload,
                                        jettonWallet: metadata.jettonWallet.address,
                                        stateInit: order.messages[0].stateInit
                                    }

                                    if (jettonTargetAddress) {
                                        const bounceable = await resolveBounceableTag(jettonTargetAddress, { testOnly: isTestnet, bounceableFormat });
                                        jettonTarget = Address.parseFriendly(jettonTargetAddress.toString({ testOnly: isTestnet, bounceable }));
                                    }
                                }
                            }
                        }
                    }
                }

                if (!!jettonTarget) {
                    jettonTargetState = await backoff('txLoad-jts', () => client.getAccount(block.last.seqno, jettonTarget!.address));
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
                    } catch {
                        onError({ title: t('transfer.error.invalidDomain') });
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

                const accSeqno = await backoff('txLoad-seqno', async () => fetchSeqno(client, block.last.seqno, contract.address));

                const transferParams = {
                    seqno: accSeqno,
                    secretKey: emptySecret,
                    sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATELY,
                    messages: [intMessage]
                }

                let transfer = isV5
                    ? (contract as WalletContractV5R1).createTransfer(transferParams)
                    : (contract as WalletContractV4).createTransfer(transferParams);

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

                const tonEstimate = estimateFees(netConfig!, inMsg.endCell(), [outMsg.endCell()], [state!.account.storageStat]);

                let fees: TransferEstimate = {
                    type: 'ton',
                    value: tonEstimate
                }

                const gaslessMasters = gaslessConfig
                    .data
                    ?.gas_jettons
                    .map(j => {
                        try {
                            return Address.parse(j.master_id);
                        } catch (error) {
                            return null;
                        }
                    }).filter(a => !!a) as Address[] || [];

                const master = metadata.jettonWallet?.master
                const isGaslessSupported = (master && isV5)
                    ? gaslessMasters.some(a => a.equals(master))
                    : false;
                let relayerAddress;

                if (gaslessConfig.data?.relay_address) {
                    try {
                        relayerAddress = Address.parse(gaslessConfig.data.relay_address)
                    } catch { }
                }

                if (!!jettonTransfer && isGaslessSupported && useGasless) {
                    const masterContentKey = Queries.Jettons().MasterContent(master!.toString({ testOnly: isTestnet }));
                    const masterData = getQueryData<(JettonMasterState & { address: string }) | null>(queryClient.getQueryCache(), masterContentKey);
                    // default is 6 to account for USDT
                    // for other gasless jettons is negligible 
                    //(relay fee is higher is higher than the minimal amount by many orders of magnitude)
                    const decimals = masterData?.decimals ?? 6;
                    // adjust amount to account for gasless fee bug, TODO: remove this when the bug is fixed
                    const minimalAmountString = `${decimals > 0 ? 0 : 1}.${'0'.repeat(decimals - 1)}1`;
                    const minimalAmount = toBnWithDecimals(minimalAmountString, decimals);
                    const adjustedAmount = jettonTransfer.amount - minimalAmount;

                    const tetherTransferPayload = beginCell()
                        .storeUint(OperationType.JettonTransfer, 32)
                        .storeUint(0, 64)
                        .storeCoins(adjustedAmount)
                        .storeAddress(jettonTransfer.destination.address) // receiver address 
                        .storeAddress(relayerAddress) // excesses address
                        .storeMaybeRef(jettonTransfer.customPayload) // custom payload
                        .storeCoins(1n) // forward transfers count in nanoton
                        .storeMaybeRef(jettonTransfer.forwardPayload) // forward payload
                        .endCell();

                    const messageToEstimate = beginCell()
                        .storeWritable(
                            storeMessageRelaxed(
                                internal({
                                    to: jettonTransfer.jettonWallet,
                                    bounce: true,
                                    value: toNano('0.05') + tonEstimate,
                                    body: tetherTransferPayload,
                                    init: jettonTransfer.stateInit ? loadStateInit(jettonTransfer.stateInit.asSlice()) : null
                                })
                            )
                        )
                        .endCell();

                    try {
                        const gaslessEstimate = await backoffFailaible('txLoad-gasless', () => fetchGaslessEstimate(
                            metadata.jettonWallet?.master!,
                            isTestnet,
                            {
                                wallet_address: contract.address.toRawString(),
                                wallet_public_key: from.publicKey.toString('hex'),
                                messages: [{ boc: messageToEstimate.toBoc({ idx: false }).toString('hex') }]
                            }
                        ));

                        if (!gaslessEstimate.ok) {
                            if (gaslessEstimate.error === 'not-enough') {
                                onError({
                                    title: t('transfer.error.gaslessNotEnoughFunds'),
                                    message: t('transfer.error.gaslessNotEnoughFundsMessage'),
                                    gaslessEstimate: true
                                });
                            } else if (gaslessEstimate.error === 'try-later') {
                                onError({
                                    title: t('transfer.error.gaslessTryLater'),
                                    message: t('transfer.error.gaslessTryLaterMessage'),
                                    gaslessEstimate: true
                                });
                            } else {
                                warn(`Gasless estimate failed: ${gaslessEstimate.error}`);
                                onError({
                                    title: t('transfer.error.gaslessFailed'),
                                    message: t('transfer.error.gaslessFailedEstimate'),
                                    gaslessEstimate: true
                                });
                            }
                            return;
                        }

                        gaslessEstimate.messages = updateTargetAmount({
                            amount: jettonTransfer.amount,
                            messages: gaslessEstimate.messages,
                            relayerAddress: relayerAddress!,
                            targetAddress: jettonTransfer.destination.address,
                            walletAddress: jettonTransfer.jettonWallet,
                            isTestnet,
                            adjustEstimateAmount: minimalAmount,
                            owner: selectedAccount!.address
                        });

                        fees = {
                            type: 'gasless',
                            value: BigInt(gaslessEstimate.commission),
                            params: gaslessEstimate,
                            tonFees: tonEstimate
                        }
                    } catch {
                        onError({
                            title: t('transfer.error.gaslessFailed'),
                            message: t('transfer.error.gaslessFailedMessage')
                        });
                        return;
                    }
                }

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
                    fees,
                    metadata,
                    callback: callback ? callback : null,
                    back: params.back,
                    useGasless,
                    onSetUseGasless
                });
                return;
            }

            //
            // Batch transfer
            //
            const config = await backoff('txLoad-cfg', () => fetchConfig());

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
                        backoff(`txLoad-meta${i}`, () => fetchMetadata(client, block.last.seqno, to, isTestnet, true)),
                        backoff(`txLoad-acc${i}`, () => client.getAccount(block.last.seqno, to))
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
                    onError({
                        title: t('transfer.error.invalidTransaction'),
                        message: t('transfer.error.invalidTransactionMessage')
                    });

                    if (params && params.callback) {
                        params.callback(false, null);
                    }
                    return;
                }

            }

            // Create transfer
            const accountSeqno = await backoff('txLoad-seqno', async () => fetchSeqno(client, block.last.seqno, contract.address));

            const transferParams = {
                seqno: accountSeqno,
                secretKey: emptySecret,
                sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATELY,
                messages: inMsgs
            }

            let transfer = isV5
                ? (contract as WalletContractV5R1).createTransfer(transferParams)
                : (contract as WalletContractV4).createTransfer(transferParams);

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
                fees,
                callback: callback ? callback : null,
                back: params.back,
                totalAmount,
            });
        });
    }, [netConfig, selectedAccount, bounceableFormat, gaslessConfig.data, walletVersion, useGasless]);

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