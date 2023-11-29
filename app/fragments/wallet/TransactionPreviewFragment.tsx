import React, { useCallback, useEffect, useMemo } from "react";
import { View, Platform, Text, Pressable, ScrollView, Share, Image } from "react-native";
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
import { useAppState, useContact, useDenyAddress, useDontShowComments, useIsSpamWallet, useNetwork, usePrice, useSelectedAccount, useSpamMinAmount, useTheme } from "../../engine/hooks";
import { useRoute } from "@react-navigation/native";
import { useWalletSettings } from "../../engine/hooks/appstate/useWalletSettings";
import { TransactionDescription } from "../../engine/types";
import { BigMath } from "../../utils/BigMath";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { Address, fromNano } from "@ton/core";
import { StatusBar } from "expo-status-bar";
import { formatCurrency } from "../../utils/formatCurrency";

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
    const appState = useAppState();
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
    const [price, currency] = usePrice();

    const params = useParams<{ transaction: TransactionDescription }>();
    const tx = params.transaction;
    const operation = tx.base.operation;
    const kind = tx.base.parsed.kind;
    const item = operation.items[0];
    const opAddress = item.kind === 'token' ? operation.address : tx.base.parsed.resolvedAddress;
    const fees = BigInt(tx.base.fees);
    let dateStr = `${formatDate(tx.base.time, 'MMMM dd, yyyy')} • ${formatTime(tx.base.time)}`;
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    const isOwn = appState.addresses.findIndex((a) => a.addressString === opAddress) >= 0;

    const feesPrise = useMemo(() => {
        if (!price) {
            return undefined;
        }

        const isNeg = fees < 0n;
        const abs = isNeg ? -fees : fees;

        return formatCurrency(
            (parseFloat(fromNano(abs)) * price.price.usd * price.price.rates[currency]).toFixed(3),
            currency,
            isNeg
        );
    }, [price, currency, fees]);


    let jetton = tx.masterMetadata;
    let op: string;
    if (tx.op) {
        op = tx.op;
        if (op === 'airdrop') {
            op = t('tx.airdrop');
        }
    } else {
        if (tx.base.parsed.kind === 'out') {
            if (tx.base.parsed.status === 'pending') {
                op = t('tx.sending');
            } else {
                op = t('tx.sent');
            }
        } else if (tx.base.parsed.kind === 'in') {
            if (tx.base.parsed.bounced) {
                op = t('tx.bounced');
            } else {
                op = t('tx.received');
            }
        } else {
            throw Error('Unknown kind');
        }
    }

    const verified = !!tx.verified
        || !!KnownJettonMasters(isTestnet)[opAddress];

    const txId = useMemo(() => {
        if (!tx.base.lt) {
            return null;
        }
        if (!tx.base.hash) {
            return null;
        }
        return tx.base.lt +
            '_' +
            tx.base.hash
    }, [tx]);

    const tonhubLink = useMemo(() => {
        if (!txId) {
            return null;
        }
        return `${isTestnet ? 'https://test.tonhub.com' : 'https://tonhub.com'}/share/tx/`
            + `${selected.addressString}/`
            + `${tx.base.lt}_${encodeURIComponent(tx.base.hash)}`
    }, [txId]);

    const contact = useContact(opAddress);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (KnownWallets(isTestnet)[opAddress]) {
        known = KnownWallets(isTestnet)[opAddress];
    }
    if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }

    const [spamMinAmount,] = useSpamMinAmount();
    const [dontShowComments,] = useDontShowComments();
    const isSpam = useDenyAddress(opAddress);

    let spam = useIsSpamWallet(opAddress)
        || isSpam
        || (
            BigMath.abs(BigInt(tx.base.parsed.amount)) < spamMinAmount
            && tx.base.parsed.body?.type === 'comment'
            && !KnownWallets(isTestnet)[opAddress]
            && !isTestnet
        ) && tx.base.parsed.kind !== 'out';

    const participants = useMemo(() => {
        const appState = getAppState();
        const index = isLedger
            ? 'Ledger'
            : `${appState.addresses.findIndex((a) => address?.equals(a.address)) + 1}`;
        if (tx.base.parsed.kind === 'out') {
            return {
                from: {
                    address: address,
                    name: walletSettings?.name || `${t('common.wallet')} ${index}`
                },
                to: {
                    address: Address.parse(opAddress),
                    name: known?.name
                }
            }
        }

        return {
            from: {
                address: Address.parse(opAddress),
                name: known?.name
            },
            to: {
                address: address,
                name: walletSettings?.name || `${t('common.wallet')} ${index}`
            }
        }
    }, [opAddress, walletSettings, tx, known]);

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
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })}
            />
            <ScreenHeader
                onClosePressed={navigation.goBack}
                title={dateStr}
                titleStyle={{
                    fontWeight: '400', fontSize: 15, lineHeight: 20,
                }}
            />
            <ScrollView
                style={{ flexGrow: 1, alignSelf: 'stretch', marginTop: 16 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                automaticallyAdjustContentInsets={false}
                contentInset={{ bottom: safeArea.bottom + 16 }}
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
                        id={opAddress}
                        address={opAddress}
                        spam={spam}
                        showSpambadge
                        verified={verified}
                        borderWith={2}
                        borderColor={theme.surfaceOnElevation}
                        backgroundColor={theme.backgroundPrimary}
                        markContact={!!contact}
                        icPosition={'bottom'}
                        isOwn={isOwn}
                    />
                    <Text
                        style={{
                            color: theme.textPrimary,
                            fontWeight: '600', fontSize: 17, lineHeight: 24,
                            marginTop: (spam || !!contact || verified) ? 16 : 8
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {op}
                    </Text>
                    {!!known?.name ? (
                        <Text
                            style={{
                                color: theme.textSecondary,
                                fontWeight: '400', fontSize: 15, lineHeight: 20,
                                marginTop: 2
                            }}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {known.name}
                        </Text>
                    ) : (
                        !!operation.op && (
                            <Text
                                style={{
                                    color: theme.textSecondary,
                                    fontWeight: '400', fontSize: 15, lineHeight: 20,
                                    marginTop: 2
                                }}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {t(operation.op.res, operation.op.options)}
                            </Text>
                        )
                    )}
                    {tx.base.parsed.status === 'failed' ? (
                        <Text style={{
                            color: theme.accentRed,
                            fontWeight: '600',
                            fontSize: 27,
                            marginTop: 12
                        }}>
                            {t('tx.failed')}
                        </Text>
                    ) : (
                        <>
                            <Text
                                minimumFontScale={0.4}
                                adjustsFontSizeToFit={true}
                                numberOfLines={1}
                                style={{
                                    color: kind === 'in'
                                        ? spam
                                            ? theme.textPrimary
                                            : theme.accentGreen
                                        : theme.textPrimary,
                                    fontWeight: '600',
                                    fontSize: 27,
                                    marginTop: 12,
                                    lineHeight: 32
                                }}
                            >
                                <ValueComponent
                                    value={item.amount}
                                    decimals={item.kind === 'token' && jetton ? jetton.decimals : undefined}
                                    precision={9}
                                    centFontStyle={{ fontSize: 24 }}
                                    prefix={kind === 'in' ? '+' : ''}
                                    suffix={item.kind === 'token' && jetton
                                        ? ' ' + jetton.symbol
                                        : ' TON'
                                    }
                                />
                            </Text>
                            {item.kind === 'ton' && (
                                <PriceComponent
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0,
                                        alignSelf: 'center',
                                        paddingVertical: 0,
                                        height: 'auto',
                                        paddingLeft: 0
                                    }}
                                    prefix={kind === 'in' ? '+' : ''}
                                    textStyle={{ color: theme.textSecondary, fontWeight: '400', fontSize: 17 }}
                                    amount={BigInt(item.amount)}
                                />
                            )}
                        </>
                    )}
                </View>
                {!(dontShowComments && isSpam) && (!!operation.comment) && (
                    <ItemGroup style={{ marginTop: 16 }}>
                        <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                            <Text style={{
                                fontSize: 15, lineHeight: 20, fontWeight: '400',
                                color: theme.textSecondary,
                            }}>
                                {t('common.message')}
                            </Text>
                            <View style={{ alignItems: 'flex-start' }}>
                                <Text style={{ fontSize: 17, fontWeight: '400', lineHeight: 24, color: theme.textPrimary }}>
                                    {operation.comment}
                                </Text>
                            </View>
                        </View>
                    </ItemGroup>
                )}
                <ItemGroup style={{ marginVertical: 16 }}>
                    {!!participants.from.address && (
                        <Pressable
                            onPress={() => onCopyAddress(participants.from.address!)}
                            style={({ pressed }) => ({ paddingHorizontal: 10, justifyContent: 'center', opacity: pressed ? 0.5 : 1 })}
                        >
                            <Text style={{
                                fontSize: 13, lineHeight: 18, fontWeight: '400',
                                color: theme.textSecondary,
                            }}>
                                {t('common.from')}
                            </Text>
                            <View style={{ alignItems: 'center', flexDirection: 'row', }}>
                                <Text style={{ fontSize: 17, fontWeight: '400', lineHeight: 24, color: theme.textPrimary }}>
                                    {kind === 'in' ? (
                                        <Text>
                                            {participants.from.address.toString({ testOnly: isTestnet })}
                                        </Text>
                                    ) : (
                                        <>
                                            {!!participants.from.name && (
                                                <Text
                                                    style={{
                                                        fontSize: 17, lineHeight: 24, fontWeight: '400',
                                                        color: theme.textPrimary,
                                                        flexShrink: 1
                                                    }}
                                                    numberOfLines={1}
                                                    ellipsizeMode={'tail'}
                                                >
                                                    {participants.from.name + ' '}
                                                </Text>
                                            )}
                                            <Text style={{ color: !!participants.from.name ? theme.textSecondary : theme.textPrimary, }}>
                                                <AddressComponent
                                                    address={participants.from.address}
                                                    end={4}
                                                />
                                            </Text>
                                        </>
                                    )}
                                </Text>
                            </View>
                        </Pressable>
                    )}
                    {!!participants.to.address && (
                        <>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                            <Pressable
                                onPress={() => onCopyAddress(participants.to.address!)}
                                style={({ pressed }) => ({ paddingHorizontal: 10, justifyContent: 'center', opacity: pressed ? 0.5 : 1 })}
                            >
                                <Text style={{
                                    fontSize: 13, lineHeight: 18, fontWeight: '400',
                                    color: theme.textSecondary,
                                }}>
                                    {t('common.to')}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {!!participants.to.name && kind === 'in' && (
                                        <Text
                                            style={{
                                                fontSize: 17, lineHeight: 24, fontWeight: '400',
                                                color: theme.textPrimary,
                                                flexShrink: 1, marginRight: 6
                                            }}
                                            numberOfLines={1}
                                            ellipsizeMode={'tail'}
                                        >
                                            {participants.to.name}
                                        </Text>
                                    )}
                                    <Text style={{
                                        fontSize: 17, fontWeight: '400', lineHeight: 24,
                                        color: theme.textSecondary,
                                    }}>
                                        {kind === 'in' ? (
                                            <AddressComponent
                                                address={participants.to.address}
                                                end={4}
                                            />
                                        ) : (
                                            <Text style={{ color: theme.textPrimary }}>
                                                {participants.to.address.toString({ testOnly: isTestnet })}
                                            </Text>
                                        )}
                                    </Text>
                                </View>
                            </Pressable>
                        </>
                    )}

                    {txId && (
                        <>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                            <Pressable
                                onPress={onTxIdPress}
                                style={({ pressed }) => ({ paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', opacity: pressed ? 0.5 : 1 })}
                            >
                                <View>
                                    <Text style={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: theme.textSecondary,
                                    }}>
                                        {t('common.tx')}
                                    </Text>
                                    <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: theme.textPrimary }}>
                                        {txId.slice(0, 6) + '...' + txId.slice(txId.length - 4)}
                                    </Text>
                                </View>
                                <Image
                                    source={require('@assets/ic-explorer.png')}
                                    style={{
                                        tintColor: theme.iconPrimary,
                                        height: 24, width: 24
                                    }}
                                />
                            </Pressable>
                        </>
                    )}
                </ItemGroup>
                <View style={{
                    backgroundColor: theme.surfaceOnElevation,
                    padding: 20, borderRadius: 20,
                    flexDirection: 'row',
                    justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <View>
                        <Text
                            style={{
                                color: theme.textSecondary,
                                fontSize: 13, lineHeight: 18, fontWeight: '400',
                                marginBottom: 2
                            }}>
                            {t('txPreview.blockchainFee')}
                        </Text>
                        <Text style={{
                            color: theme.textPrimary,
                            fontSize: 17, lineHeight: 24, fontWeight: '400'
                        }}>
                            {tx.base.fees
                                ? <>
                                    {`${fromNano(fees)}`}
                                    <Text style={{ color: theme.textSecondary }}>
                                        {` ${feesPrise}`}
                                    </Text>
                                </>
                                : '...'
                            }
                        </Text>
                    </View>
                    <AboutIconButton
                        title={t('txPreview.blockchainFee')}
                        description={t('txPreview.blockchainFeeDescription')}
                        style={{ height: 24, width: 24, position: undefined, marginRight: 4 }}
                        size={20}
                    />
                </View>
            </ScrollView>
            {
                tx.base.parsed.kind === 'out' && (tx.base.parsed.body?.type !== 'payload') && !isLedger && (
                    <View style={{ flexDirection: 'row', width: '100%', marginBottom: safeArea.bottom + 16, paddingHorizontal: 16 }}>
                        <RoundButton
                            title={t('txPreview.sendAgain')}
                            style={{ flexGrow: 1 }}
                            onPress={() => navigation.navigateSimpleTransfer({
                                target: tx.base.parsed.resolvedAddress,
                                comment: tx.base.parsed.body && tx.base.parsed.body.type === 'comment' ? tx.base.parsed.body.comment : null,
                                amount: BigInt(tx.base.parsed.amount) > 0n ? BigInt(tx.base.parsed.amount) : -BigInt(tx.base.parsed.amount),
                                job: null,
                                stateInit: null,
                                jetton: null,
                                callback: null
                            })}
                        />
                    </View>
                )
            }
        </View >
    );
});