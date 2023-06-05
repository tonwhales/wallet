import React, { useMemo } from "react";
import { View, Platform, Text, Pressable, ToastAndroid, ScrollView, NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { CloseButton } from "../../components/CloseButton";
import { useParams } from "../../utils/useParams";
import { Address, fromNano } from "ton";
import BN from "bn.js";
import { ValueComponent } from "../../components/ValueComponent";
import { formatDate, formatTime } from "../../utils/dates";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { WalletAddress } from "../../components/WalletAddress";
import { Avatar } from "../../components/Avatar";
import { t } from "../../i18n/t";
import { StatusBar } from "expo-status-bar";
import { Engine, useEngine } from "../../engine/Engine";
import { KnownJettonMasters, KnownWallet, KnownWallets } from "../../secure/KnownWallets";
import VerifiedIcon from '../../../assets/ic_verified.svg';
import ContactIcon from '../../../assets/ic_contacts.svg';
import CopyIcon from '../../../assets/ic_copy.svg';
import ExplorerIcon from '../../../assets/ic_explorer.svg';
import { RoundButton } from "../../components/RoundButton";
import { PriceComponent } from "../../components/PriceComponent";
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';
import { openWithInApp } from "../../utils/openWithInApp";
import { parseBody } from "../../engine/transactions/parseWalletTransaction";
import { Body } from "../../engine/Transaction";
import ContextMenu, { ContextMenuOnPressNativeEvent } from "react-native-context-menu-view";
import { TransactionDescription } from "../../engine/products/WalletProduct";
import { useTransport } from "./components/TransportContext";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { useAppConfig } from "../../utils/AppConfigContext";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";

const LoadedTransaction = React.memo(({ transaction, transactionHash, engine, address }: { transaction: TransactionDescription, transactionHash: string, engine: Engine, address: Address }) => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
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
                op = '⚠️ ' + t('tx.bounced');
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
        if (!transactionHash) {
            return null;
        }
        return transaction.base.lt +
            '_' +
            transactionHash
    }, [transaction, transactionHash]);

    const explorerLink = useMemo(() => {
        if (!transaction.base.lt) {
            return null;
        }
        if (!transactionHash) {
            return null;
        }
        return (AppConfig.isTestnet ? 'https://test.tonwhales.com' : 'https://tonwhales.com')
            + '/explorer/address/' +
            address.toFriendly() +
            '/' + txId
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

    const onCopy = React.useCallback((body: string) => {
        if (Platform.OS === 'android') {
            Clipboard.setString(body);
            ToastAndroid.show(t('common.copied'), ToastAndroid.SHORT);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return;
        }
        Clipboard.setString(body);
        return;
    }, []);

    const handleCommentAction = React.useCallback((e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => {
        if (e.nativeEvent.name === t('common.copy')) {
            if (!operation.comment && body?.type === 'comment' && body.comment) {
                onCopy(body.comment);
                return;
            }

            if (!(body?.type === 'comment' && body.comment) && operation.comment) {
                onCopy(operation.comment);
                return;
            }
        }
    }, [operation, body]);

    return (
        <>
            <AndroidToolbar style={{ position: 'absolute', top: safeArea.top, left: 0 }} pageTitle={op} />
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                {Platform.OS === 'ios' && (
                    <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17, marginTop: 17, marginHorizontal: 32 }} numberOfLines={1} ellipsizeMode="tail">
                        {op}
                    </Text>
                )}
            </View>
            <Text style={{ color: Theme.textSecondary, fontSize: 13, marginTop: Platform.OS === 'ios' ? 6 : 32, marginBottom: spam ? 0 : 8 }}>
                {`${formatDate(transaction.base.time, 'dd.MM.yyyy')} ${formatTime(transaction.base.time)}`}
            </Text>
            {spam && (
                <View style={{
                    borderColor: '#ADB6BE',
                    borderWidth: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 4,
                    marginTop: 13,
                    paddingHorizontal: 4,
                    marginBottom: 8
                }}>
                    <Text style={{ color: Theme.textSecondary, fontSize: 13 }}>{'SPAM'}</Text>
                </View>
            )}
            <ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                automaticallyAdjustContentInsets={false}
            >
                <View style={{
                    marginTop: 44,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    justifyContent: 'center', alignItems: 'center',
                    paddingHorizontal: 16, paddingTop: 38, paddingBottom: 16,
                    width: '100%'
                }}>
                    <View style={{
                        width: 60, height: 60,
                        borderRadius: 60, borderWidth: 4, borderColor: Theme.item,
                        alignItems: 'center', justifyContent: 'center',
                        position: 'absolute', top: -28,
                    }}>
                        <Avatar
                            address={friendlyAddress}
                            id={friendlyAddress}
                            size={56}
                            image={transaction.icon ? transaction.icon : undefined}
                            spam={spam}
                            verified={verified}
                        />
                    </View>
                    {transaction.base.status === 'failed' ? (
                        <Text style={{ color: 'orange', fontWeight: '600', fontSize: 16, marginRight: 2 }}>
                            {t('tx.failed')}
                        </Text>
                    ) : (
                        <>
                            <Text
                                style={{
                                    color: item.amount.gte(new BN(0))
                                        ? spam
                                            ? Theme.textColor
                                            : '#4FAE42'
                                        : '#000000',
                                    fontWeight: '800',
                                    fontSize: 36,
                                    marginRight: 2,
                                }}
                                numberOfLines={1}
                            >
                                <ValueComponent
                                    value={item.amount}
                                    decimals={item.kind === 'token' ? item.decimals : undefined}
                                    precision={5}
                                />
                                {item.kind === 'token' ? ' ' + item.symbol : ''}
                                {(item.kind === 'ton' && !AppConfig.isTestnet) ? ' ' + 'TON' : ''}
                            </Text>
                            {item.kind === 'ton' && (
                                <PriceComponent
                                    style={{
                                        backgroundColor: 'transparent',
                                        paddingHorizontal: 0,
                                        alignSelf: 'center'
                                    }}
                                    textStyle={{ color: Theme.price, fontWeight: '400', fontSize: 16 }}
                                    amount={item.amount}
                                />
                            )}
                        </>
                    )}
                </View>
                {(!operation.comment && body?.type === 'comment' && body.comment) && !(spam && !dontShowComments) && (
                    <View style={{
                        marginTop: 14,
                        backgroundColor: Theme.item,
                        borderRadius: 14,
                        justifyContent: 'center',
                        width: '100%'
                    }}>
                        <ContextMenu
                            actions={[{ title: t('common.copy'), systemIcon: Platform.OS === 'ios' ? 'doc.on.doc' : undefined }]}
                            onPress={handleCommentAction}
                        >
                            <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
                                <Text style={{ fontWeight: '400', color: Theme.textSubtitle, fontSize: 12 }}>
                                    {t('common.comment')}
                                </Text>
                                <Text
                                    style={{
                                        marginTop: 5,
                                        textAlign: 'left',
                                        fontWeight: '600',
                                        fontSize: 16,
                                        lineHeight: 20
                                    }}
                                >
                                    {body.comment}
                                </Text>
                            </View>
                        </ContextMenu>
                    </View>
                )}
                {(!(body?.type === 'comment' && body.comment) && operation.comment) && !(spam && !dontShowComments) && (
                    <View style={{
                        marginTop: 14,
                        backgroundColor: Theme.item,
                        borderRadius: 14,
                        justifyContent: 'center',
                        width: '100%'
                    }}>
                        <ContextMenu
                            actions={[{ title: t('common.copy'), systemIcon: Platform.OS === 'ios' ? 'doc.on.doc' : undefined }]}
                            onPress={handleCommentAction}
                        >
                            <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
                                <Text style={{ fontWeight: '400', color: Theme.textSubtitle, fontSize: 12 }}>
                                    {t('common.comment')}
                                </Text>
                                <Text
                                    style={{
                                        marginTop: 5,
                                        textAlign: 'left',
                                        fontWeight: '400',
                                        fontSize: 16,
                                        lineHeight: 20
                                    }}
                                >
                                    {operation.comment}
                                </Text>
                            </View>
                        </ContextMenu>
                    </View>
                )}
                <View style={{
                    marginBottom: 16, marginTop: 14,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    justifyContent: 'center',
                    width: '100%'
                }}>
                    <View style={{ marginTop: 10, marginBottom: 13, paddingHorizontal: 16 }}>
                        <View style={{
                            flexDirection: 'row',
                            width: '100%',
                            alignItems: 'center',
                            marginBottom: 6
                        }}>
                            <Text style={{
                                marginTop: 5,
                                fontWeight: '400',
                                color: Theme.textSubtitle,
                                marginRight: 16, flexGrow: 1,
                                fontSize: 12
                            }}>
                                {t('common.walletAddress')}
                            </Text>
                            {!!known && (
                                <Pressable
                                    style={({ pressed }) => {
                                        return [{
                                            opacity: pressed && contact ? 0.3 : 1,
                                        }]
                                    }}
                                    onPress={() => {
                                        if (contact) {
                                            navigation.navigate(
                                                'Contact',
                                                { address: operation.address.toFriendly({ testOnly: AppConfig.isTestnet }) }
                                            );
                                        }
                                    }}
                                >
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'flex-end',
                                            alignItems: 'center',
                                            marginTop: 5,
                                            flex: 1
                                        }}
                                    >
                                        {!contact && (
                                            <VerifiedIcon
                                                width={14}
                                                height={14}
                                                style={{ alignSelf: 'center', marginRight: 4 }}
                                            />
                                        )}
                                        {!!contact && (
                                            <ContactIcon
                                                width={14}
                                                height={14}
                                                style={{ alignSelf: 'center', marginRight: 4 }}
                                            />
                                        )}
                                        <Text
                                            style={{
                                                fontWeight: '400',
                                                fontSize: 12,
                                                color: Theme.textSubtitle,
                                                alignSelf: 'flex-start',
                                            }}
                                            numberOfLines={1}
                                            ellipsizeMode={'tail'}
                                        >
                                            {known.name}
                                        </Text>
                                    </View>
                                </Pressable>
                            )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                            <WalletAddress
                                address={operation.address || address}
                                textProps={{ numberOfLines: undefined }}
                                textStyle={{
                                    textAlign: 'left',
                                    fontWeight: '500',
                                    fontSize: 16,
                                    lineHeight: 20
                                }}
                                spam={spam}
                                known={!!known}
                                style={{
                                    width: undefined,
                                    marginTop: undefined,
                                }}
                                previewBackgroundColor={Theme.item}
                            />
                            <View style={{ flexGrow: 1 }} />
                            <Pressable
                                style={({ pressed }) => { return { opacity: pressed ? 0.3 : 1 }; }}
                                onPress={() => onCopy((operation.address || address).toFriendly({ testOnly: AppConfig.isTestnet }))}
                            >
                                <CopyIcon />
                            </Pressable>
                        </View>
                    </View>
                    {txId && explorerLink && (
                        <>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 15 }} />
                            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 16 }}>
                                <View>
                                    <Text style={{
                                        fontWeight: '400',
                                        fontSize: 12,
                                        lineHeight: 14,
                                        color: Theme.textSubtitle
                                    }}>
                                        {t('common.tx')}
                                    </Text>
                                    <Text style={{
                                        fontWeight: '400',
                                        fontSize: 16,
                                        lineHeight: 20,
                                        marginTop: 6,
                                        color: Theme.textColor,
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        {txId.slice(0, 10) + '...' + txId.slice(txId.length - 6)}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                                    <Pressable
                                        style={({ pressed }) => { return { opacity: pressed ? 0.3 : 1 }; }}
                                        onPress={() => openWithInApp(explorerLink)}
                                    >
                                        <ExplorerIcon />
                                    </Pressable>
                                    <Pressable
                                        style={({ pressed }) => { return { opacity: pressed ? 0.3 : 1, marginLeft: 24 }; }}
                                        onPress={() => onCopy(explorerLink)}
                                    >
                                        <CopyIcon />
                                    </Pressable>
                                </View>
                            </View>
                        </>
                    )}
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 15 }} />
                    <View style={{ width: '100%', paddingVertical: 10, paddingHorizontal: 16 }}>
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 12,
                            lineHeight: 14,
                            color: Theme.textSubtitle
                        }}>
                            {t('txPreview.blockchainFee')}
                        </Text>
                        <View style={{
                            flexDirection: 'row',
                            marginTop: 6,
                            alignItems: 'center'
                        }}>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 16,
                                lineHeight: 20,
                                color: Theme.textColor,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                {fromNano(transaction.base.fees)}
                                {!AppConfig.isTestnet && (' TON (')}
                            </Text>
                            <PriceComponent
                                amount={transaction.base.fees}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0,
                                    paddingVertical: 0,
                                    justifyContent: 'center',
                                    height: undefined
                                }}
                                textStyle={{ color: Theme.textColor, fontSize: 16, lineHeight: 20, fontWeight: '400' }}
                            />
                            {!AppConfig.isTestnet && (
                                <Text style={{
                                    fontWeight: '400',
                                    fontSize: 16,
                                    lineHeight: 20,
                                    color: Theme.textColor,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    {')'}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>
            <View style={{ paddingHorizontal: 16 }}>
                <View style={{ flexDirection: 'row', width: '100%', marginBottom: safeArea.bottom + 16, }}>
                    <RoundButton
                        title={t('common.close')}
                        style={{ flexGrow: 1 }}
                        onPress={navigation.goBack}
                        display={'default'}
                    />
                </View>
            </View>
        </>
    )
})

export const LedgerTransactionPreviewFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const { Theme } = useAppConfig();
    const engine = useEngine();
    const params = useParams<{ transaction: string }>();
    const { addr } = useTransport();
    const address = React.useMemo(() => {
        return Address.parse(addr!.address);
    }, []);
    const transaction = engine.products.ledger.useTransaction(params.transaction);
    const navigation = useTypedNavigation();

    if (!transaction) {
        navigation.goBack();
    }

    return (
        <View style={{
            alignSelf: 'stretch', flexGrow: 1, flexBasis: 0,
            alignItems: 'center',
            backgroundColor: Theme.background,
            paddingTop: Platform.OS === 'android' ? safeArea.top + 24 : undefined,
        }}>
            {!transaction && (
                <AndroidToolbar style={{ position: 'absolute', top: safeArea.top, left: 0 }} />
            )}
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            {transaction && address && (
                <LoadedTransaction
                    transaction={transaction}
                    transactionHash={transaction.base?.hash.toString('base64')}
                    engine={engine}
                    address={address}
                />
            )}
            {!transaction && (<View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}><LoadingIndicator simple={true} /></View>)}
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={navigation.goBack}
                />
            )}
        </View>
    );
});