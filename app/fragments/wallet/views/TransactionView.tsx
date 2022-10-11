import BN from 'bn.js';
import * as React from 'react';
import { Image, Platform, Share, Text, ToastAndroid, useWindowDimensions, View } from 'react-native';
import { Address } from 'ton';
import { Theme } from '../../../Theme';
import { ValueComponent } from '../../../components/ValueComponent';
import { formatTime } from '../../../utils/dates';
import { AddressComponent } from '../../../components/AddressComponent';
import { TouchableHighlight } from 'react-native';
import { AppConfig } from '../../../AppConfig';
import { Avatar } from '../../../components/Avatar';
import { PendingTransactionAvatar } from '../../../components/PendingTransactionAvatar';
import { KnownWallet, KnownWallets } from '../../../secure/KnownWallets';
import { shortAddress } from '../../../utils/shortAddress';
import { t } from '../../../i18n/t';
import { Engine } from '../../../engine/Engine';
import ContextMenu, { ContextMenuAction } from "react-native-context-menu-view";
import { confirmAlert } from '../../../utils/confirmAlert';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';

function knownAddressLabel(wallet: KnownWallet, friendly?: string) {
    return wallet.name + ` (${shortAddress({ friendly })})`
}

export function TransactionView(props: { own: Address, tx: string, separator: boolean, engine: Engine, onPress: (src: string) => void }) {
    const navigation = useTypedNavigation();
    const dimentions = useWindowDimensions();
    const fontScaleNormal = dimentions.fontScale <= 1;

    const tx = props.engine.products.main.useTransaction(props.tx);
    let transactionHash = props.engine.transactions.getHash(props.engine.address, tx.base.lt);
    let parsed = tx.base;
    let operation = tx.operation;

    // Operation
    let friendlyAddress = operation.address.toFriendly({ testOnly: AppConfig.isTestnet });
    let avatarId = operation.address.toFriendly({ testOnly: AppConfig.isTestnet });
    let item = operation.items[0];
    let amount = item.amount;
    let op: string;
    if (operation.op) {
        op = operation.op;
        if (op === 'airdrop') {
            op = t('tx.airdrop');
        }
    } else {
        if (parsed.kind === 'out') {
            if (parsed.status === 'pending') {
                op = t('tx.sending');
            } else {
                op = t('tx.sent');
            }
        } else if (parsed.kind === 'in') {
            if (parsed.bounced) {
                op = '⚠️ ' + t('tx.bounced');
            } else {
                op = t('tx.received');
            }
        } else {
            throw Error('Unknown kind');
        }
    }

    const contact = props.engine.products.settings.useContactAddress(operation.address);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (KnownWallets[friendlyAddress]) {
        known = KnownWallets[friendlyAddress];
    } else if (operation.title) {
        known = { name: operation.title };
    } else if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }

    const spamMinAmount = props.engine.products.settings.useSpamMinAmount();
    const isSpam = props.engine.products.settings.useDenyAddress(operation.address);

    let spam = props.engine.products.serverConfig.useIsSpamWallet(friendlyAddress)
        || isSpam
        || (
            parsed.amount.abs().lt(spamMinAmount)
            && tx.base.body?.type === 'comment'
            && !KnownWallets[friendlyAddress]
            && !AppConfig.isTestnet
        );


    // 
    // Address actions
    // 
    const settings = props.engine.products.settings;

    const addressLink = (AppConfig.isTestnet ? 'https://test.tonhub.com/transfer/' : 'https://tonhub.com/transfer/')
        + operation.address.toFriendly({ testOnly: AppConfig.isTestnet });

    const onShare = React.useCallback((link: string) => {
        if (Platform.OS === 'ios') {
            Share.share({ title: t('receive.share.title'), url: link });
        } else {
            Share.share({ title: t('receive.share.title'), message: link });
        }
    }, []);

    const onMarkAddressSpam = React.useCallback(async (addr: Address) => {
        const confirmed = await confirmAlert('spamFilter.blockConfirm');
        if (confirmed) {
            settings.addToDenyList(addr);
        }
    }, []);

    const onAddressContact = React.useCallback((addr: Address) => {
        navigation.navigate('Contact', { address: addr.toFriendly({ testOnly: AppConfig.isTestnet }) });
    }, []);

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

    const onRepeatTx = React.useCallback(() => {
        navigation.navigateSimpleTransfer({
            target: tx.base.address!.toFriendly({ testOnly: AppConfig.isTestnet }),
            comment: tx.base.body && tx.base.body.type === 'comment' ? tx.base.body.comment : null,
            amount: tx.base.amount.neg(),
            job: null,
            stateInit: null,
            jetton: null,
            callback: null
        })
    }, [tx]);

    const addressActions: ContextMenuAction[] = Platform.OS === 'ios' ? [
        {
            title: t('common.walletAddress'), actions: [
                { title: t('common.copy'), systemIcon: 'doc.on.doc' },
                { title: t('common.share'), systemIcon: 'square.and.arrow.up' },
                { title: t('contacts.contact'), systemIcon: 'person.crop.circle' }
            ]
        },
        // TODO: Add after New txs preview ui merge
        // {
        //     title: t('common.tx'), actions: [
        //         { title: t('common.share'), systemIcon: 'square.and.arrow.up' }, 
        //     ]
        // },
    ] : [
        { title: t('common.walletAddress') + ': ' + t('common.copy') },
        { title: t('common.walletAddress') + ': ' + t('common.share') },
        { title: t('common.walletAddress') + ': ' + t('contacts.contact') }
    ];

    if (!spam) {
        if (Platform.OS !== 'ios') {
            addressActions.push({
                title: t('common.walletAddress') + ': ' + t('spamFilter.blockConfirm'),
                destructive: true
            });
        } else {
            addressActions[0].actions?.push({
                title: t('spamFilter.blockConfirm'),
                destructive: true,
                systemIcon: 'exclamationmark.octagon'
            });
        }
    }

    if (Platform.OS !== 'ios') {
        addressActions.push(...[
            // { title: t('common.tx') + ': ' + t('common.share') }, 
            // TODO: Add after New txs preview ui merge
        ])
        if (tx.base.kind === 'out' && (tx.base.body === null || tx.base.body.type !== 'payload')) {
            addressActions.push({ title: t('common.tx') + ': ' + t('txPreview.sendAgain') })
        }
    } else {
        if (tx.base.kind === 'out' && (tx.base.body === null || tx.base.body.type !== 'payload')) {
            addressActions.push({
                title: t('common.tx'),
                actions: [
                    { title: t('txPreview.sendAgain'), systemIcon: 'repeat' }
                ]
            });
        }
    }

    return (
        <ContextMenu
            actions={addressActions}
            onPress={(e) => {
                if (Platform.OS !== 'ios') {
                    switch (e.nativeEvent.name) {
                        case t('common.walletAddress') + ': ' + t('common.copy'): {
                            onCopy(operation.address.toFriendly({ testOnly: AppConfig.isTestnet }));
                            break;
                        }
                        case t('common.walletAddress') + ': ' + t('common.share'): {
                            onShare(addressLink);
                            break;
                        }
                        case t('common.walletAddress') + ': ' + t('contacts.contact'): {
                            onAddressContact(operation.address);
                            break;
                        }
                        case t('common.walletAddress') + ': ' + t('spamFilter.blockConfirm'): {
                            onMarkAddressSpam(operation.address);
                            break;
                        }
                        case t('common.tx') + ': ' + t('txPreview.sendAgain'): {
                            onRepeatTx();
                            break;
                        }
                        // TODO: Add after New txs preview ui merge
                        // case t('common.tx') + ': ' + t('common.share'): {
                        //     onShare(txLink); 
                        //     break;
                        // }
                        default:
                            break;
                    }
                } else { // iOS handling
                    if (e.nativeEvent.index === 0 && e.nativeEvent.name === t('common.copy')) {
                        onCopy(operation.address.toFriendly({ testOnly: AppConfig.isTestnet }));
                    }
                    if (e.nativeEvent.index === 0 && e.nativeEvent.name === t('common.share')) {
                        onShare(operation.address.toFriendly({ testOnly: AppConfig.isTestnet }));
                    }
                    if (e.nativeEvent.index === 0 && e.nativeEvent.name === t('contacts.contact')) {
                        onAddressContact(operation.address);
                    }
                    if (e.nativeEvent.index === 0 && e.nativeEvent.name === t('spamFilter.blockConfirm')) {
                        onMarkAddressSpam(operation.address);
                    }
                    if (e.nativeEvent.index === 1 && e.nativeEvent.name === t('txPreview.sendAgain')) {
                        onRepeatTx();
                    }
                }
                console.warn(
                    `Pressed ${e.nativeEvent.name} at index ${e.nativeEvent.index}`
                );
            }}>
            <TouchableHighlight
                onPress={() => props.onPress(props.tx)}
                underlayColor={Theme.selector}
                style={{ backgroundColor: Theme.item }}
                onLongPress={() => { }} /* Adding for Android not calling onPress while ContextMenu is LongPressed */
            >
                <View style={{ alignSelf: 'stretch', flexDirection: 'row', height: fontScaleNormal ? 62 : undefined, minHeight: fontScaleNormal ? undefined : 62 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginVertical: 10, marginLeft: 10, marginRight: 10 }}>
                        {parsed.status !== 'pending' && (
                            <Avatar
                                address={friendlyAddress}
                                id={avatarId}
                                size={42}
                                image={tx.icon ? tx.icon : undefined}
                                spam={spam}
                                markContact={!!contact}
                            />
                        )}
                        {parsed.status === 'pending' && (
                            <PendingTransactionAvatar address={friendlyAddress} avatarId={avatarId} />
                        )}
                    </View>
                    <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 10, marginRight: 10 }}>
                            <View style={{
                                flexDirection: 'row',
                                flexGrow: 1, flexBasis: 0, marginRight: 16,
                            }}>
                                <Text style={{ color: Theme.textColor, fontSize: 16, fontWeight: '600' }} ellipsizeMode="tail" numberOfLines={1}>{op}</Text>
                                {spam && (
                                    <View style={{
                                        borderColor: '#ADB6BE',
                                        borderWidth: 1,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderRadius: 4,
                                        marginLeft: 6,
                                        paddingHorizontal: 4
                                    }}>
                                        <Text style={{ color: Theme.textSecondary, fontSize: 13 }}>{'SPAM'}</Text>
                                    </View>
                                )}
                            </View>
                            {parsed.status === 'failed' ? (
                                <Text style={{ color: 'orange', fontWeight: '600', fontSize: 16, marginRight: 2 }}>failed</Text>
                            ) : (
                                <Text
                                    style={{
                                        color: item.amount.gte(new BN(0)) ? spam ? Theme.textColor : '#4FAE42' : '#FF0000',
                                        fontWeight: '400',
                                        fontSize: 16,
                                        marginRight: 2
                                    }}>
                                    <ValueComponent value={item.amount} decimals={item.kind === 'token' ? item.decimals : undefined} />
                                    {item.kind === 'token' ? ' ' + item.symbol : ''}
                                </Text>
                            )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginRight: 10, marginBottom: fontScaleNormal ? undefined : 10 }}>
                            <Text
                                style={{ color: Theme.textSecondary, fontSize: 13, flexGrow: 1, flexBasis: 0, marginRight: 16 }}
                                ellipsizeMode="middle"
                                numberOfLines={1}
                            >
                                {known ? knownAddressLabel(known, friendlyAddress) : <AddressComponent address={operation.address} />}
                            </Text>
                            {!!operation.comment ? <Image source={require('../../../../assets/comment.png')} style={{ marginRight: 4, transform: [{ translateY: 1.5 }] }} /> : null}
                            <Text style={{ color: Theme.textSecondary, fontSize: 12, marginTop: 4 }}>{formatTime(parsed.time)}</Text>
                        </View>
                        <View style={{ flexGrow: 1 }} />
                        {props.separator && (<View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider }} />)}
                    </View>
                </View>
            </TouchableHighlight>
        </ContextMenu>
    );
}
TransactionView.displayName = 'TransactionView';