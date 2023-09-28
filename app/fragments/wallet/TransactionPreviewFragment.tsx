import React, { useCallback, useEffect, useMemo } from "react";
import { View, Platform, Text, Pressable, ScrollView, NativeSyntheticEvent, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { getAppState, getCurrentAddress } from "../../storage/appState";
import { useParams } from "../../utils/useParams";
import { Address, fromNano } from "ton";
import BN from "bn.js";
import { ValueComponent } from "../../components/ValueComponent";
import { formatDate, formatTime } from "../../utils/dates";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { WalletAddress } from "../../components/WalletAddress";
import { Avatar } from "../../components/Avatar";
import { t } from "../../i18n/t";
import { useEngine } from "../../engine/Engine";
import { KnownJettonMasters, KnownWallet, KnownWallets } from "../../secure/KnownWallets";
import { RoundButton } from "../../components/RoundButton";
import { PriceComponent } from "../../components/PriceComponent";
import { openWithInApp } from "../../utils/openWithInApp";
import { parseBody } from "../../engine/transactions/parseWalletTransaction";
import { Body } from "../../engine/Transaction";
import ContextMenu, { ContextMenuOnPressNativeEvent } from "react-native-context-menu-view";
import { copyText } from "../../utils/copyText";
import * as ScreenCapture from 'expo-screen-capture';
import { useAppConfig } from "../../utils/AppConfigContext";
import { ToastDuration, useToaster } from '../../components/toast/ToastProvider';
import { ScreenHeader } from "../../components/ScreenHeader";
import { ItemGroup } from "../../components/ItemGroup";
import { AddressComponent } from "../../components/address/AddressComponent";

import VerifiedIcon from '@assets/ic_verified.svg';
import ContactIcon from '@assets/ic_contacts.svg';
import CopyIcon from '@assets/ic_copy.svg';
import ExplorerIcon from '@assets/ic_explorer.svg';
import { AboutIconButton } from "../../components/AboutIconButton";
import { useActionSheet } from "@expo/react-native-action-sheet";

export const TransactionPreviewFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const params = useParams<{ transaction: string }>();
    const address = useMemo(() => getCurrentAddress().address, []);
    const engine = useEngine();
    const toaster = useToaster();
    const { showActionSheetWithOptions } = useActionSheet();

    const walletSettings = engine.products.wallets.useWalletSettings(address);

    let transaction = engine.products.main.useTransaction(params.transaction);
    let operation = transaction.operation;
    let friendlyAddress = operation.address.toFriendly({ testOnly: AppConfig.isTestnet });
    let item = transaction.operation.items[0];

    let op: string;
    if (operation.op) {
        op = operation.op;
        if (op === 'airdrop') {
            op = t('tx.airdrop');
        }
    } else {
        if (transaction.base.kind === 'out') {
            if (transaction.base.status === 'pending') {
                op = t('tx.sending');
            } else {
                op = t('tx.sent');
            }
        } else if (transaction.base.kind === 'in') {
            if (transaction.base.bounced) {
                op = t('tx.bounced');
            } else {
                op = t('tx.received');
            }
        } else {
            throw Error('Unknown kind');
        }
    }

    const verified = !!transaction.verified
        || !!KnownJettonMasters(AppConfig.isTestnet)[operation.address.toFriendly({ testOnly: AppConfig.isTestnet })];

    let body: Body | null = null;
    if (transaction.base.body?.type === 'payload') {
        body = parseBody(transaction.base.body.cell);
    }

    const txId = useMemo(() => {
        if (!transaction.base.lt) {
            return null;
        }
        if (!transaction.base.hash) {
            return null;
        }
        return transaction.base.lt +
            '_' +
            transaction.base.hash.toString('hex')
    }, [transaction]);

    const tonhubLink = useMemo(() => {
        if (!txId) {
            return null;
        }
        return `${AppConfig.isTestnet ? 'https://test.tonhub.com' : 'https://tonhub.com'}/share/tx/`
            + `${address.toFriendly({ testOnly: AppConfig.isTestnet })}/`
            + `${transaction.base.lt}_${encodeURIComponent(transaction.base.hash.toString('base64'))}`
    }, [txId]);

    const contact = engine.products.settings.useContactAddress(operation.address);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (KnownWallets(AppConfig.isTestnet)[friendlyAddress]) {
        known = KnownWallets(AppConfig.isTestnet)[friendlyAddress];
    } else if (operation.title) {
        known = { name: operation.title };
    } else if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }

    const spamMinAmount = engine.products.settings.useSpamMinAmount();
    const dontShowComments = engine.products.settings.useDontShowComments();
    const isSpam = engine.products.settings.useDenyAddress(operation.address);

    let spam = engine.products.serverConfig.useIsSpamWallet(friendlyAddress)
        || isSpam
        || (
            transaction.base.amount.abs().lt(spamMinAmount)
            && transaction.base.body?.type === 'comment'
            && !KnownWallets(AppConfig.isTestnet)[friendlyAddress]
            && !AppConfig.isTestnet
        ) && transaction.base.kind !== 'out';

    const participants = useMemo(() => {
        const appState = getAppState();
        const index = appState.addresses.findIndex((a) => a.address.toFriendly() === address.toFriendly());
        if (transaction.base.kind === 'out') {
            return {
                from: {
                    address: address,
                    name: walletSettings?.name || `${t('common.wallet')} ${index + 1}`
                },
                to: {
                    address: operation.address,
                    name: known?.name
                }
            }
        }

        return {
            from: {
                address: operation.address,
                name: known?.name
            },
            to: {
                address: address,
                name: walletSettings?.name || `${t('common.wallet')} ${index + 1}`
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
        onCopy(address.toFriendly({ testOnly: AppConfig.isTestnet }));
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
            backgroundColor: Theme.background,
            paddingTop: Platform.OS === 'android' ? safeArea.top + 24 : undefined,
        }}>
            <ScreenHeader
                onClosePressed={navigation.goBack}
            />
            <ScrollView
                style={{ flexGrow: 1, alignSelf: 'stretch', }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                automaticallyAdjustContentInsets={false}
            >
                <View style={{
                    backgroundColor: Theme.surfaceSecondary,
                    borderRadius: 20,
                    padding: 20,
                    width: '100%',
                    overflow: 'hidden',
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <View style={{ backgroundColor: Theme.divider, position: 'absolute', top: 0, left: 0, right: 0, height: 54 }} />
                    <Avatar
                        size={68}
                        id={friendlyAddress}
                        address={friendlyAddress}
                        image={transaction.icon ? transaction.icon : undefined}
                        spam={spam}
                        showSpambadge
                        verified={verified}
                        borderWith={2}
                        borderColor={Theme.surfaceSecondary}
                        backgroundColor={Theme.background}
                    />
                    <Text
                        style={{
                            color: Theme.textPrimary,
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
                    {transaction.base.status === 'failed' ? (
                        <Text style={{
                            color: Theme.accentRed,
                            fontWeight: '800',
                            fontSize: 38
                        }}>
                            {t('tx.failed')}
                        </Text>
                    ) : (
                        <>
                            <Text
                                style={{
                                    color: item.amount.gte(new BN(0))
                                        ? Theme.accentGreen
                                        : Theme.textPrimary,
                                    fontWeight: '800',
                                    fontSize: 38,
                                }}
                            >
                                {item.amount.gte(new BN(0)) && '+'}
                                <ValueComponent
                                    value={item.amount}
                                    decimals={item.kind === 'token' ? item.decimals : undefined}
                                    precision={3}
                                />
                                <Text style={{ fontSize: 32 }}>
                                    {item.kind === 'token'
                                        ? ' ' + item.symbol
                                        : ' TON'
                                    }
                                </Text>
                            </Text>
                            {item.kind === 'ton' && (
                                <PriceComponent
                                    style={{
                                        backgroundColor: Theme.transparent,
                                        paddingHorizontal: 0,
                                        alignSelf: 'center',
                                        paddingVertical: 0,
                                        height: 'auto'
                                    }}
                                    textStyle={{ color: Theme.textSecondary, fontWeight: '400', fontSize: 17 }}
                                    amount={item.amount}
                                />
                            )}
                        </>
                    )}
                </View>
                <Text style={{ color: Theme.textSecondary, fontSize: 13, marginVertical: 8, alignSelf: 'center' }}>
                    {`${formatDate(transaction.base.time, 'dd.MM.yyyy')} ${formatTime(transaction.base.time)}`}
                </Text>
                <ItemGroup style={{ marginBottom: 16 }}>
                    <Pressable
                        onPress={() => onCopyAddress(participants.from.address)}
                        style={({ pressed }) => ({ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center', opacity: pressed ? 0.5 : 1 })}
                    >
                        <Text style={{
                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                            color: Theme.textSecondary,
                        }}>
                            {t('common.from')}
                        </Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: Theme.textPrimary }}>
                                <AddressComponent address={participants.from.address} end={4} />
                            </Text>
                            {!!participants.from.name && (
                                <Text
                                    style={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: Theme.textSecondary,
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
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                    <Pressable
                        onPress={() => onCopyAddress(participants.to.address)}
                        style={({ pressed }) => ({ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center', opacity: pressed ? 0.5 : 1 })}
                    >
                        <Text style={{
                            fontSize: 15, lineHeight: 20, fontWeight: '400',
                            color: Theme.textSecondary,
                        }}>
                            {t('common.to')}
                        </Text>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: Theme.textPrimary }}>
                                <AddressComponent address={participants.to.address} end={4} />
                            </Text>
                            {!!participants.to.name && (
                                <Text
                                    style={{
                                        fontSize: 15, lineHeight: 20, fontWeight: '400',
                                        color: Theme.textSecondary,
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

                    {txId && (
                        <>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                            <Pressable
                                onPress={onTxIdPress}
                                style={({ pressed }) => ({ flexDirection: 'row', paddingHorizontal: 10, justifyContent: 'space-between', alignItems: 'center', opacity: pressed ? 0.5 : 1 })}
                            >
                                <Text style={{
                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                    color: Theme.textSecondary,
                                }}>
                                    {t('common.tx')}
                                </Text>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: Theme.textPrimary }}>
                                        {txId.slice(0, 6) + '...' + txId.slice(txId.length - 4)}
                                    </Text>
                                </View>
                            </Pressable>
                        </>
                    )}
                    {!(dontShowComments && isSpam) && (!operation.comment && body?.type === 'comment' && body.comment) && (
                        <>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                            <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                                <Text style={{
                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                    color: Theme.textSecondary,
                                }}>
                                    {t('common.message')}
                                </Text>
                                <View style={{ alignItems: 'flex-start' }}>
                                    <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: Theme.textPrimary }}>
                                        {body.comment}
                                    </Text>
                                </View>
                            </View>
                        </>
                    )}
                    {!(dontShowComments && isSpam) && (!(body?.type === 'comment' && body.comment)) && !!operation.comment && (
                        <>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginVertical: 16, marginHorizontal: 10 }} />
                            <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                                <Text style={{
                                    fontSize: 15, lineHeight: 20, fontWeight: '400',
                                    color: Theme.textSecondary,
                                }}>
                                    {t('common.message')}
                                </Text>
                                <View style={{ alignItems: 'flex-start' }}>
                                    <Text style={{ fontSize: 17, fontWeight: '500', lineHeight: 24, color: Theme.textPrimary, marginTop: 2 }}>
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
                            color: Theme.textSecondary
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
                                color: Theme.textPrimary,
                            }}>
                                {fromNano(transaction.base.fees) + ' TON'}
                            </Text>
                            <PriceComponent
                                amount={transaction.base.fees}
                                style={{
                                    backgroundColor: Theme.transparent,
                                    paddingHorizontal: 0,
                                    paddingVertical: 0,
                                    height: 'auto',
                                    paddingLeft: 0,
                                    alignSelf: 'flex-end'
                                }}
                                textStyle={{ color: Theme.textSecondary, fontSize: 15, fontWeight: '400' }}
                            />
                        </View>
                    </View>
                </ItemGroup>
            </ScrollView>
            {transaction.base.kind === 'out' && (transaction.base.body === null || transaction.base.body.type !== 'payload') && (
                <View style={{ flexDirection: 'row', width: '100%', marginBottom: safeArea.bottom + 16, paddingHorizontal: 16 }}>
                    <RoundButton
                        title={t('txPreview.sendAgain')}
                        style={{ flexGrow: 1 }}
                        onPress={() => navigation.navigateSimpleTransfer({
                            target: transaction.base.address!.toFriendly({ testOnly: AppConfig.isTestnet }),
                            comment: transaction.base.body && transaction.base.body.type === 'comment' ? transaction.base.body.comment : null,
                            amount: transaction.base.amount.neg(),
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