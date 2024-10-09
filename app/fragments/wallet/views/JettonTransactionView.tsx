import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ValueComponent } from '../../../components/ValueComponent';
import { AddressComponent } from '../../../components/address/AddressComponent';
import { avatarColors } from '../../../components/avatar/Avatar';
import { KnownWallet } from '../../../secure/KnownWallets';
import { t } from '../../../i18n/t';
import { TypedNavigation } from '../../../utils/useTypedNavigation';
import { PriceComponent } from '../../../components/PriceComponent';
import { Address } from '@ton/core';
import { Jetton, TransactionDescription } from '../../../engine/types';
import { useMemo } from 'react';
import { ThemeType } from '../../../engine/state/theme';
import { AddressContact } from '../../../engine/hooks/contacts/useAddressBook';
import { formatTime } from '../../../utils/dates';
import { PerfText } from '../../../components/basic/PerfText';
import { AppState } from '../../../storage/appState';
import { PerfView } from '../../../components/basic/PerfView';
import { Typography } from '../../../components/styles';
import { avatarHash } from '../../../utils/avatarHash';
import { WalletSettings } from '../../../engine/state/walletSettings';
import { getLiquidStakingAddress } from '../../../utils/KnownPools';
import { useJettonMaster, useJettonWallet, usePeparedMessages, useVerifyJetton } from '../../../engine/hooks';
import { TxAvatar } from './TxAvatar';
import { PreparedMessageView } from './PreparedMessageView';
import { useContractInfo } from '../../../engine/hooks/metadata/useContractInfo';
import { ForcedAvatarType } from '../../../components/avatar/ForcedAvatar';
import { isTxSPAM } from '../../../utils/spam/isTxSPAM';
import { JettonTransfer } from '../../../engine/hooks/transactions/useJettonTransactions';
import { JettonMasterState } from '../../../engine/metadata/fetchJettonMasterContent';

export function JettonTransactionView(props: {
    own: Address,
    tx: JettonTransfer,
    jetton: Jetton,
    separator: boolean,
    theme: ThemeType,
    navigation: TypedNavigation,
    onPress: (src: JettonTransfer) => void,
    onLongPress?: (src: JettonTransfer) => void,
    ledger?: boolean,
    spamMinAmount: bigint,
    dontShowComments: boolean,
    denyList: { [key: string]: { reason: string | null } },
    contacts: { [key: string]: AddressContact },
    isTestnet: boolean,
    spamWallets: string[],
    appState?: AppState,
    bounceableFormat: boolean,
    walletsSettings: { [key: string]: WalletSettings }
    knownWallets: { [key: string]: KnownWallet }
}) {
    const {
        theme,
        tx,
        denyList,
        spamMinAmount, dontShowComments, spamWallets,
        contacts,
        isTestnet,
        knownWallets,
        jetton
    } = props;
    // const parsed = tx.base.parsed;
    // const operation = tx.base.operation;
    // const kind = tx.base.parsed.kind;
    // const item = operation.items[0];

    console.log('JettonTransactionView', tx.destination);

    // return (
    //     <View style={{ height: 86, width: 100, backgroundColor: 'red' }} />
    // )
    const itemAmount = BigInt(tx.amount);
    const absAmount = itemAmount < 0 ? itemAmount * BigInt(-1) : itemAmount;
    const opAddress = tx.destination
    const parsedAddress = Address.parse(opAddress);
    const parsedAddressFriendly = parsedAddress.toString({ testOnly: isTestnet });
    const isOwn = (props.appState?.addresses ?? []).findIndex((a) => a.address.equals(Address.parse(opAddress))) >= 0;
    const targetContract = useContractInfo(opAddress);

    const walletSettings = props.walletsSettings[parsedAddressFriendly];

    const avatarColorHash = walletSettings?.color ?? avatarHash(parsedAddressFriendly, avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];
    const contact = contacts[parsedAddressFriendly];

    const kind: 'in' | 'out' = Address.parse(tx.source).equals(props.own) ? 'out' : 'in';

    // Operation
    let op = kind === 'in' ? t('tx.received') : t('tx.sent');
    const status = tx.transaction_aborted ? 'failed' : 'success';

    if (status === 'failed') {
        op = t('tx.failed');
    }

    // TODO
    // const holdersOp = operation.op?.res?.startsWith('known.holders.');
    const holdersOp = false;

    const forcedAvatar: ForcedAvatarType | undefined = useMemo(() => {
        if (holdersOp) {
            return 'holders';
        }
        if (targetContract?.kind === 'dedust-vault') {
            return 'dedust';
        }

        if (targetContract?.kind === 'card' || targetContract?.kind === 'jetton-card') {
            return 'holders';
        }
    }, [targetContract, holdersOp]);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (knownWallets[parsedAddressFriendly]) {
        known = knownWallets[parsedAddressFriendly];
    }
    if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }
    if (!!walletSettings?.name) {
        known = { name: walletSettings.name }
    }

    // TODO
    const spam = false;
    // const spam = isTxSPAM(
    //     tx,
    //     {
    //         knownWallets,
    //         isDenyAddress: (addressString?: string | null) => !!denyList[addressString ?? '']?.reason,
    //         spamWallets,
    //         spamMinAmount,
    //         isTestnet
    //     }
    // );

    const amountColor = (kind === 'in')
        ? (spam ? theme.textPrimary : theme.accentGreen)
        : theme.textPrimary;

    const jettonMasterContent: JettonMasterState & { address: string } = {
        address: jetton.master.toString({ testOnly: isTestnet }),
        symbol: jetton.symbol,
        name: jetton.name,
        description: jetton.description,
        decimals: jetton.decimals,
        assets: jetton.assets ?? undefined,
        pool: jetton.pool ?? undefined,
        originalImage: jetton.icon,
        image: jetton.icon ? { preview256: jetton.icon, blurhash: '' } : null,
    };

    const { isSCAM: isSCAMJetton } = useVerifyJetton({
        ticker: jetton.symbol,
        master: jetton.master.toString({ testOnly: isTestnet }),
    });

    const symbolText = jettonMasterContent?.symbol ? ` ${jettonMasterContent.symbol}${isSCAMJetton ? ' • ' : ''}` : '';

    return (
        <Pressable
            onPress={() => props.onPress(props.tx)}
            style={{
                paddingHorizontal: 16,
                paddingVertical: 20,
                // TODO
                // paddingBottom: operation.comment ? 0 : undefined
            }}
            onLongPress={() => props.onLongPress?.(props.tx)}
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
                    <TxAvatar
                        status={status}
                        parsedAddressFriendly={parsedAddressFriendly}
                        kind={kind}
                        spam={spam}
                        isOwn={isOwn}
                        theme={theme}
                        walletSettings={walletSettings}
                        markContact={!!contact}
                        avatarColor={avatarColor}
                        knownWallets={knownWallets}
                        forceAvatar={forcedAvatar}
                    />
                </PerfView>
                <PerfView style={{ flex: 1, marginRight: 4 }}>
                    <PerfView style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <PerfText
                            style={[
                                { color: theme.textPrimary, flexShrink: 1 },
                                Typography.semiBold17_24
                            ]}
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
                                    style={[
                                        { color: theme.textPrimaryInverted },
                                        Typography.medium10_12
                                    ]}
                                >
                                    {'SPAM'}
                                </PerfText>
                            </PerfView>
                        )}
                    </PerfView>
                    <Text
                        style={[
                            { color: theme.textSecondary, marginRight: 8, marginTop: 2 },
                            Typography.regular15_20
                        ]}
                        ellipsizeMode={'middle'}
                        numberOfLines={1}
                    >
                        {`${formatTime(tx.transaction_now)}`}
                    </Text>
                </PerfView>
                <PerfView style={{ alignItems: 'flex-end' }}>
                    {status === 'failed' ? (
                        <PerfText style={[
                            { color: theme.accentRed },
                            Typography.semiBold17_24
                        ]}>
                            {t('tx.failed')}
                        </PerfText>
                    ) : (
                        <Text
                            style={[{ color: amountColor, marginRight: 2 }, Typography.semiBold17_24]}
                            numberOfLines={1}
                        >
                            <>
                                {kind === 'in' ? '+' : '-'}
                                <ValueComponent
                                    value={absAmount}
                                    decimals={jetton.decimals}
                                    precision={3}
                                    centFontStyle={{ fontSize: 15 }}
                                />
                                <Text style={{ fontSize: 15 }}>
                                    {symbolText}
                                    {isSCAMJetton && (
                                        <Text style={{ color: theme.accentRed }}>
                                            {' SCAM'}
                                        </Text>
                                    )}
                                </Text>
                            </>
                        </Text>
                    )}
                </PerfView>
            </PerfView>
            {/*
                // TODO
            */
            }
            {/* {!!operation.comment && !(spam && dontShowComments) && (
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
                        style={[
                            { color: theme.textPrimary, maxWidth: 400 },
                            Typography.regular15_20
                        ]}
                    >
                        {operation.comment}
                    </PerfText>
                </PerfView>
            )} */}
        </Pressable>
    );
}
JettonTransactionView.displayName = 'JettonTransactionView';