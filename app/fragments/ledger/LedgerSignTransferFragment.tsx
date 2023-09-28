import BN from 'bn.js';
import * as React from 'react';
import { Platform, Text, View, Alert } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Address, Cell, CellMessage, CommonMessageInfo, ExternalMessage, InternalMessage, SendMode, StateInit } from 'ton';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useRoute } from '@react-navigation/native';
import { useEngine } from '../../engine/Engine';
import { fetchConfig } from '../../engine/api/fetchConfig';
import { t } from '../../i18n/t';
import { KnownWallet, KnownWallets } from '../../secure/KnownWallets';
import { fragment } from '../../fragment';
import { ContractMetadata } from '../../engine/metadata/Metadata';
import { CloseButton } from '../../components/navigation/CloseButton';
import { parseBody } from '../../engine/transactions/parseWalletTransaction';
import { useItem } from '../../engine/persistence/PersistedItem';
import { fetchMetadata } from '../../engine/metadata/fetchMetadata';
import { resolveOperation } from '../../engine/transactions/resolveOperation';
import { JettonMasterState } from '../../engine/sync/startJettonMasterSync';
import { estimateFees } from '../../engine/estimate/estimateFees';
import { MixpanelEvent, trackEvent } from '../../analytics/mixpanel';
import { DNS_CATEGORY_WALLET, resolveDomain, validateDomain } from '../../utils/dns/dns';
import { parseMessageBody } from '../../engine/transactions/parseMessageBody';
import { LedgerOrder } from '../secure/ops/Order';
import { WalletV4Source } from 'ton-contracts';
import { TonTransport } from 'ton-ledger';
import { fetchSeqno } from '../../engine/api/fetchSeqno';
import { pathFromAccountNumber } from '../../utils/pathFromAccountNumber';
import { delay } from 'teslabot';
import { resolveLedgerPayload } from './utils/resolveLedgerPayload';
import { useLedgerTransport } from './components/LedgerTransportProvider';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useAppConfig } from '../../utils/AppConfigContext';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TransferSkeleton } from '../../components/skeletons/TransferSkeleton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { TransferSingleView } from '../secure/components/TransferSingleView';
import { fromBNWithDecimals } from '../../utils/withDecimals';
import { confirmAlert } from '../../utils/confirmAlert';
import { ReAnimatedCircularProgress } from '../../components/CircularProgress/ReAnimatedCircularProgress';

export type LedgerSignTransferParams = {
    order: LedgerOrder,
    text: string | null,
}

type ConfirmLoadedProps = {
    restricted: boolean,
    target: {
        isTestOnly: boolean;
        address: Address;
        balance: BN,
        active: boolean,
        domain?: string
    },
    text: string | null,
    order: LedgerOrder,
    jettonMaster: JettonMasterState | null,
    fees: BN,
    metadata: ContractMetadata,
    transport: TonTransport,
    addr: { acc: number, address: string, publicKey: Buffer },
};

const LedgerTransferLoaded = memo((props: ConfirmLoadedProps & ({ setTransferState: (state: 'confirm' | 'sending' | 'sent') => void })) => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const ledgerContext = useLedgerTransport();
    const account = engine.products.ledger.useAccount();
    const ledgerAddress = useMemo(() => {
        if (ledgerContext?.addr) {
            try {
                return Address.parse(ledgerContext.addr.address);
            } catch { }
        }
    }, [ledgerContext]);
    const walletSettings = engine.products.wallets.useWalletSettings(ledgerAddress);
    const {
        restricted,
        target,
        text,
        order,
        jettonMaster,
        fees,
        metadata,
        transport,
        addr,
        setTransferState
    } = props;

    // Resolve operation
    let payload = order.payload ? resolveLedgerPayload(order.payload) : null;
    let body = payload ? parseBody(payload) : null;
    let parsedBody = body && body.type === 'payload' ? parseMessageBody(body.cell, metadata.interfaces) : null;
    let operation = resolveOperation({ body: body, amount: order.amount, account: Address.parse(order.target), metadata, jettonMaster });

    // Resolve Jettion amount
    const jettonAmountString = useMemo(() => {
        try {
            if (jettonMaster && payload) {
                const temp = payload;
                if (temp) {
                    const parsing = temp.beginParse();
                    parsing.readUint(32);
                    parsing.readUint(64);
                    const unformatted = parsing.readCoins();
                    return fromBNWithDecimals(unformatted, jettonMaster.decimals);
                }
            }
        } catch { }
    }, [order]);

    // Resolve operation
    let path = pathFromAccountNumber(addr.acc, AppConfig.isTestnet);

    // Tracking
    const success = useRef(false);
    useEffect(() => {
        if (!success.current) {
            trackEvent(MixpanelEvent.TransferCancel, { target: order.target, amount: order.amount.toString(10) });
        }
    }, []);

    const friendlyTarget = target.address.toFriendly({ testOnly: AppConfig.isTestnet });
    // Contact wallets
    const contact = engine.products.settings.useContactAddress(target.address);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (KnownWallets(AppConfig.isTestnet)[friendlyTarget]) {
        known = KnownWallets(AppConfig.isTestnet)[friendlyTarget];
    } else if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }

    const isSpam = engine.products.settings.useDenyAddress(target.address);
    let spam = engine.products.serverConfig.useIsSpamWallet(friendlyTarget) || isSpam

    // Confirmation
    const doSend = useCallback(async () => {
        let value: BN = order.amount;

        // Parse address
        let address: Address = target.address;

        const contract = await contractFromPublicKey(addr.publicKey);
        const source = WalletV4Source.create({ workchain: 0, publicKey: addr.publicKey });

        try {
            // Fetch data
            const [[accountSeqno, account, targetState]] = await Promise.all([
                backoff('transfer-fetch-data', async () => {
                    let block = await backoff('ledger-lastblock', () => engine.client4.getLastBlock());
                    let seqno = await backoff('ledger-contract-seqno', () => fetchSeqno(engine.client4, block.last.seqno, contract.address));
                    return Promise.all([
                        seqno,
                        backoff('ledger-lite', () => engine.client4.getAccountLite(block.last.seqno, contract.address)),
                        backoff('ledger-target', () => engine.client4.getAccount(block.last.seqno, address))
                    ])
                }),
            ]);

            // Check bounce flag
            let bounce = true;
            if (targetState.account.state.type !== 'active' && !order.stateInit) {
                bounce = false;
                if (target.balance.lte(new BN(0))) {
                    let cont = await confirmAlert('transfer.error.addressIsNotActive');
                    if (!cont) {
                        navigation.goBack();
                        return;
                    }
                }
            }

            // Send sign request to Ledger
            let signed: Cell | null = null;
            try {
                signed = await transport.signTransaction(path, {
                    to: address!,
                    sendMode: order.amountAll
                        ? SendMode.CARRRY_ALL_REMAINING_BALANCE : SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY,
                    amount: value!,
                    seqno: accountSeqno,
                    timeout: Math.floor(Date.now() / 1e3) + 60000,
                    bounce,
                    payload: order.payload ? order.payload : undefined,
                });
            } catch (error) {
                const focused = navigation.baseNavigation().isFocused();
                Alert.alert(t('hardwareWallet.errors.transactionRejected'), undefined, [{
                    text: focused ? t('common.back') : undefined,
                    onPress: () => {
                        if (focused) {
                            navigation.goBack();
                        }
                    }
                }]);
                return;
            }

            // Sending when accepted
            let extMessage = new ExternalMessage({
                to: contract.address,
                body: new CommonMessageInfo({
                    stateInit: accountSeqno === 0 ? new StateInit({ code: source.initialCode, data: source.initialData }) : null,
                    body: new CellMessage(signed!)
                })
            });
            let msg = new Cell();
            extMessage.writeTo(msg);

            // Transfer
            await backoff('ledger-transfer', async () => {
                try {
                    setTransferState('sending');
                    await engine.client4.sendMessage(msg.toBoc({ idx: false }));
                } catch (error) {
                    console.warn(error);
                }
            });

            // Awaiting
            await backoff('tx-await', async () => {
                while (true) {
                    if (!account.account.last) {
                        return;
                    }
                    const latestStr = engine.products.ledger.getWallet(contract.address)?.transactions[0];
                    const lastBlock = await engine.client4.getLastBlock();
                    const lite = await engine.client4.getAccountLite(lastBlock.last.seqno, contract.address);

                    if (new BN(account.account.last.lt, 10).lt(new BN(latestStr ?? '0', 10))) {
                        setTransferState('sent');
                        navigation.goBack();
                        return;
                    }

                    await delay(1000);
                }
            });
        } catch (e) {
            console.warn(e);
            Alert.alert(t('hardwareWallet.errors.transferFailed'), undefined, [{
                text: t('common.back'),
                onPress: () => {
                    navigation.goBack();
                }
            }]);
        }
    }, []);

    useEffect(() => {
        // Start transfer confirmation via Ledger
        doSend();
    }, []);

    return (
        <TransferSingleView
            operation={operation}
            order={order}
            amount={order.amount}
            tonTransferAmount={order.amountAll ? (account?.balance ?? new BN(0)) : order.amount}
            jettonAmountString={jettonAmountString}
            target={target}
            fees={fees}
            jettonMaster={jettonMaster}
            // doSend={doSend}
            walletSettings={walletSettings}
            text={text}
            known={known}
            isSpam={spam}
        />
    );
});

export const LedgerSignTransferFragment = fragment(() => {
    const params: {
        order: LedgerOrder,
        text: string | null,
    } = useRoute().params! as any;

    const { Theme } = useAppConfig();
    const ledgerContext = useLedgerTransport();
    const engine = useEngine();
    const account = useItem(engine.model.wallet(engine.address));
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    // Memmoize all parameters just in case
    const from = useMemo(() => ledgerContext?.addr, []);
    const target = useMemo(() => Address.parseFriendly(params.order.target), []);
    const order = useMemo(() => params.order, []);
    const text = useMemo(() => params.text, []);

    // Fetch all required parameters
    const [loadedProps, setLoadedProps] = useState<ConfirmLoadedProps | null>(null);
    const netConfig = engine.products.config.useConfig();

    // Sign/Transfer state
    const [transferState, setTransferState] = useState<'confirm' | 'sending' | 'sent'>('confirm');

    const transferStateTitle = useMemo(() => {
        switch (transferState) {
            case 'confirm': return t('hardwareWallet.actions.confirmOnLedger');
            case 'sending': return t('hardwareWallet.actions.sending');
            case 'sent': return t('hardwareWallet.actions.sent');
        }
    }, [transferState]);

    useEffect(() => {

        // Await data
        if (!netConfig) {
            return;
        }


        let exited = false;

        backoff('transfer', async () => {
            if (!ledgerContext || !ledgerContext.ledgerConnection || !ledgerContext.tonTransport || !ledgerContext.addr) {
                return;
            }

            if (!from) {
                return;
            }

            // Confirm domain-resolved wallet address
            if (order.domain) {
                const tonDnsRootAddress = netConfig.rootDnsAddress;
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

                    const resolvedDomainWallet = await resolveDomain(engine.client4, tonDnsRootAddress, order.domain, DNS_CATEGORY_WALLET);
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

            // Get contract
            const contract = contractFromPublicKey(from.publicKey);

            // Resolve payload 
            let payload: Cell | null = order.payload ? resolveLedgerPayload(order.payload) : null;

            // Create transfer
            let intMessage = new InternalMessage({
                to: target.address,
                value: order.amount,
                bounce: false,
                body: new CommonMessageInfo({
                    stateInit: order.stateInit ? new CellMessage(order.stateInit) : null,
                    body: payload ? new CellMessage(payload) : null
                })
            });
            let transfer = await contract.createTransfer({
                seqno: account.seqno,
                walletId: contract.source.walletId,
                secretKey: null,
                sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATLY,
                order: intMessage
            });

            // Fetch data
            const [
                config,
                [metadata, state]
            ] = await Promise.all([
                backoff('transfer', () => fetchConfig()),
                backoff('transfer', async () => {
                    let block = await backoff('transfer', () => engine.client4.getLastBlock());
                    return Promise.all([
                        backoff('transfer', () => fetchMetadata(engine.client4, block.last.seqno, target.address)),
                        backoff('transfer', () => engine.client4.getAccount(block.last.seqno, target.address))
                    ])
                }),
            ])
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
                jettonMaster = engine.persistence.jettonMasters.item(metadata.jettonWallet!.master).value;
            }

            // Estimate fee
            let inMsg = new Cell();
            new ExternalMessage({
                to: contract.address,
                body: new CommonMessageInfo({
                    stateInit: account.seqno === 0 ? new StateInit({ code: contract.source.initialCode, data: contract.source.initialData }) : null,
                    body: new CellMessage(transfer)
                })
            }).writeTo(inMsg);
            let outMsg = new Cell();
            intMessage.writeTo(outMsg);
            let fees = estimateFees(netConfig!, inMsg, [outMsg], [state!.account.storageStat]);

            // Set state
            setLoadedProps({
                restricted,
                target: {
                    isTestOnly: target.isTestOnly,
                    address: target.address,
                    balance: new BN(state.account.balance.coins, 10),
                    active: state.account.state.type === 'active',
                    domain: order.domain
                },
                order,
                jettonMaster,
                fees,
                metadata,
                addr: ledgerContext.addr,
                transport: ledgerContext.tonTransport,
                text
            });
        });

        return () => {
            exited = true;
        };
    }, [netConfig]);

    return (
        <View style={{ flexGrow: 1 }}>
            <ScreenHeader
                style={{ paddingLeft: 16 }}
                statusBarStyle={Platform.select({
                    ios: 'dark',
                    android: Theme.style === 'dark' ? 'light' : 'dark'
                })}
                onBackPressed={navigation.goBack}
                onClosePressed={() => navigation.navigateAndReplaceAll('LedgerHome')}
                titleComponent={!!loadedProps && (
                    <Animated.View
                        entering={FadeInDown} exiting={FadeOutDown}
                        style={{
                            backgroundColor: Theme.border,
                            borderRadius: 100,
                            maxWidth: '70%',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingLeft: 6, paddingRight: 12,
                            paddingVertical: 6
                        }}
                    >
                        <Text style={{
                            fontSize: 17, lineHeight: 24,
                            color: Theme.textPrimary,
                            fontWeight: '500',
                            marginLeft: 6,
                            marginRight: 6,
                            minHeight: 24
                        }}>
                            {transferStateTitle}
                        </Text>
                        <ReAnimatedCircularProgress
                            size={14}
                            color={Theme.accent}
                            reverse
                            infinitRotate
                            progress={0.8}
                        />
                    </Animated.View>
                )}
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
                    <LedgerTransferLoaded
                        {...loadedProps}
                        setTransferState={setTransferState}
                    />
                )}
            </View>
            <CloseButton style={{ position: 'absolute', top: 22, right: 16 }} />
        </View>
    );
});