import BN from 'bn.js';
import * as React from 'react';
import { Image, NativeSyntheticEvent, Platform, Share, Text, ToastAndroid, useWindowDimensions, View } from 'react-native';
import { Address } from 'ton';
import { Theme } from '../../../Theme';
import { ValueComponent } from '../../../components/ValueComponent';
import { formatTime } from '../../../utils/dates';
import { AddressComponent } from '../../../components/AddressComponent';
import { TouchableHighlight } from 'react-native';
import { AppConfig } from '../../../AppConfig';
import { Avatar } from '../../../components/Avatar';
import { PendingTransactionAvatar } from '../../../components/PendingTransactionAvatar';
import { KnownJettonMasters, KnownWallet, KnownWallets } from '../../../secure/KnownWallets';
import { shortAddress } from '../../../utils/shortAddress';
import { t } from '../../../i18n/t';
import { Engine } from '../../../engine/Engine';
import ContextMenu, { ContextMenuAction, ContextMenuOnPressNativeEvent } from "react-native-context-menu-view";
import { confirmAlert } from '../../../utils/confirmAlert';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';

function knownAddressLabel(wallet: KnownWallet, friendly?: string) {
    return wallet.name + ` (${shortAddress({ friendly })})`
}

export function LedgerTransactionView(props: {
    own: Address,
    tx: string,
    separator: boolean,
    engine: Engine,
    onPress: (src: string) => void
}) {
    const navigation = useTypedNavigation();
    const dimentions = useWindowDimensions();
    const fontScaleNormal = dimentions.fontScale <= 1;

    const tx = props.engine.products.ledger.useTransaction(props.tx);
    if (!tx) {
        return <></>;
    }
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

    const verified = !!tx.verified
        || !!KnownJettonMasters[operation.address.toFriendly({ testOnly: AppConfig.isTestnet })];

    const spamMinAmount = props.engine.products.settings.useSpamMinAmount();
    const isSpam = props.engine.products.settings.useDenyAddress(operation.address);

    let spam = props.engine.products.serverConfig.useIsSpamWallet(friendlyAddress)
        || isSpam
        || (
            parsed.amount.abs().lt(spamMinAmount)
            && tx.base.body?.type === 'comment'
            && !KnownWallets[friendlyAddress]
            && !AppConfig.isTestnet
        ) && tx.base.kind !== 'out';

    // 
    // Address actions
    // 
    const settings = props.engine.products.settings;

    const addressLink = (AppConfig.isTestnet ? 'https://test.tonhub.com/transfer/' : 'https://tonhub.com/transfer/')
        + operation.address.toFriendly({ testOnly: AppConfig.isTestnet });

    const txId = React.useMemo(() => {
        if (!tx.base.lt) {
            return null;
        }
        if (!tx.base.hash) {
            return null;
        }
        return tx.base.lt +
            '_' +
            tx.base.hash.toString('hex')
    }, [tx]);

    const explorerTxLink = React.useMemo(() => {
        if (!txId) {
            return null;
        }
        return (AppConfig.isTestnet ? 'https://test.tonwhales.com' : 'https://tonwhales.com')
            + '/explorer/address/' +
            operation.address.toFriendly() +
            '/' + txId
    }, [txId]);

    const onShare = React.useCallback((link: string) => {
        let title = t('receive.share.title');
        if (link === explorerTxLink) {
            title = t('txActions.share.transaction');
        }
        if (link === addressLink) {
            title = t('txActions.share.address');
        }
        if (Platform.OS === 'ios') {
            Share.share({ title: title, url: link });
        } else {
            Share.share({ title: title, message: link });
        }
    }, [explorerTxLink, addressLink]);

    const onMarkAddressSpam = React.useCallback(async (addr: Address) => {
        const confirmed = await confirmAlert('spamFilter.blockConfirm');
        if (confirmed) {
            settings.addToDenyList(addr);
        }
    }, []);

    const onAddressContact = React.useCallback((addr: Address) => {
        navigation.navigate('Contact', { address: addr.toFriendly({ testOnly: AppConfig.isTestnet }) });
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
        });
    }, [tx, operation]);

    const transactionActions: ContextMenuAction[] = tx.base.status !== 'pending' ? [
        { title: t('txActions.addressShare'), systemIcon: Platform.OS === 'ios' ? 'square.and.arrow.up' : undefined },
        { title: !!contact ? t('txActions.addressContactEdit') : t('txActions.addressContact'), systemIcon: Platform.OS === 'ios' ? 'person.crop.circle' : undefined },
        ...(!spam ? [{ title: t('txActions.addressMarkSpam'), destructive: true, systemIcon: Platform.OS === 'ios' ? 'exclamationmark.octagon' : undefined }] : []),
        ...(tx.base.kind === 'out' ? [{ title: t('txActions.txRepeat'), systemIcon: Platform.OS === 'ios' ? 'repeat' : undefined }] : []),
        { title: t('txActions.txShare'), systemIcon: Platform.OS === 'ios' ? 'square.and.arrow.up' : undefined }
    ] : [];

    const handleAction = React.useCallback(
        (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => {
            switch (e.nativeEvent.name) {
                case t('txActions.addressShare'): {
                    onShare(addressLink);
                    break;
                }
                case t('txActions.addressContact'): {
                    onAddressContact(operation.address);
                    break;
                }
                case t('txActions.addressContactEdit'): {
                    onAddressContact(operation.address);
                    break;
                }
                case t('txActions.addressMarkSpam'): {
                    onMarkAddressSpam(operation.address);
                    break;
                }
                case t('txActions.txRepeat'): {
                    // onRepeatTx();
                    break;
                }
                case t('txActions.txShare'): {
                    if (explorerTxLink) {
                        onShare(explorerTxLink);
                    }
                    break;
                }
                default:
                    break;
            }
        },
        [addressLink, explorerTxLink, onShare],
    );

    return (
        <ContextMenu
            actions={transactionActions}
            onPress={handleAction}>
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
                                verified={verified}
                            />
                        )}
                        {parsed.status === 'pending' && (
                            <PendingTransactionAvatar address={friendlyAddress} avatarId={avatarId} />
                        )}
                    </View>
                    <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                        <View style={{ flexDirection: 'row', marginTop: 10, marginRight: 10 }}>
                            <View style={{
                                flexDirection: 'row',
                                flexGrow: 1, flexBasis: 0, marginRight: 16,
                            }}>
                                <Text
                                    style={{ color: Theme.textColor, fontSize: 16, fontWeight: '600', flexShrink: 1 }}
                                    ellipsizeMode="tail"
                                    numberOfLines={1}>
                                    {op}
                                </Text>
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
                                <Text style={{ color: 'orange', fontWeight: '600', fontSize: 16, marginRight: 2 }}>
                                    {t('tx.failed')}
                                </Text>
                            ) : (
                                <Text
                                    style={{
                                        color: item.amount.gte(new BN(0)) ? spam ? Theme.textColor : '#4FAE42' : '#FF0000',
                                        fontWeight: '400',
                                        fontSize: 16,
                                        marginRight: 2,
                                    }}>
                                    <ValueComponent
                                        value={item.amount}
                                        decimals={item.kind === 'token' ? item.decimals : undefined}
                                    />
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
LedgerTransactionView.displayName = 'LedgerTransactionView';