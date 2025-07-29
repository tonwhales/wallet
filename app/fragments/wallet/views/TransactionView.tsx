import * as React from 'react';
import { Pressable, Text } from 'react-native';
import { ValueComponent } from '../../../components/ValueComponent';
import { AddressComponent } from '../../../components/address/AddressComponent';
import { avatarColors } from '../../../components/avatar/Avatar';
import { KnownWallet } from '../../../secure/KnownWallets';
import { t } from '../../../i18n/t';
import { TypedNavigation } from '../../../utils/useTypedNavigation';
import { PriceComponent } from '../../../components/PriceComponent';
import { Address } from '@ton/core';
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
import { useJetton, usePeparedMessages, useVerifyJetton } from '../../../engine/hooks';
import { TxAvatar } from './TxAvatar';
import { PreparedMessageView } from './PreparedMessageView';
import { useContractInfo } from '../../../engine/hooks/metadata/useContractInfo';
import { ForcedAvatarType } from '../../../components/avatar/ForcedAvatar';
import { isTxSPAM } from '../../../utils/spam/isTxSPAM';
import { mapJettonToMasterState } from '../../../utils/jettons/mapJettonToMasterState';
import { TonTransaction } from '../../../engine/types';
import { useLedgerTransport } from '../../ledger/components/TransportContext';
import { extraCurrencyFromTransaction } from '../../../utils/extraCurrencyFromTransaction';
import { useExtraCurrencyMap } from '../../../engine/hooks/jettons/useExtraCurrencyMap';
import { fromBnWithDecimals } from '../../../utils/withDecimals';
import { useAddressFormatsHistory } from "../../../engine/hooks";
import { SpamLabel } from '../../../components/SpamLabel';

export function TransactionView(props: {
    own: Address,
    tx: TonTransaction,
    theme: ThemeType,
    navigation: TypedNavigation,
    onPress: (src: TonTransaction) => void,
    onLongPress?: (src: TonTransaction, formattedAddressString: string) => void,
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
        own
    } = props;
    const parsed = tx.base.parsed;
    const operation = tx.base.operation;
    const kind = tx.base.parsed.kind;
    const item = operation.items[0];
    const itemAmount = BigInt(item.amount);
    const absAmount = itemAmount < 0 ? itemAmount * BigInt(-1) : itemAmount;
    const opAddress = item.kind === 'token' ? operation.address : tx.base.parsed.resolvedAddress;
    const parsedOpAddr = Address.parseFriendly(opAddress);
    const parsedAddress = parsedOpAddr.address;
    const parsedAddressFriendly = parsedAddress.toString({ testOnly: isTestnet });
    const parsedAddressNonBounceable = parsedAddress.toString({ testOnly: isTestnet, bounceable: false });
    const isOwn = (props.appState?.addresses ?? []).findIndex((a) => a.address.equals(Address.parse(opAddress))) >= 0;
    const preparedMessages = usePeparedMessages(tx.base.outMessages, isTestnet, own);
    const targetContract = useContractInfo(opAddress);
    const { getAddressFormat } = useAddressFormatsHistory();
    // If format is saved in local history we'll show it
    // Otherwise if it's a Recieved transaction or targetContract is wallet 
    // we show the address in a format taken from Settings
    // Otherwise we show the address in a format taken from the transaction (which is in most of the cases wrong)
    const bounceable = getAddressFormat(parsedAddress) ?? (targetContract?.kind === 'wallet' || !targetContract
        ? props.bounceableFormat
        : parsedOpAddr.isBounceable);
    const parsedAddressFriendlyBounceable = parsedAddress.toString({ testOnly: isTestnet, bounceable });
    const ledgerContext = useLedgerTransport();
    const ledgerAddresses = ledgerContext?.wallets;
    const isOutgoing = kind === 'out';
    const extraCurrency = extraCurrencyFromTransaction(tx);
    const extraCurrencyMap = useExtraCurrencyMap(extraCurrency, own.toString({ testOnly: isTestnet }));
    const extraCurrencies = Object.entries(extraCurrencyMap ?? {}).map(([, extraCurrency]) => {
        const amount = extraCurrency.amount;
        const symbol = extraCurrency.preview.symbol;
        const sign = isOutgoing ? '-' : '+';
        return `${sign}${fromBnWithDecimals(amount, extraCurrency.preview.decimals)} ${symbol}`;
    });

    const walletSettings = props.walletsSettings[parsedAddressFriendly];

    const avatarColorHash = walletSettings?.color ?? avatarHash(parsedAddressFriendly, avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];
    // Previously contacts could be created with different address formats, now it's only bounceable, but we need to check both formats to keep compatibility
    const contact = contacts[parsedAddressFriendly] || contacts[parsedAddressNonBounceable];
    // const verified = !!tx.verified;
    const verified = false;


    // Operation
    const op = useMemo(() => {
        if (operation.op) {
            const isLiquid = getLiquidStakingAddress(isTestnet).equals(Address.parse(opAddress));
            if (operation.op.res === 'known.withdraw' && isLiquid) {
                return t('known.withdrawLiquid');
            }
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

    const holdersOp = operation.op?.res?.startsWith('known.holders.');

    const forcedAvatar: ForcedAvatarType | undefined = useMemo(() => {
        if (holdersOp) {
            return 'holders';
        }
        if (operation.op?.res === 'known.cashback') {
            return 'cashback';
        }
        if (targetContract?.kind === 'dedust-vault') {
            return 'dedust';
        }
        if (targetContract?.kind === 'card' || targetContract?.kind === 'jetton-card') {
            return 'holders';
        }
    }, [targetContract, holdersOp, ledgerAddresses, opAddress]);

    const isLedgerTarget = useMemo(() => {
        return !!ledgerAddresses?.find((addr) => {
            try {
                return Address.parse(opAddress)?.equals(Address.parse(addr.address));
            } catch (error) {
                return false;
            }
        });
    }, [ledgerAddresses, opAddress]);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = undefined;
    if (knownWallets[parsedAddressFriendly]) {
        known = knownWallets[parsedAddressFriendly];
    }
    // if (tx.title) {
    //     known = { name: tx.title };
    // }
    if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }
    if (!!walletSettings?.name) {
        known = { name: walletSettings.name }
    }

    let spam = isTxSPAM(
        tx,
        {
            knownWallets,
            isDenyAddress: (addressString?: string | null) => !!denyList[addressString ?? '']?.reason,
            spamWallets,
            spamMinAmount,
            isTestnet
        }
    );

    const amountColor = !isOutgoing
        ? (spam ? theme.textPrimary : theme.accentGreen)
        : theme.textPrimary;

    const resolvedAddressString = tx.base.parsed.resolvedAddress;
    const jetton = useJetton({ owner: own, wallet: resolvedAddressString });
    const jettonMaster = jetton?.master ?? null;
    const jettonMasterContent = jetton ? mapJettonToMasterState(jetton, isTestnet) : null;

    const { isSCAM: isSCAMJetton } = useVerifyJetton({
        ticker: item.kind === 'token' ? jettonMasterContent?.symbol : undefined,
        master: jettonMaster?.toString({ testOnly: isTestnet }),
    });

    const symbolText = item.kind === 'ton' ? ' TON' : (jettonMasterContent?.symbol ? ` ${jettonMasterContent.symbol}${isSCAMJetton ? ' • ' : ''}` : '');
    const showAmount = absAmount >= 0n;
    const showPrice = item.kind !== 'token' && tx.base.outMessagesCount <= 1 && absAmount >= 0n;

    if (preparedMessages.length > 1) {
        return (
            <>
                {preparedMessages.map((m, i) => {
                    if (m.type === 'relayed') {
                        return null;
                    }

                    return (
                        <PreparedMessageView
                            key={`prep-${i}`}
                            own={own}
                            message={m}
                            separator={false}
                            theme={theme}
                            navigation={props.navigation}
                            onPress={() => props.onPress(props.tx)}
                            onLongPress={() => props.onLongPress?.(props.tx, parsedAddressFriendlyBounceable)}
                            contacts={props.contacts}
                            isTestnet={props.isTestnet}
                            appState={props.appState}
                            bounceableFormat={props.bounceableFormat}
                            walletsSettings={props.walletsSettings}
                            time={tx.base.time}
                            status={parsed.status}
                            knownWallets={knownWallets}
                            ledger={isLedgerTarget}
                        />
                    );
                })}
            </>
        );
    }


    return (
        <Pressable
            onPress={() => props.onPress(props.tx)}
            style={{
                paddingHorizontal: 16,
                paddingVertical: 20,
                paddingBottom: operation.comment ? 0 : undefined
            }}
            onLongPress={() => props.onLongPress?.(props.tx, parsedAddressFriendlyBounceable)}
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
                        status={parsed.status}
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
                        verified={verified}
                        isLedger={isLedgerTarget}
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
                            <SpamLabel />
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
                        {tx.base.outMessagesCount <= 1 && (
                            <>
                                {known
                                    ? known.name
                                    : <AddressComponent
                                        testOnly={isTestnet}
                                        address={parsedOpAddr.address}
                                        bounceable={bounceable}
                                    />
                                }
                                {' • '}
                            </>
                        )}
                        {`${formatTime(tx.base.time)}`}
                    </Text>
                </PerfView>
                <PerfView style={{ alignItems: 'flex-end' }}>
                    {parsed.status === 'failed' ? (
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
                            {tx.base.outMessagesCount > 1 ? (
                                `${tx.base.outMessagesCount} ${t('common.messages').toLowerCase()}`
                            ) : showAmount && (
                                <>
                                    {!isOutgoing ? '+' : '-'}
                                    <ValueComponent
                                        value={absAmount}
                                        decimals={item.kind === 'token' ? jettonMasterContent?.decimals : undefined}
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
                            )}
                        </Text>
                    )}
                    {showPrice && (
                        <PriceComponent
                            amount={absAmount}
                            prefix={!isOutgoing ? '+' : '-'}
                            style={{
                                height: undefined,
                                backgroundColor: theme.transparent,
                                paddingHorizontal: 0, paddingVertical: 0,
                                alignSelf: 'flex-end',
                            }}
                            theme={theme}
                            textStyle={[
                                { color: theme.textSecondary },
                                Typography.regular15_20
                            ]}
                        />
                    )}
                    {!!extraCurrencies && (
                        extraCurrencies.map((text, index) => (
                            <PerfText
                                key={`extra-currency-${index}`}
                                minimumFontScale={0.4}
                                adjustsFontSizeToFit={true}
                                numberOfLines={1}
                                style={[{ color: amountColor, marginTop: 12 }, Typography.semiBold17_24]}
                            >
                                {text}
                            </PerfText>
                        ))
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
                        style={[
                            { color: theme.textPrimary, maxWidth: 400 },
                            Typography.regular15_20
                        ]}
                    >
                        {operation.comment}
                    </PerfText>
                </PerfView>
            )}
        </Pressable>
    );
}
TransactionView.displayName = 'TransactionView';