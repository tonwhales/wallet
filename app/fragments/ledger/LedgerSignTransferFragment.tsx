import * as React from 'react';
import { Platform, Text, View, Alert } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { backoff } from '../../utils/time';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useRoute } from '@react-navigation/native';
import { fetchConfig } from '../../engine/api/fetchConfig';
import { t } from '../../i18n/t';
import { KnownWallet, KnownWallets } from '../../secure/KnownWallets';
import { fragment } from '../../fragment';
import { ContractMetadata } from '../../engine/metadata/Metadata';
import { parseBody } from '../../engine/transactions/parseWalletTransaction';
import { fetchMetadata } from '../../engine/metadata/fetchMetadata';
import { resolveOperation } from '../../engine/transactions/resolveOperation';
import { MixpanelEvent, trackEvent } from '../../analytics/mixpanel';
import { DNS_CATEGORY_WALLET, resolveDomain, validateDomain } from '../../utils/dns/dns';
import { LedgerOrder } from '../secure/ops/Order';
import { fetchSeqno } from '../../engine/api/fetchSeqno';
import { pathFromAccountNumber } from '../../utils/pathFromAccountNumber';
import { delay } from 'teslabot';
import { resolveLedgerPayload } from './utils/resolveLedgerPayload';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TransferSkeleton } from '../../components/skeletons/TransferSkeleton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { confirmAlert } from '../../utils/confirmAlert';
import { ReAnimatedCircularProgress } from '../../components/CircularProgress/ReAnimatedCircularProgress';
import { JettonMasterState } from '../../engine/metadata/fetchJettonMasterContent';
import { TonTransport } from '@ton-community/ton-ledger';
import { useAccountLite, useClient4, useConfig, useIsSpamWallet, useNetwork, useTheme } from '../../engine/hooks';
import { useLedgerTransport } from './components/TransportContext';
import { useWalletSettings } from '../../engine/hooks/appstate/useWalletSettings';
import { fromBnWithDecimals } from '../../utils/withDecimals';
import { Address, Cell, SendMode, WalletContractV4, beginCell, external, internal, storeMessage, storeMessageRelaxed } from '@ton/ton';
import { fetchJettonMaster } from '../../engine/getters/getJettonMaster';
import { estimateFees } from '../../utils/estimateFees';
import { TransferSingleView } from '../secure/components/TransferSingleView';
import { RoundButton } from '../../components/RoundButton';
import { ScrollView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useAddressBookContext } from '../../engine/AddressBookContext';

export type LedgerSignTransferParams = {
    order: LedgerOrder,
    text: string | null,
}

type ConfirmLoadedProps = {
    restricted: boolean,
    target: {
        isTestOnly: boolean;
        address: Address;
        balance: bigint,
        active: boolean,
        domain?: string
        bounceable?: boolean
    },
    text: string | null,
    order: LedgerOrder,
    jettonMaster: JettonMasterState | null,
    fees: bigint,
    metadata: ContractMetadata,
    transport: TonTransport,
    addr: { acc: number, address: string, publicKey: Buffer },
};

const LedgerTransferLoaded = memo((props: ConfirmLoadedProps & ({ setTransferState: (state: 'confirm' | 'sending' | 'sent') => void })) => {
    const network = useNetwork();
    const client = useClient4(network.isTestnet);
    const addressBookContext = useAddressBookContext();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();
    const ledgerAddress = useMemo(() => {
        if (ledgerContext?.addr) {
            try {
                return Address.parse(ledgerContext.addr.address);
            } catch { }
        }
    }, [ledgerContext]);
    const account = useAccountLite(ledgerAddress);
    const [walletSettings,] = useWalletSettings(ledgerAddress!);

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
    // let parsedBody = body && body.type === 'payload' ? parseMessageBody(body.cell) : null;
    let operation = resolveOperation({ body: body, amount: order.amount, account: Address.parse(order.target) }, network.isTestnet);

    // Resolve Jettion amount
    const jettonAmountString = useMemo(() => {
        try {
            if (jettonMaster && payload) {
                const temp = payload;
                if (temp) {
                    const parsing = temp.beginParse();
                    parsing.loadUint(32);
                    parsing.loadUint(64);
                    const unformatted = parsing.loadCoins();
                    return fromBnWithDecimals(unformatted, jettonMaster.decimals);
                }
            }
        } catch { }
    }, [order]);

    // Resolve operation
    let path = pathFromAccountNumber(addr.acc, network.isTestnet);

    // Tracking
    const success = useRef(false);
    useEffect(() => {
        return () => {
            if (!success.current) {
                trackEvent(MixpanelEvent.TransferCancel, { target: order.target, amount: order.amount.toString(10) });
            }
        }
    }, []);

    const friendlyTarget = target.address.toString({ testOnly: network.isTestnet, bounceable: target.bounceable });
    // Contact wallets
    const contact = addressBookContext.asContact(friendlyTarget);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (KnownWallets(network.isTestnet)[friendlyTarget]) {
        known = KnownWallets(network.isTestnet)[friendlyTarget];
    } else if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }

    const isSpam = addressBookContext.isDenyAddress(friendlyTarget);
    let spam = useIsSpamWallet(friendlyTarget) || isSpam

    // Confirmation
    const doSend = useCallback(async () => {
        let value: bigint = order.amount;

        // Parse address
        let address: Address = target.address;

        const contract = await contractFromPublicKey(addr.publicKey);
        const source = WalletContractV4.create({ workchain: 0, publicKey: addr.publicKey });

        try {
            // Fetch data
            const [[accountSeqno, account, targetState]] = await Promise.all([
                backoff('transfer-fetch-data', async () => {
                    let block = await backoff('ledger-lastblock', () => client.getLastBlock());
                    let seqno = await backoff('ledger-contract-seqno', () => fetchSeqno(client, block.last.seqno, contract.address));
                    return Promise.all([
                        seqno,
                        backoff('ledger-lite', () => client.getAccountLite(block.last.seqno, contract.address)),
                        backoff('ledger-target', () => client.getAccount(block.last.seqno, address))
                    ])
                }),
            ]);

            // Check bounce flag
            let bounce = true;
            if (targetState.account.state.type !== 'active' && !order.stateInit) {
                bounce = false;
                if (target.balance <= 0n) {
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
                        ? SendMode.CARRY_ALL_REMAINING_BALANCE : SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATELY,
                    amount: value!,
                    seqno: accountSeqno,
                    timeout: Math.floor(Date.now() / 1e3) + 60000,
                    bounce,
                    payload: order.payload ? order.payload : undefined,
                });
            } catch (error) {
                if (error instanceof Error && error.name === 'LockedDeviceError') {
                    Alert.alert(t('hardwareWallet.unlockLedgerDescription'));
                    return;
                }
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
            let extMessage = external({
                to: contract.address,
                body: signed,
                init: accountSeqno === 0 ? source.init : null
            });

            let msg = beginCell().store(storeMessage(extMessage)).endCell();

            // Transfer
            await backoff('ledger-transfer', async () => {
                try {
                    setTransferState('sending');
                    await client.sendMessage(msg.toBoc({ idx: false }));
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
                    const lastBlock = await client.getLastBlock();
                    const lite = await client.getAccountLite(lastBlock.last.seqno, contract.address);

                    if (BigInt(account.account.last.lt) < BigInt(lite.account.last?.lt || '0')) {
                        setTransferState('sent');
                        navigation.popToTop();
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

    return (
        <View style={{ flexGrow: 1 }}>
            <ScrollView
                style={{ flexBasis: 0 }}
                contentContainerStyle={{ paddingBottom: 56 }}
            >
                <TransferSingleView
                    metadata={metadata}
                    operation={operation}
                    order={order}
                    amount={order.amountAll ? (account?.balance ?? 0n) : order.amount}
                    jettonAmountString={jettonAmountString}
                    target={target}
                    fees={fees}
                    jettonMaster={jettonMaster}
                    walletSettings={walletSettings}
                    text={text}
                    known={known}
                    isSpam={spam}
                    isLedger
                />
            </ScrollView>
            <RoundButton
                action={doSend}
                title={t('hardwareWallet.actions.confirmOnLedger')}
                style={{ marginHorizontal: 16, marginBottom: 16 }}
            />
        </View>
    );
});

export const LedgerSignTransferFragment = fragment(() => {
    const params: {
        order: LedgerOrder,
        text: string | null,
    } = useRoute().params! as any;

    const theme = useTheme();
    const network = useNetwork();
    const client = useClient4(network.isTestnet);
    const ledgerContext = useLedgerTransport();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    // Memmoize all parameters just in case
    const from = useMemo(() => ledgerContext?.addr, []);
    const target = useMemo(() => Address.parseFriendly(params.order.target), []);
    const order = useMemo(() => params.order, []);
    const text = useMemo(() => params.text, []);

    // Fetch all required parameters
    const [loadedProps, setLoadedProps] = useState<ConfirmLoadedProps | null>(null);
    const netConfig = useConfig();

    // Sign/Transfer state
    const [transferState, setTransferState] = useState<'confirm' | 'sending' | 'sent' | null>(null);

    const transferStateTitle = useMemo(() => {
        switch (transferState) {
            case 'confirm': return t('hardwareWallet.actions.confirmOnLedger');
            case 'sending': return t('hardwareWallet.actions.sending');
            case 'sent': return t('hardwareWallet.actions.sent');
            default: return '';
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
                const tonDnsRootAddress = Address.parse(netConfig.rootDnsAddress);
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

                    domain = domain.toLowerCase();

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
                        || !(resolvedDomainWallet as Address).equals(target!.address)
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
            let intMessage = internal({
                to: target.address,
                value: order.amount,
                bounce: false,
                body: payload
            });

            let block = await backoff('transfer', () => client.getLastBlock());
            let seqno = await backoff('transfer', async () => fetchSeqno(client, block.last.seqno, contract.address));
            let transfer = contract.createTransfer({
                seqno: seqno,
                secretKey: Buffer.alloc(64),
                sendMode: SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATELY,
                messages: [intMessage]
            });

            // Fetch data
            const [
                config,
                [metadata, state]
            ] = await Promise.all([
                backoff('transfer', () => fetchConfig()),
                backoff('transfer', async () => {
                    return Promise.all([
                        backoff('transfer', () => fetchMetadata(client, block.last.seqno, target.address, network.isTestnet, true)),
                        backoff('transfer', () => client.getAccount(block.last.seqno, target.address))
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
                jettonMaster = await fetchJettonMaster(metadata.jettonWallet!.master, network.isTestnet);
            }

            // Estimate fee
            let inMsgExt = external({
                to: contract.address,
                body: transfer,
                init: seqno === 0 ? contract.init : null
            });

            let inMsg = beginCell().store(storeMessage(inMsgExt)).endCell();


            let fees = estimateFees(netConfig!, inMsg, [beginCell().store(storeMessageRelaxed(intMessage)).endCell()], [state!.account.storageStat]);

            // Set state
            setLoadedProps({
                restricted,
                target: {
                    isTestOnly: target.isTestOnly,
                    address: target.address,
                    balance: BigInt(state.account.balance.coins),
                    active: state.account.state.type === 'active',
                    domain: order.domain,
                    bounceable: target.isBounceable
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
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark', ios: 'light' })} />
            <ScreenHeader
                style={[{ paddingLeft: 16 }, Platform.select({ android: { paddingTop: safeArea.top } })]}
                onBackPressed={navigation.goBack}
                titleComponent={!!loadedProps && !!transferState && (
                    <Animated.View
                        entering={FadeInDown} exiting={FadeOutDown}
                        style={{
                            backgroundColor: theme.border,
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
                            color: theme.textPrimary,
                            fontWeight: '500',
                            marginLeft: 6,
                            marginRight: 6,
                            minHeight: 24
                        }}>
                            {transferStateTitle}
                        </Text>
                        <ReAnimatedCircularProgress
                            size={14}
                            color={theme.accent}
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
        </View>
    );
});