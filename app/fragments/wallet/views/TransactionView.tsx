import BN from 'bn.js';
import * as React from 'react';
import { NativeSyntheticEvent, Platform, Pressable, Share, Text, useWindowDimensions, View } from 'react-native';
import { Address } from 'ton';
import { ValueComponent } from '../../../components/ValueComponent';
import { formatTime } from '../../../utils/dates';
import { AddressComponent } from '../../../components/address/AddressComponent';
import { Avatar } from '../../../components/Avatar';
import { PendingTransactionAvatar } from '../../../components/PendingTransactionAvatar';
import { KnownJettonMasters, KnownWallet, KnownWallets } from '../../../secure/KnownWallets';
import { shortAddress } from '../../../utils/shortAddress';
import { t } from '../../../i18n/t';
import { Engine } from '../../../engine/Engine';
import ContextMenu, { ContextMenuAction, ContextMenuOnPressNativeEvent } from "react-native-context-menu-view";
import { confirmAlert } from '../../../utils/confirmAlert';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import { useAppConfig } from '../../../utils/AppConfigContext';
import { PriceComponent } from '../../../components/PriceComponent';

function knownAddressLabel(wallet: KnownWallet, isTestnet: boolean, friendly?: string) {
    return wallet.name + ` (${shortAddress({ friendly, isTestnet })})`
}

export function TransactionView(props: {
    own: Address,
    tx: string,
    separator: boolean,
    engine: Engine,
    onPress: (src: string) => void
}) {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const dimentions = useWindowDimensions();

    const tx = props.engine.products.main.useTransaction(props.tx);
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
                op = t('tx.bounced');
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
    if (KnownWallets(AppConfig.isTestnet)[friendlyAddress]) {
        known = KnownWallets(AppConfig.isTestnet)[friendlyAddress];
    } else if (operation.title) {
        known = { name: operation.title };
    } else if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }

    const verified = !!tx.verified
        || !!KnownJettonMasters(AppConfig.isTestnet)[operation.address.toFriendly({ testOnly: AppConfig.isTestnet })];

    const spamMinAmount = props.engine.products.settings.useSpamMinAmount();
    const isSpam = props.engine.products.settings.useDenyAddress(operation.address);

    let spam = props.engine.products.serverConfig.useIsSpamWallet(friendlyAddress)
        || isSpam
        || (
            parsed.amount.abs().lt(spamMinAmount)
            && tx.base.body?.type === 'comment'
            && !KnownWallets(AppConfig.isTestnet)[friendlyAddress]
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
        })
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
                    onRepeatTx();
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
            onPress={handleAction}
        >
            <Pressable
                onPress={() => props.onPress(props.tx)}
                style={{ paddingHorizontal: 16, paddingVertical: 20, paddingBottom: operation.comment ? 0 : undefined }}
                onLongPress={() => { }} /* Adding for Android not calling onPress while ContextMenu is LongPressed */
            >
                <View style={{
                    alignSelf: 'stretch',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{
                        width: 46, height: 46,
                        borderRadius: 23,
                        borderWidth: 0, marginRight: 10,
                        justifyContent: 'center', alignItems: 'center',
                        backgroundColor: Theme.border
                    }}>
                        {parsed.status !== 'pending' && (
                            <Avatar
                                size={42}
                                address={operation.address.toFriendly({ testOnly: AppConfig.isTestnet })}
                                id={avatarId}
                                borderWith={0}
                            />
                        )}
                        {parsed.status === 'pending' && (
                            <PendingTransactionAvatar
                                kind={tx.base.kind}
                                address={friendlyAddress}
                                avatarId={avatarId}
                            />
                        )}
                    </View>
                    <View style={{ flex: 1, marginRight: 4 }}>
                        <Text
                            style={{ color: Theme.textPrimary, fontSize: 17, fontWeight: '600', lineHeight: 24, flexShrink: 1 }}
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                        >
                            {op}
                        </Text>
                        {spam && (
                            <View style={{
                                borderColor: Theme.textSecondary,
                                borderWidth: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: 4,
                                paddingHorizontal: 4
                            }}>
                                <Text style={{ color: Theme.textSecondary, fontSize: 13 }}>{'SPAM'}</Text>
                            </View>
                        )}
                        <Text
                            style={{ color: Theme.textSecondary, fontSize: 15, marginRight: 8, lineHeight: 20, fontWeight: '400', marginTop: 2 }}
                            ellipsizeMode="middle"
                            numberOfLines={1}
                        >
                            {known
                                ? knownAddressLabel(known, AppConfig.isTestnet, friendlyAddress)
                                : <AddressComponent address={operation.address} />
                            }
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        {parsed.status === 'failed' ? (
                            <Text style={{ color: Theme.accentRed, fontWeight: '600', fontSize: 17, lineHeight: 24 }}>
                                {t('tx.failed')}
                            </Text>
                        ) : (
                            <Text
                                style={{
                                    color: tx.base.kind === 'in'
                                        ? spam
                                            ? Theme.textPrimary
                                            : Theme.accentGreen
                                        : Theme.textPrimary,
                                    fontWeight: '600',
                                    lineHeight: 24,
                                    fontSize: 17,
                                    marginRight: 2,
                                }}
                                numberOfLines={1}
                            >
                                {tx.base.kind === 'in' ? '+' : '-'}
                                <ValueComponent
                                    value={item.amount.abs()}
                                    decimals={item.kind === 'token' ? item.decimals : undefined}
                                    precision={3}
                                />
                                {item.kind === 'token' ? ' ' + item.symbol : ' TON'}
                            </Text>
                        )}
                        {item.kind !== 'token' && (
                            <PriceComponent
                                amount={item.amount.abs()}
                                prefix={tx.base.kind === 'in' ? '+' : '-'}
                                style={{
                                    height: undefined,
                                    backgroundColor: Theme.transparent,
                                    paddingHorizontal: 0, paddingVertical: 0,
                                    paddingRight: 0, paddingLeft: 0,
                                    alignSelf: 'flex-end',
                                }}
                                textStyle={{
                                    color: Theme.textSecondary,
                                    fontWeight: '400',
                                    fontSize: 15, lineHeight: 20
                                }}
                            />
                        )}
                    </View>
                </View>
                {!!operation.comment && (
                    <View style={{
                        flexShrink: 1, alignSelf: 'flex-start',
                        backgroundColor: Theme.border,
                        marginTop: 8,
                        paddingHorizontal: 10, paddingVertical: 8,
                        borderRadius: 10, marginLeft: 46 + 10, height: 36
                    }}>
                        <Text
                            numberOfLines={1}
                            ellipsizeMode={'tail'}
                            style={{ color: Theme.textPrimary, fontSize: 15, maxWidth: 400, lineHeight: 20 }}
                        >
                            {operation.comment}
                        </Text>
                    </View>
                )}
            </Pressable>
        </ContextMenu>
    );
}
TransactionView.displayName = 'TransactionView';