import React, { memo, useMemo } from "react";
import { View, Platform, Text, Pressable, ToastAndroid, ScrollView, NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { CloseButton } from "../../components/CloseButton";
import { useParams } from "../../utils/useParams";
import { Address, fromNano } from "@ton/core";
import { ValueComponent } from "../../components/ValueComponent";
import { formatDate, formatTime } from "../../utils/dates";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { WalletAddress } from "../../components/WalletAddress";
import { Avatar } from "../../components/Avatar";
import { t } from "../../i18n/t";
import { StatusBar } from "expo-status-bar";
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
import ContextMenu, { ContextMenuOnPressNativeEvent } from "react-native-context-menu-view";
import { useTransport } from "./components/TransportContext";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { useTheme } from '../../engine/hooks';
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { useSpamMinAmount } from '../../engine/hooks';
import { useDontShowComments } from '../../engine/hooks';
import { useDenyAddress } from '../../engine/hooks';
import { useIsSpamWallet } from '../../engine/hooks';
import { useNetwork } from '../../engine/hooks';
import { BigMath } from '../../utils/BigMath';
import { useContact } from '../../engine/hooks';
import { TransactionDescription, TxBody } from '../../engine/types';

const LoadedTransaction = memo(({ transaction, transactionHash, address }: { transaction: TransactionDescription, transactionHash: string, address: Address }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();

    let operation = transaction.base.operation;
    let friendlyAddress = operation.address;
    let item = operation.items[0];
    let op: string;
    if (operation.op) {
        op = t(operation.op.res, operation.op.options);
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

    const opAddress = useMemo(() => {
        try {
            return Address.parse(friendlyAddress);
        } catch {
            return null;
        }
    }, [friendlyAddress]);

    const verified = !!transaction.verified
        || !!KnownJettonMasters(isTestnet)[friendlyAddress];

    let body: TxBody | null = transaction.base.parsed.body;

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
        return (isTestnet ? 'https://test.tonwhales.com' : 'https://tonwhales.com')
            + '/explorer/address/' +
            address.toString() +
            '/' + txId
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

    const [spamMinAmount, ] = useSpamMinAmount();
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
                    <Text style={{ color: theme.textPrimary, fontWeight: '600', fontSize: 17, marginTop: 17, marginHorizontal: 32 }} numberOfLines={1} ellipsizeMode="tail">
                        {op}
                    </Text>
                )}
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: Platform.OS === 'ios' ? 6 : 32, marginBottom: spam ? 0 : 8 }}>
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
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{'SPAM'}</Text>
                </View>
            )}
            <ScrollView
                style={{ flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
                automaticallyAdjustContentInsets={false}
            >
                <View style={{
                    marginTop: 44,
                    backgroundColor: theme.surfacePimary,
                    borderRadius: 14,
                    justifyContent: 'center', alignItems: 'center',
                    paddingHorizontal: 16, paddingTop: 38, paddingBottom: 16,
                    width: '100%'
                }}>
                    <View style={{
                        width: 60, height: 60,
                        borderRadius: 60, borderWidth: 4, borderColor: theme.surfacePimary,
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
                    {transaction.base.parsed.status === 'failed' ? (
                        <Text style={{ color: 'orange', fontWeight: '600', fontSize: 16, marginRight: 2 }}>
                            {t('tx.failed')}
                        </Text>
                    ) : (
                        <>
                            <Text
                                style={{
                                    color: BigInt(item.amount) >= BigInt(0)
                                        ? spam
                                            ? theme.textPrimary
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
                                    decimals={item.kind === 'token' ? transaction.masterMetadata?.decimals : undefined}
                                    precision={5}
                                />
                                {item.kind === 'token' ? ' ' + transaction.masterMetadata?.symbol : ''}
                                {(item.kind === 'ton' && !isTestnet) ? ' ' + 'TON' : ''}
                            </Text>
                            {item.kind === 'ton' && (
                                <PriceComponent
                                    style={{
                                        backgroundColor: 'transparent',
                                        paddingHorizontal: 0,
                                        alignSelf: 'center'
                                    }}
                                    textStyle={{ color: theme.price, fontWeight: '400', fontSize: 16 }}
                                    amount={BigInt(item.amount)}
                                />
                            )}
                        </>
                    )}
                </View>
                {(!operation.comment && body?.type === 'comment' && body.comment) && !(spam && !dontShowComments) && (
                    <View style={{
                        marginTop: 14,
                        backgroundColor: theme.surfacePimary,
                        borderRadius: 14,
                        justifyContent: 'center',
                        width: '100%'
                    }}>
                        <ContextMenu
                            actions={[{ title: t('common.copy'), systemIcon: Platform.OS === 'ios' ? 'doc.on.doc' : undefined }]}
                            onPress={handleCommentAction}
                        >
                            <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
                                <Text style={{ fontWeight: '400', color: theme.textThird, fontSize: 12 }}>
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
                        backgroundColor: theme.surfacePimary,
                        borderRadius: 14,
                        justifyContent: 'center',
                        width: '100%'
                    }}>
                        <ContextMenu
                            actions={[{ title: t('common.copy'), systemIcon: Platform.OS === 'ios' ? 'doc.on.doc' : undefined }]}
                            onPress={handleCommentAction}
                        >
                            <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
                                <Text style={{ fontWeight: '400', color: theme.textThird, fontSize: 12 }}>
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
                    backgroundColor: theme.surfacePimary,
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
                                color: theme.textThird,
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
                                                { address: friendlyAddress }
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
                                                color: theme.textThird,
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
                                address={opAddress || address}
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
                                previewBackgroundColor={theme.surfacePimary}
                            />
                            <View style={{ flexGrow: 1 }} />
                            <Pressable
                                style={({ pressed }) => { return { opacity: pressed ? 0.3 : 1 }; }}
                                onPress={() => onCopy((opAddress || address).toString({ testOnly: isTestnet }))}
                            >
                                <CopyIcon />
                            </Pressable>
                        </View>
                    </View>
                    {txId && explorerLink && (
                        <>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginLeft: 15 }} />
                            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 16 }}>
                                <View>
                                    <Text style={{
                                        fontWeight: '400',
                                        fontSize: 12,
                                        lineHeight: 14,
                                        color: theme.textThird
                                    }}>
                                        {t('common.tx')}
                                    </Text>
                                    <Text style={{
                                        fontWeight: '400',
                                        fontSize: 16,
                                        lineHeight: 20,
                                        marginTop: 6,
                                        color: theme.textPrimary,
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
                    <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider, marginLeft: 15 }} />
                    <View style={{ width: '100%', paddingVertical: 10, paddingHorizontal: 16 }}>
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 12,
                            lineHeight: 14,
                            color: theme.textThird
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
                                color: theme.textPrimary,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                {fromNano(transaction.base.fees)}
                                {!isTestnet && (' TON (')}
                            </Text>
                            <PriceComponent
                                amount={BigInt(transaction.base.fees)}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0,
                                    paddingVertical: 0,
                                    justifyContent: 'center',
                                    height: undefined
                                }}
                                textStyle={{ color: theme.textPrimary, fontSize: 16, lineHeight: 20, fontWeight: '400' }}
                            />
                            {!isTestnet && (
                                <Text style={{
                                    fontWeight: '400',
                                    fontSize: 16,
                                    lineHeight: 20,
                                    color: theme.textPrimary,
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
    const theme = useTheme();
    const params = useParams<{ transaction: TransactionDescription }>();
    const { addr } = useTransport();
    const address = React.useMemo(() => {
        return Address.parse(addr!.address);
    }, []);
    const navigation = useTypedNavigation();

    if (!params.transaction) {
        navigation.goBack();
    }

    return (
        <View style={{
            alignSelf: 'stretch', flexGrow: 1, flexBasis: 0,
            alignItems: 'center',
            backgroundColor: theme.background,
            paddingTop: Platform.OS === 'android' ? safeArea.top + 24 : undefined,
        }}>
            {!params.transaction && (
                <AndroidToolbar style={{ position: 'absolute', top: safeArea.top, left: 0 }} />
            )}
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            {params.transaction && address && (
                <LoadedTransaction
                    transaction={params.transaction}
                    transactionHash={params.transaction.base?.hash}
                    address={address}
                />
            )}
            {!params.transaction && (<View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}><LoadingIndicator simple={true} /></View>)}
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={navigation.goBack}
                />
            )}
        </View>
    );
});