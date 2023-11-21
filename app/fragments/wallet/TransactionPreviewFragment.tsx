import React, { useCallback, useEffect, useMemo } from "react";
import { View, Platform, Text, Pressable, ScrollView, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { getAppState } from "../../storage/appState";
import { useParams } from "../../utils/useParams";
import { ValueComponent } from "../../components/ValueComponent";
import { formatDate, formatTime } from "../../utils/dates";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Avatar } from "../../components/Avatar";
import { t } from "../../i18n/t";
import { KnownJettonMasters, KnownWallet, KnownWallets } from "../../secure/KnownWallets";
import { RoundButton } from "../../components/RoundButton";
import { PriceComponent } from "../../components/PriceComponent";
import { openWithInApp } from "../../utils/openWithInApp";
import { copyText } from "../../utils/copyText";
import * as ScreenCapture from 'expo-screen-capture';
import { ToastDuration, useToaster } from '../../components/toast/ToastProvider';
import { ScreenHeader } from "../../components/ScreenHeader";
import { ItemGroup } from "../../components/ItemGroup";
import { AddressComponent } from "../../components/address/AddressComponent";
import { AboutIconButton } from "../../components/AboutIconButton";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useContact, useDenyAddress, useDontShowComments, useIsSpamWallet, useNetwork, useSelectedAccount, useSpamMinAmount, useTheme } from "../../engine/hooks";
import { useRoute } from "@react-navigation/native";
import { useWalletSettings } from "../../engine/hooks/appstate/useWalletSettings";
import { StoredTxBody, TransactionDescription } from "../../engine/types";
import { BigMath } from "../../utils/BigMath";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { Address, fromNano } from "@ton/core";
import { StatusBar } from "expo-status-bar";

export const TransactionPreviewFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const route = useRoute();
    const isLedger = route.name === 'LedgerTransactionPreview';
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount()!;
    const toaster = useToaster();
    const ledgerContext = useLedgerTransport();
    const address = useMemo(() => {
        if (isLedger && !!ledgerContext?.addr?.address) {
            try {
                return Address.parse(ledgerContext.addr.address);
            } catch {
                return null;
            }
        } else {
            return selected.address;
        }
    }, [ledgerContext?.addr?.address, selected]);

    const { showActionSheetWithOptions } = useActionSheet();

    const [walletSettings,] = useWalletSettings(address);

    const params = useParams<{ transaction: TransactionDescription }>();
    let transaction = params.transaction;
    let operation = transaction.base.operation;

    let friendlyAddress = transaction.base.parsed.resolvedAddress;
    let item = transaction.base.operation.items[0];
    let jetton = transaction.masterMetadata;
    let op: string;
    if (transaction.op) {
        op = transaction.op;
        if (op === 'airdrop') {
            op = t('tx.airdrop');
        }
    } else {
        if (transaction.base.parsed.kind === 'out') {
            if (transaction.base.parsed.status === 'pending') {
                op = t('tx.sending');
            } else {
                op = t('tx.sent');
            }
        } else if (transaction.base.parsed.kind === 'in') {
            if (transaction.base.parsed.bounced) {
                op = '⚠️ ' + t('tx.bounced');
            } else {
                op = t('tx.received');
            }
        } else {
            throw Error('Unknown kind');
        }
    }

    const verified = !!transaction.verified
        || !!KnownJettonMasters(isTestnet)[friendlyAddress];

    let body: StoredTxBody | null = transaction.base.parsed.body;

    const txId = useMemo(() => {
        if (!transaction.base.lt) {
            return null;
        }
        if (!transaction.base.hash) {
            return null;
        }
        return transaction.base.lt +
            '_' +
            transaction.base.hash
    }, [transaction]);

    const tonhubLink = useMemo(() => {
        if (!txId) {
            return null;
        }
        return `${isTestnet ? 'https://test.tonhub.com' : 'https://tonhub.com'}/share/tx/`
            + `${selected.addressString}/`
            + `${transaction.base.lt}_${encodeURIComponent(transaction.base.hash)}`
    }, [txId]);

    const contact = useContact(friendlyAddress);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (KnownWallets(isTestnet)[friendlyAddress]) {
        known = KnownWallets(isTestnet)[friendlyAddress];
    } else if (operation.op) {
        known = { name: t(operation.op.res, operation.op.options) };
    } else if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }

    const [spamMinAmount,] = useSpamMinAmount();
    const [dontShowComments,] = useDontShowComments();
    const isSpam = useDenyAddress(friendlyAddress);

    let spam = useIsSpamWallet(friendlyAddress)
        || isSpam
        || (
            BigMath.abs(BigInt(transaction.base.parsed.amount)) < spamMinAmount
            && transaction.base.parsed.body?.type === 'comment'
            && !KnownWallets(isTestnet)[friendlyAddress]
            && !isTestnet
        ) && transaction.base.parsed.kind !== 'out';

    const participants = useMemo(() => {
        const appState = getAppState();
        const index = isLedger
            ? 'Ledger'
            : `${appState.addresses.findIndex((a) => address?.equals(a.address)) + 1}`;
        if (transaction.base.parsed.kind === 'out') {
            return {
                from: {
                    address: address,
                    name: walletSettings?.name || `${t('common.wallet')} ${index}`
                },
                to: {
                    address: Address.parse(operation.address),
                    name: known?.name
                }
            }
        }

        return {
            from: {
                address: Address.parse(operation.address),
                name: known?.name
            },
            to: {
                address: address,
                name: walletSettings?.name || `${t('common.wallet')} ${index}`
            }
        }
    }, [operation, walletSettings, transaction]);

    const onCopy = useCallback((text: string) => {
        copyText(text);
    }, []);

    const onTxIdPress = useCallback(() => {
        if (!tonhubLink) {
            return;
        }
        const options = [
            t('common.cancel'),
            t('txActions.view'),
            t('common.copy'),
            t('common.share')
        ];
        const cancelButtonIndex = 0;

        showActionSheetWithOptions({
            title: t('common.tx'),
            message: (txId?.slice(0, 6) + '...' + txId?.slice(-4)) || undefined,
            options,
            cancelButtonIndex,
        }, (selectedIndex?: number) => {
            switch (selectedIndex) {
                case 1:
                    openWithInApp(tonhubLink);
                    break;
                case 2:
                    onCopy(tonhubLink);
                    toaster.show(
                        {
                            message: t('common.copiedAlert'),
                            type: 'default',
                            duration: ToastDuration.SHORT,
                        }
                    );
                    break;
                case 3:
                    if (Platform.OS === 'ios') {
                        Share.share({ title: t('receive.share.title'), url: tonhubLink });
                    } else {
                        Share.share({ title: t('receive.share.title'), message: tonhubLink });
                    }
                    break;
                case cancelButtonIndex:
                // Canceled
                default:
                    break;
            }
        });
    }, [tonhubLink]);

    const onCopyAddress = useCallback((address: Address) => {
        onCopy(address.toString({ testOnly: isTestnet }));
        toaster.show(
            {
                message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
                type: 'default',
                duration: ToastDuration.SHORT,
            }
        );
    }, []);

    useEffect(() => {
        let subscription: ScreenCapture.Subscription;
        if (Platform.OS === 'ios') {
            subscription = ScreenCapture.addScreenshotListener(() => {
                if (!tonhubLink) {
                    return;
                }
                Share.share({ title: t('txActions.share.transaction'), url: tonhubLink });
            });
        }
        return () => subscription?.remove();
    }, [tonhubLink]);

    return (
        <View style={{
            alignSelf: 'stretch', flexGrow: 1, flexBasis: 0,
            alignItems: 'center',
            paddingTop: Platform.OS === 'android' ? safeArea.top + 24 : undefined,
        }}>
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark' })} />
            <ScreenHeader
                onClosePressed={navigation.goBack}
            />
            <ScrollView
                style={{ flexGrow: 1, alignSelf: 'stretch', }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                automaticallyAdjustContentInsets={false}
            >
                <View style={{
                    backgroundColor: theme.surfaceOnElevation,
                    borderRadius: 20,
                    padding: 20,
                    width: '100%',
                    overflow: 'hidden',
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <View style={{ backgroundColor: theme.divider, position: 'absolute', top: 0, left: 0, right: 0, height: 54 }} />
                    <Avatar
                        size={68}
                        id={friendlyAddress}
                        address={friendlyAddress}
                        image={transaction.icon ? transaction.icon : undefined}
                        spam={spam}
                        showSpambadge
                        verified={verified}
                        borderWith={2}
                        borderColor={theme.surfaceOnElevation}
                        backgroundColor={theme.backgroundPrimary}
                    />
                    <Text
                        style={{
                            color: theme.textPrimary,
                            fontWeight: '600',
                            fontSize: 17,
                            marginTop: 8,
                            marginBottom: 12,
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {op}
                    </Text>
                    {transaction.base.parsed.status === 'failed' ? (
                        <Text style={{
                            color: theme.accentRed,
                            fontWeight: '800',
                            fontSize: 38
                        }}>
                            {t('tx.failed')}
                        </Text>
                    ) : (
                        <>
                            <Text
                                style={{
                                    color: BigInt(item.amount) > 0
                                        ? theme.accentGreen
                                        : theme.textPrimary,
                                    fontWeight: '800',
                                    fontSize: 38,
                                }}
                            >
                                {BigInt(item.amount) > 0 && '+'}
                                <ValueComponent
                                    value={item.amount}
                                    decimals={item.kind === 'token' && jetton ? jetton.decimals : undefined}
                                    precision={3}
                                />
                                <Text style={{ fontSize: 32 }}>
                                    {item.kind === 'token' && jetton
                                        ? ' ' + jetton.symbol
                                        : ' TON'
                                    }
                                </Text>
                            </Text>
                            {item.kind === 'ton' && (
                                <PriceComponent
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0,
                                        alignSelf: 'center',
                                        paddingVertical: 0,
                                        height: 'auto'
                                    }}
                                    textStyle={{ color: theme.textSecondary, fontWeight: '400', fontSize: 17 }}
                                    amount={BigInt(item.amount)}
                                />
                            )}
                        </>
                    )}
                </View>
                <Text style={{ color: theme.textSecondary, fontSize: 13, marginVertical: 8, alignSelf: 'center' }}>
                    {`${formatDate(transaction.base.time, 'dd.MM.yyyy')} ${formatTime(transaction.base.time)}`}
                </Text>
                <ItemGroup style={{ marginBottom: 16 }}>
                    {!!participants.from.address && (
                        <Pressable
                            onPress={() => onCopyAddress(participants.from.address!)}
                            style={({ pressed }) => ({ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center', opacity: pressed ? 0.5 : 1 })}
                        >
                            <Text style={{
                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                color: theme.textSecondary,
                            }}>
                                {t('common.from')}
                            </Text>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                    <AddressComponent address={participants.from.address} end={4} />
                                </Text>
                                {!!participants.from.name && (
                                    <Text
                                        style={{
                                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                                            color: theme.textSecondary,
                                            flexShrink: 1
                                        }}
                                        numberOfLines={1}
                                        ellipsizeMode={'tail'}
                                    >
                                        {participants.from.name}
                                    </Text>
                                )}
                            </View>
                        </Pressable>
                    )}
                    {!!participants.to.address && (
                        <>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                            <Pressable
                                onPress={() => onCopyAddress(participants.to.address!)}
                                style={({ pressed }) => ({ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center', opacity: pressed ? 0.5 : 1 })}
                            >
                                <Text style={{
                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                    color: theme.textSecondary,
                                }}>
                                    {t('common.to')}
                                </Text>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                        <AddressComponent address={participants.to.address} end={4} />
                                    </Text>
                                    {!!participants.to.name && (
                                        <Text
                                            style={{
                                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                                color: theme.textSecondary,
                                                flexShrink: 1
                                            }}
                                            numberOfLines={1}
                                            ellipsizeMode={'tail'}
                                        >
                                            {participants.to.name}
                                        </Text>
                                    )}
                                </View>
                            </Pressable>
                        </>
                    )}

                    {txId && (
                        <>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                            <Pressable
                                onPress={onTxIdPress}
                                style={({ pressed }) => ({ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center', opacity: pressed ? 0.5 : 1 })}
                            >
                                <Text style={{
                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                    color: theme.textSecondary,
                                }}>
                                    {t('common.tx')}
                                </Text>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                        {txId.slice(0, 6) + '...' + txId.slice(txId.length - 4)}
                                    </Text>
                                </View>
                            </Pressable>
                        </>
                    )}
                    {!(dontShowComments && isSpam) && (!!operation.comment) && (
                        <>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                            <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                                <Text style={{
                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                    color: theme.textSecondary,
                                }}>
                                    {t('common.message')}
                                </Text>
                                <View style={{ alignItems: 'flex-start' }}>
                                    <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                        {operation.comment}
                                    </Text>
                                </View>
                            </View>
                        </>
                    )}
                </ItemGroup>
                <ItemGroup style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 10 }}>
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 15,
                            color: theme.textSecondary
                        }}>
                            {t('txPreview.blockchainFee')}
                            <View style={{ height: 16, width: 16 + 6, alignItems: 'flex-end' }}>
                                <AboutIconButton
                                    title={t('txPreview.blockchainFee')}
                                    description={t('txPreview.blockchainFeeDescription')}
                                    style={{ height: 16, width: 16, position: 'absolute', top: 2, right: 0, left: 6, bottom: 0 }}
                                />
                            </View>
                        </Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 17,
                                lineHeight: 20,
                                color: theme.textPrimary,
                            }}>
                                {fromNano(transaction.base.fees) + ' TON'}
                            </Text>
                            <PriceComponent
                                amount={BigInt(transaction.base.fees)}
                                style={{
                                    backgroundColor: theme.transparent,
                                    paddingHorizontal: 0,
                                    paddingVertical: 0,
                                    height: 'auto',
                                    paddingLeft: 0,
                                    alignSelf: 'flex-end'
                                }}
                                textStyle={{ color: theme.textSecondary, fontSize: 15, fontWeight: '400' }}
                            />
                        </View>
                    </View>
                </ItemGroup>
            </ScrollView>
            {transaction.base.parsed.kind === 'out' && (transaction.base.parsed.body?.type !== 'payload') && !isLedger && (
                <View style={{ flexDirection: 'row', width: '100%', marginBottom: safeArea.bottom + 16, paddingHorizontal: 16 }}>
                    <RoundButton
                        title={t('txPreview.sendAgain')}
                        style={{ flexGrow: 1 }}
                        onPress={() => navigation.navigateSimpleTransfer({
                            target: transaction.base.parsed.resolvedAddress,
                            comment: transaction.base.parsed.body && transaction.base.parsed.body.type === 'comment' ? transaction.base.parsed.body.comment : null,
                            amount: BigInt(transaction.base.parsed.amount) > 0n ? BigInt(transaction.base.parsed.amount) : -BigInt(transaction.base.parsed.amount),
                            job: null,
                            stateInit: null,
                            jetton: null,
                            callback: null
                        })}
                        display={'secondary'}
                    />
                </View>
            )}
        </View>
    );
});