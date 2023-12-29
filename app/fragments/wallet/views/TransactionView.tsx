import * as React from 'react';
import { Platform, Pressable, Share, Text } from 'react-native';
import { ValueComponent } from '../../../components/ValueComponent';
import { AddressComponent } from '../../../components/address/AddressComponent';
import { Avatar } from '../../../components/Avatar';
import { PendingTransactionAvatar } from '../../../components/PendingTransactionAvatar';
import { KnownWallet, KnownWallets } from '../../../secure/KnownWallets';
import { t } from '../../../i18n/t';
import { confirmAlert } from '../../../utils/confirmAlert';
import { TypedNavigation } from '../../../utils/useTypedNavigation';
import { PriceComponent } from '../../../components/PriceComponent';
import { Address } from '@ton/core';
import { TransactionDescription } from '../../../engine/types';
import { useCallback, useMemo } from 'react';
import { ThemeType } from '../../../engine/state/theme';
import { AddressContact } from '../../../engine/hooks/contacts/useAddressBook';
import { formatTime } from '../../../utils/dates';
import { PerfText } from '../../../components/basic/PerfText';
import { AppState } from '../../../storage/appState';
import { PerfView } from '../../../components/basic/PerfView';
import { Typography } from '../../../components/styles';
import { ActionSheetOptions } from '@expo/react-native-action-sheet';

export function TransactionView(props: {
    own: Address,
    tx: TransactionDescription,
    separator: boolean,
    theme: ThemeType,
    navigation: TypedNavigation,
    onPress: (src: TransactionDescription) => void,
    ledger?: boolean,
    addToDenyList: (address: string | Address, reason: string) => void,
    spamMinAmount: bigint,
    dontShowComments: boolean,
    denyList: { [key: string]: { reason: string | null } },
    contacts: { [key: string]: AddressContact },
    isTestnet: boolean,
    spamWallets: string[],
    appState?: AppState,
    showActionSheetWithOptions?: (options: ActionSheetOptions, callback: (i?: number | undefined) => void | Promise<void>) => void,
}) {
    const {
        theme, navigation,
        tx,
        denyList, addToDenyList,
        spamMinAmount, dontShowComments, spamWallets,
        contacts,
        isTestnet,
    } = props;
    const parsed = tx.base.parsed;
    const operation = tx.base.operation;
    const kind = tx.base.parsed.kind;
    const item = operation.items[0];
    const itemAmount = BigInt(item.amount);
    const absAmount = itemAmount < 0 ? itemAmount * BigInt(-1) : itemAmount;
    const opAddress = item.kind === 'token' ? operation.address : tx.base.parsed.resolvedAddress;
    const isOwn = (props.appState?.addresses ?? []).findIndex((a) => a.address.equals(Address.parse(opAddress))) >= 0;

    const contact = contacts[opAddress];
    const isSpam = !!denyList[opAddress]?.reason;

    // Operation
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
                    return t('tx.bounced');
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
    }
    if (tx.title) {
        known = { name: tx.title };
    }
    if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }

    let spam =
        !!spamWallets.find((i) => opAddress === i)
        || isSpam
        || (
            absAmount < spamMinAmount
            && !!tx.base.operation.comment
            && !KnownWallets(isTestnet)[opAddress]
            && !isTestnet
        ) && kind !== 'out';

    // Address actions
    const addressLink = `${(isTestnet ? 'https://test.tonhub.com/transfer/' : 'https://tonhub.com/transfer/')}${opAddress}`;

    const txId = useMemo(() => {
        return `${tx.base.lt}_${tx.base.hash}`;
    }, [tx]);

    const explorerTxLink = useMemo(() => {
        return `${isTestnet ? 'https://test.tonhub.com' : 'https://tonhub.com'}/share/tx/`
            + `${props.own.toString({ testOnly: isTestnet })}/`
            + `${txId}`
    }, [txId, isTestnet, props.own]);

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
            addToDenyList(opAddress, 'spam');
        }
    }, [addToDenyList]);

    const onAddressContact = useCallback((addr: Address) => {
        navigation.navigate('Contact', { address: addr.toString({ testOnly: isTestnet }) });
    }, []);

    const onRepeatTx = useCallback(() => {
        const amount = BigInt(tx.base.parsed.amount);
        navigation.navigateSimpleTransfer({
            target: opAddress,
            comment: tx.base.parsed.body && tx.base.parsed.body.type === 'comment' ? tx.base.parsed.body.comment : null,
            amount: amount < 0n ? -amount : amount,
            job: null,
            stateInit: null,
            jetton: null,
            callback: null
        })
    }, [tx, operation]);

    const actionSheetOptions: ActionSheetOptions = {
        options: [
            t('common.cancel'),
            t('txActions.addressShare'),
            !!contact ? t('txActions.addressContactEdit') : t('txActions.addressContact'),
            t('txActions.txShare'),
            ...(!spam ? [t('txActions.addressMarkSpam')] : []),
            ...((kind === 'out' && !props.ledger) ? [t('txActions.txRepeat')] : []),
        ],
        userInterfaceStyle: theme.style,
        cancelButtonIndex: 0,
        destructiveButtonIndex: !spam ? 4 : undefined,
    }

    const handleAction = useCallback((eN?: number) => {
        switch (eN) {
            case 1: {
                onShare(addressLink);
                break;
            }
            case 2: {
                onAddressContact(Address.parse(opAddress));
                break;
            }
            case 3: {
                if (explorerTxLink) {
                    onShare(explorerTxLink);
                }
                break;
            }
            case 4: {
                if (!spam) {
                    onMarkAddressSpam();
                } else if (kind === 'out' && !props.ledger) {
                    onRepeatTx();
                }
                break;
            }
            case 5: {
                if (kind === 'out' && !props.ledger) {
                    onRepeatTx();
                }
                break;
            }
            default:
                break;
        }
    }, [addressLink, explorerTxLink, onShare, onMarkAddressSpam, onAddressContact]);

    return (
        <Pressable
            onPress={() => props.onPress(props.tx)}
            style={{ paddingHorizontal: 16, paddingVertical: 20, paddingBottom: operation.comment ? 0 : undefined }}
            onLongPress={() => {
                if (props.showActionSheetWithOptions) {
                    props.showActionSheetWithOptions(
                        actionSheetOptions,
                        handleAction
                    );
                }
            }}
        >
            <PerfView style={{
                alignSelf: 'stretch',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <PerfView style={{
                    width: 46, height: 46,
                    borderRadius: 23,
                    position: 'relative',
                    borderWidth: 0, marginRight: 10,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    {parsed.status === 'pending' ? (
                        <PendingTransactionAvatar
                            kind={kind}
                            address={opAddress}
                            avatarId={opAddress}
                        />
                    ) : (
                        <Avatar
                            size={48}
                            address={opAddress}
                            id={opAddress}
                            borderWith={0}
                            spam={spam}
                            markContact={!!contact}
                            icProps={{ isOwn, backgroundColor: theme.surfaceOnBg, size: 18, borderWidth: 2 }}
                            theme={theme}
                            isTestnet={isTestnet}
                            hashColor
                        />
                    )}
                </PerfView>
                <PerfView style={{ flex: 1, marginRight: 4 }}>
                    <PerfView style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <PerfText
                            style={{ color: theme.textPrimary, fontSize: 17, fontWeight: '600', lineHeight: 24, flexShrink: 1 }}
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                        >
                            {op}
                        </PerfText>
                        {spam && (
                            <PerfView style={{
                                backgroundColor: theme.backgroundUnchangeable,
                                borderWidth: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: 100,
                                paddingHorizontal: 5,
                                marginLeft: 10,
                                height: 15
                            }}>
                                <PerfText
                                    style={{
                                        color: theme.textPrimaryInverted,
                                        fontSize: 10,
                                        fontWeight: '500'
                                    }}
                                >
                                    {'SPAM'}
                                </PerfText>
                            </PerfView>
                        )}
                    </PerfView>
                    <PerfText
                        style={{
                            color: theme.textSecondary,
                            fontSize: 15,
                            marginRight: 8,
                            lineHeight: 20,
                            fontWeight: '400',
                            marginTop: 2
                        }}
                        ellipsizeMode="middle"
                        numberOfLines={1}
                    >
                        {known
                            ? known.name
                            : <AddressComponent address={Address.parse(opAddress)} />
                        }
                        {` • ${formatTime(tx.base.time)}`}
                    </PerfText>
                </PerfView>
                <PerfView style={{ alignItems: 'flex-end' }}>
                    {parsed.status === 'failed' ? (
                        <PerfText style={{ color: theme.accentRed, fontWeight: '600', fontSize: 17, lineHeight: 24 }}>
                            {t('tx.failed')}
                        </PerfText>
                    ) : (
                        <Text
                            style={[
                                {
                                    color: kind === 'in'
                                        ? spam
                                            ? theme.textPrimary
                                            : theme.accentGreen
                                        : theme.textPrimary,
                                    marginRight: 2,
                                },
                                Typography.semiBold17_24
                            ]}
                            numberOfLines={1}
                        >
                            {kind === 'in' ? '+' : '-'}
                            <ValueComponent
                                value={absAmount}
                                decimals={item.kind === 'token' ? tx.masterMetadata?.decimals : undefined}
                                precision={3}
                                centFontStyle={{ fontSize: 15 }}
                            />
                            <Text style={{ fontSize: 15 }}>
                                {item.kind === 'token' ? `${tx.masterMetadata?.symbol ? ` ${tx.masterMetadata?.symbol}` : ''}` : ' TON'}
                            </Text>
                        </Text>
                    )}
                    {item.kind !== 'token' && (
                        <PriceComponent
                            amount={absAmount}
                            prefix={kind === 'in' ? '+' : '-'}
                            style={{
                                height: undefined,
                                backgroundColor: theme.transparent,
                                paddingHorizontal: 0, paddingVertical: 0,
                                alignSelf: 'flex-end',
                            }}
                            theme={theme}
                            textStyle={{
                                color: theme.textSecondary,
                                fontWeight: '400',
                                fontSize: 15, lineHeight: 20
                            }}
                        />
                    )}
                </PerfView>
            </PerfView>
            {!!operation.comment && !(spam && dontShowComments) && (
                <PerfView style={{
                    flexShrink: 1, alignSelf: 'flex-start',
                    backgroundColor: theme.border,
                    marginTop: 8,
                    paddingHorizontal: 10, paddingVertical: 8,
                    borderRadius: 10, marginLeft: 46 + 10, height: 36
                }}>
                    <PerfText
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                        style={{ color: theme.textPrimary, fontSize: 15, maxWidth: 400, lineHeight: 20 }}
                    >
                        {operation.comment}
                    </PerfText>
                </PerfView>
            )}
        </Pressable>
    );
}
TransactionView.displayName = 'TransactionView';