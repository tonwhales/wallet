import React from "react";
import { View, Platform, Text, Image, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { getCurrentAddress } from "../../storage/appState";
import { CloseButton } from "../../components/CloseButton";
import { Theme } from "../../Theme";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { useParams } from "../../utils/useParams";
import { Address, fromNano } from "ton";
import BN from "bn.js";
import { ValueComponent } from "../../components/ValueComponent";
import { formatDate, formatTime } from "../../utils/dates";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { AppConfig } from "../../AppConfig";
import { WalletAddress } from "../../components/WalletAddress";
import { Avatar } from "../../components/Avatar";
import { t } from "../../i18n/t";
import { MenuComponent } from "../../components/MenuComponent";
import { StatusBar } from "expo-status-bar";
import { useEngine } from "../../engine/Engine";
import { KnownWallet, KnownWallets } from "../../secure/KnownWallets";
import { confirmAlert } from "../../utils/confirmAlert";
import VerifiedIcon from '../../../assets/ic_verified.svg';
import ContactIcon from '../../../assets/ic_contacts.svg';

export const TransactionPreviewFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const params = useParams<{ transaction: string }>();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const engine = useEngine();
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
                op = '⚠️ ' + t('tx.bounced');
            } else {
                op = t('tx.received');
            }
        } else {
            throw Error('Unknown kind');
        }
    }

    const contact = engine.products.settings.useContact(operation.address);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (KnownWallets[friendlyAddress]) {
        known = KnownWallets[friendlyAddress];
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
            && !KnownWallets[friendlyAddress]
            && !AppConfig.isTestnet
        );


    const settings = engine.products.settings;
    const onMarkAddressSpam = React.useCallback(async (addr: Address) => {
        const confirmed = await confirmAlert('spamFilter.blockConfirm');
        if (confirmed) {
            settings.addToDenyList(addr);
        }
    }, []);

    const onAddressContact = React.useCallback((addr: Address) => {
        navigation.navigate('Contact', { address: addr.toFriendly({ testOnly: AppConfig.isTestnet }) });
    }, []);

    return (
        <View style={{
            alignSelf: 'stretch', flexGrow: 1, flexBasis: 0,
            alignItems: 'center',
            backgroundColor: Theme.background,
            paddingTop: Platform.OS === 'android' ? safeArea.top + 24 : undefined,
            paddingHorizontal: 16
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar style={{ position: 'absolute', top: safeArea.top, left: 0 }} pageTitle={op} />
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                {Platform.OS === 'ios' && (
                    <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17, marginTop: 12, marginHorizontal: 32 }} numberOfLines={1} ellipsizeMode="tail">
                        {op}
                    </Text>
                )}
            </View>
            <View style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 0, marginTop: 24, backgroundColor: '#5fbed5', alignItems: 'center', justifyContent: 'center' }}>
                <Avatar address={friendlyAddress} id={friendlyAddress} size={84} image={transaction.icon ? transaction.icon : undefined} spam={spam} />
            </View>
            {spam && (
                <View style={{
                    borderColor: '#ADB6BE',
                    borderWidth: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 4,
                    marginTop: 13,
                    paddingHorizontal: 4
                }}>
                    <Text style={{ color: Theme.textSecondary, fontSize: 13 }}>{'SPAM'}</Text>
                </View>
            )}
            <View style={{ marginTop: spam ? 34 - 13 : 34 }}>
                {transaction.base.status === 'failed' ? (
                    <Text style={{ color: 'orange', fontWeight: '600', fontSize: 16, marginRight: 2 }}>failed</Text>
                ) : (
                    <Text style={{ color: item.amount.gte(new BN(0)) ? spam ? Theme.textColor : '#4FAE42' : '#000000', fontWeight: '800', fontSize: 36, marginRight: 2 }} numberOfLines={1}>
                        <ValueComponent value={item.amount} decimals={item.kind === 'token' ? item.decimals : undefined} centFontStyle={{ fontSize: 30, fontWeight: '400' }} />
                        {item.kind === 'token' ? ' ' + item.symbol : ''}
                    </Text>
                )}
            </View>
            <Text style={{ color: Theme.textSecondary, fontSize: 12, marginTop: 10 }}>
                {`${formatDate(transaction.base.time, 'dd.MM.yyyy')} ${formatTime(transaction.base.time)}`}
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 39 }} collapsable={false}>
                {transaction.base.kind === 'out' && (transaction.base.body === null || transaction.base.body.type !== 'payload') && (
                    <Pressable
                        style={(p) => ({ flexGrow: 1, flexBasis: 0, marginRight: 7, justifyContent: 'center', alignItems: 'center', height: 66, backgroundColor: p.pressed ? Theme.selector : 'white', borderRadius: 14 })}
                        onPress={() => navigation.navigateSimpleTransfer({
                            target: transaction.base.address!.toFriendly({ testOnly: AppConfig.isTestnet }),
                            comment: transaction.base.body && transaction.base.body.type === 'comment' ? transaction.base.body.comment : null,
                            amount: transaction.base.amount.neg(),
                            job: null,
                            stateInit: null,
                            jetton: null,
                            callback: null
                        })}
                    >
                        <View style={{ backgroundColor: Theme.accent, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                            <Image source={require('../../../assets/ic_change.png')} />
                        </View>
                        <Text style={{ fontSize: 13, color: Theme.accentText, marginTop: 4 }}>{t('txPreview.sendAgain')}</Text>
                    </Pressable>
                )}
            </View>
            <View style={{
                marginBottom: 16, marginTop: 14,
                backgroundColor: "white",
                borderRadius: 14,
                justifyContent: 'center',
                width: '100%'
            }}>
                {operation.comment && !(spam && !dontShowComments) && (
                    <>
                        <MenuComponent content={operation.comment}>
                            <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
                                <Text
                                    style={{
                                        textAlign: 'left',
                                        fontWeight: '600',
                                        fontSize: 16,
                                        lineHeight: 20
                                    }}
                                >
                                    {operation.comment}
                                </Text>
                                <Text style={{ marginTop: 5, fontWeight: '400', color: '#8E979D' }}>
                                    {t('common.comment')}
                                </Text>
                            </View>
                        </MenuComponent>
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 15 }} />
                    </>
                )}
                <View style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
                    <WalletAddress
                        address={operation.address.toFriendly({ testOnly: AppConfig.isTestnet }) || address.toFriendly({ testOnly: AppConfig.isTestnet })}
                        textProps={{ numberOfLines: undefined }}
                        textStyle={{
                            textAlign: 'left',
                            fontWeight: '600',
                            fontSize: 16,
                            lineHeight: 20
                        }}
                        style={{
                            width: undefined,
                            marginTop: undefined
                        }}
                        actions={[
                            {
                                title: t('contacts.contact'),
                                id: 'contact',
                                image: Platform.OS === 'ios' ? 'person.crop.circle' : undefined,
                                onAction: () => onAddressContact(operation.address || address)
                            },
                            {
                                title: t('spamFilter.blockConfirm'),
                                id: 'block',
                                image: Platform.OS === 'ios' ? 'exclamationmark.octagon' : undefined,
                                attributes: { destructive: true },
                                onAction: () => onMarkAddressSpam(operation.address || address)
                            },
                        ]}
                    />
                    <View style={{
                        flexDirection: 'row',
                        width: '100%',
                        alignItems: 'center',
                    }}>
                        <Text style={{
                            marginTop: 5,
                            fontWeight: '400',
                            color: '#8E979D',
                            marginRight: 16, flexGrow: 1
                        }}>
                            {t('common.walletAddress')}
                        </Text>
                        {!!known && (
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
                                        color: '#858B93',
                                        alignSelf: 'flex-start',
                                    }}
                                    numberOfLines={1}
                                    ellipsizeMode={'tail'}
                                >
                                    {known.name}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 15 }} />
                <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16 }}>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 16,
                        lineHeight: 20,
                    }}>
                        {t('txPreview.blockchainFee')}
                    </Text>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 16,
                        lineHeight: 20,
                    }}>
                        {fromNano(transaction.base.fees)}
                    </Text>
                </View>
            </View>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={navigation.goBack}
                />
            )}
        </View>
    );
});