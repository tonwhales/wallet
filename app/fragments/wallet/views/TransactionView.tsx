import BN from 'bn.js';
import * as React from 'react';
import { NativeSyntheticEvent, Text, View, Image, Platform, Share } from 'react-native';
import { Address } from '@ton/core';
import { ValueComponent } from '../../../components/ValueComponent';
import { formatTime } from '../../../utils/dates';
import { AddressComponent } from '../../../components/AddressComponent';
import { TouchableHighlight } from 'react-native';
import { Avatar } from '../../../components/Avatar';
import { KnownJettonMasters, KnownWallet, KnownWallets } from '../../../secure/KnownWallets';
import { shortAddress } from '../../../utils/shortAddress';
import { t } from '../../../i18n/t';
import ContextMenu, { ContextMenuAction, ContextMenuOnPressNativeEvent } from "react-native-context-menu-view";
import { confirmAlert } from '../../../utils/confirmAlert';
import { TransactionDescription } from '../../../engine/hooks/useAccountTransactions';
import { ThemeType } from '../../../engine/state/theme';
import { memo, useCallback, useMemo } from 'react';
import { PendingTransactionAvatar } from '../../../components/PendingTransactionAvatar';
import { useNetwork } from '../../../engine/hooks/useNetwork';
import { useSpamMinAmount } from '../../../engine/hooks/spam/useSpamMinAmount';
import { useDenyAddress } from '../../../engine/hooks/contacts/useDenyAddress';
import { useIsSpamWallet } from '../../../engine/hooks/spam/useIsSpamWallet';
import { useSelectedAccount } from '../../../engine/hooks/useSelectedAccount';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import { useAddToDenyList } from '../../../engine/effects/spam/useAddToDenyList';
import { useContact } from '../../../engine/hooks/contacts/useContact';

export function knownAddressLabel(wallet: KnownWallet, isTestnet: boolean, friendly?: string) {
    return wallet.name + ` (${shortAddress({ friendly, isTestnet })})`
}

export const TransactionView = memo((props: {
    own: Address,
    tx: TransactionDescription,
    separator: boolean,
    theme: ThemeType,
    fontScaleNormal: boolean,
    onPress: (src: TransactionDescription) => void
}) => {
    const { isTestnet } = useNetwork();
    const theme = props.theme;
    const fontScaleNormal = props.fontScaleNormal;

    const tx = props.tx;
    const parsed = tx.base.parsed;
    const operation = tx.base.operation;
    const kind = tx.base.parsed.kind;
    const status = tx.base.parsed.status;
    const item = operation.items[0];
    const itemAmount = BigInt(item.amount);
    const absAmount = itemAmount < 0 ? itemAmount * BigInt(-1) : itemAmount;
    const opAddress = tx.base.parsed.resolvedAddress;
    const verified = !!tx.verified || !!KnownJettonMasters(isTestnet)[opAddress];

    const navigation = useTypedNavigation();
    const selectedAccount = useSelectedAccount();
    const contact = useContact(opAddress);
    const isSpam = useDenyAddress(opAddress);
    const [spamMinAmount,] = useSpamMinAmount();
    const addToDenyList = useAddToDenyList();

    const op = useMemo(() => {
        if (operation.op) {
            return t(operation.op.res, operation.op.options);
        } else {
            if (parsed.kind === 'out') {
                if (parsed.status === 'pending') {
                    return t('tx.sending');
                } else {
                    return t('tx.sent');
                }
            } else if (parsed.kind === 'in') {
                if (parsed.bounced) {
                    return '⚠️ ' + t('tx.bounced');
                } else {
                    return t('tx.received');
                }
            } else {
                throw Error('Unknown kind');
            }
        }
    }, [operation.op, parsed]);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (KnownWallets(isTestnet)[opAddress]) {
        known = KnownWallets(isTestnet)[opAddress];
    } else if (tx.title) {
        known = { name: tx.title };
    } else if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }

    let spam = useIsSpamWallet(opAddress)
        || isSpam
        || (
            absAmount < spamMinAmount
            && !!tx.base.operation.comment
            && !KnownWallets(isTestnet)[opAddress]
            && !isTestnet
        ) && kind !== 'out';


    const transactionActions: ContextMenuAction[] = status !== 'pending'
        ? [
            { title: t('txActions.addressShare'), systemIcon: Platform.OS === 'ios' ? 'square.and.arrow.up' : undefined },
            { title: !!contact ? t('txActions.addressContactEdit') : t('txActions.addressContact'), systemIcon: Platform.OS === 'ios' ? 'person.crop.circle' : undefined },
            ...(!spam ? [{ title: t('txActions.addressMarkSpam'), destructive: true, systemIcon: Platform.OS === 'ios' ? 'exclamationmark.octagon' : undefined }] : []),
            ...(kind === 'out' ? [{ title: t('txActions.txRepeat'), systemIcon: Platform.OS === 'ios' ? 'repeat' : undefined }] : []),
            { title: t('txActions.txShare'), systemIcon: Platform.OS === 'ios' ? 'square.and.arrow.up' : undefined }
        ]
        : [];

    const addressLink = `${(isTestnet ? 'https://test.tonhub.com/transfer/' : 'https://tonhub.com/transfer/')}${opAddress}`;

    const txId = useMemo(() => {
        return `${tx.base.lt}_${tx.base.hash}`;
    }, [tx]);

    const explorerTxLink = useMemo(() => {
        if (!selectedAccount) {
            return null;
        }
        return `${isTestnet ? 'https://test.tonhub.com' : 'https://tonhub.com'}/share/tx/`
            + `${selectedAccount.addressString}/`
            + `${txId}`
    }, [txId, selectedAccount, isTestnet]);

    const onShare = useCallback((link: string) => {
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

    const onMarkAddressSpam = useCallback(async () => {
        const confirmed = await confirmAlert('spamFilter.blockConfirm');
        if (confirmed) {
            addToDenyList(opAddress);
        }
    }, [addToDenyList]);

    const handleAction = useCallback((e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => {
        switch (e.nativeEvent.name) {
            case t('txActions.addressShare'): {
                onShare(addressLink);
                break;
            }
            case t('txActions.addressContact'): {
                navigation.navigate('Contact', { address: opAddress });
                break;
            }
            case t('txActions.addressContactEdit'): {
                navigation.navigate('Contact', { address: opAddress });
                break;
            }
            case t('txActions.addressMarkSpam'): {
                onMarkAddressSpam();
                break;
            }
            case t('txActions.txRepeat'): {
                navigation.navigateSimpleTransfer({
                    target: opAddress,
                    comment: tx.base.parsed.body && tx.base.parsed.body.type === 'comment' ? tx.base.parsed.body.comment : null,
                    amount: BigInt(tx.base.parsed.amount),
                    job: null,
                    stateInit: null,
                    jetton: null,
                    callback: null
                })
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
    }, [addressLink, explorerTxLink, onShare]);

    return (
        <ContextMenu
            actions={transactionActions}
            onPress={handleAction}>
            <TouchableHighlight
                onPress={() => props.onPress(props.tx)}
                underlayColor={theme.selector}
                style={{ backgroundColor: theme.item }}
                onLongPress={() => { }} /* Adding for Android not calling onPress while ContextMenu is LongPressed */
            >
                <View style={{ alignSelf: 'stretch', flexDirection: 'row', height: fontScaleNormal ? 62 : undefined, minHeight: fontScaleNormal ? undefined : 62 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginVertical: 10, marginLeft: 10, marginRight: 10 }}>
                        {status !== 'pending' ? (
                            <Avatar
                                address={opAddress}
                                id={opAddress}
                                size={42}
                                image={tx.icon ? tx.icon : undefined}
                                spam={spam}
                                markContact={!!contact}
                                verified={verified}
                            />
                        ) : (
                            <PendingTransactionAvatar address={operation.address} avatarId={operation.address} />
                        )}
                    </View>
                    <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                        <View style={{ flexDirection: 'row', marginTop: 10, marginRight: 10 }}>
                            <View style={{
                                flexDirection: 'row',
                                flexGrow: 1, flexBasis: 0, marginRight: 16,
                            }}>
                                <Text
                                    style={{ color: theme.textColor, fontSize: 16, fontWeight: '600', flexShrink: 1 }}
                                    ellipsizeMode="tail"
                                    numberOfLines={1}>
                                    {op}
                                </Text>
                                {spam && (
                                    <View style={{
                                        borderColor: theme.textSecondaryBorder,
                                        borderWidth: 1,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderRadius: 4,
                                        marginLeft: 6,
                                        paddingHorizontal: 4
                                    }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{'SPAM'}</Text>
                                    </View>
                                )}
                            </View>
                            {status === 'failed' ? (
                                <Text style={{ color: theme.failed, fontWeight: '600', fontSize: 16, marginRight: 2 }}>
                                    {t('tx.failed')}
                                </Text>
                            ) : (
                                <Text
                                    style={{
                                        color: itemAmount > 0
                                            ? spam
                                                ? theme.textColor
                                                : theme.pricePositive
                                            : theme.priceNegative,
                                        fontWeight: '400',
                                        fontSize: 16,
                                        marginRight: 2,
                                    }}>
                                    <ValueComponent
                                        value={item.amount}
                                        decimals={item.kind === 'token' ? tx.masterMetadata?.decimals : undefined}
                                    />
                                    {item.kind === 'token' ? ' ' + tx.masterMetadata?.symbol : ''}
                                </Text>
                            )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginRight: 10, marginBottom: fontScaleNormal ? undefined : 10 }}>
                            <Text
                                style={{ color: theme.textSecondary, fontSize: 13, flexGrow: 1, flexBasis: 0, marginRight: 16 }}
                                ellipsizeMode="middle"
                                numberOfLines={1}
                            >
                                {known ? knownAddressLabel(known, isTestnet, opAddress) : <AddressComponent address={opAddress} />}
                            </Text>
                            {!!operation.comment ? <Image source={require('../../../../assets/comment.png')} style={{ marginRight: 4, transform: [{ translateY: 1.5 }] }} /> : null}
                            <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>{formatTime(tx.base.time)}</Text>
                        </View>
                        <View style={{ flexGrow: 1 }} />
                        {props.separator && (<View style={{ height: 1, alignSelf: 'stretch', backgroundColor: theme.divider }} />)}
                    </View>
                </View>
            </TouchableHighlight>
        </ContextMenu>
    );
});