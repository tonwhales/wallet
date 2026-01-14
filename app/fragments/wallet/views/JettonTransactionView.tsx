import * as React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { ValueComponent } from '../../../components/ValueComponent';
import { AddressComponent } from '../../../components/address/AddressComponent';
import { avatarColors } from '../../../components/avatar/Avatar';
import { KnownWallet } from '../../../secure/KnownWallets';
import { t } from '../../../i18n/t';
import { TypedNavigation } from '../../../utils/useTypedNavigation';
import { Address } from '@ton/core';
import { Jetton } from '../../../engine/types';
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
import { useVerifyJetton, useForcedAvatarType } from '../../../engine/hooks';
import { TxAvatar } from './TxAvatar';
import { useContractInfo } from '../../../engine/hooks/metadata/useContractInfo';
import { isJettonTxSPAM, parseForwardPayloadComment } from '../../../utils/spam/isTxSPAM';
import { JettonTransfer } from '../../../engine/hooks/transactions/useJettonTransactions';
import { mapJettonToMasterState } from '../../../utils/jettons/mapJettonToMasterState';
import { useLedgerTransport } from '../../ledger/components/TransportContext';
import { useAddressFormatsHistory } from '../../../engine/hooks';
import { SpamLabel } from '../../../components/SpamLabel';
/**
 * Render a single jetton transfer transaction row with avatar, operation label, address/time, amount and optional comment.
 *
 * @param own - The current user's address used to determine incoming vs outgoing direction
 * @param tx - The jetton transfer transaction to display
 * @param jetton - The jetton token metadata associated with the transaction
 * @param theme - Theme values used for styling the row
 * @param onPress - Called with `tx` when the row is pressed
 * @param onLongPress - Optional callback called with `tx` on long press
 * @param dontShowComments - If true, suppress displaying comments for transactions classified as spam
 * @param spamMinAmount - Minimum amount threshold used when evaluating spam heuristics
 * @param denyList - Map of denied addresses and their reasons used for spam/denial checks
 * @param contacts - Map of address to contact info used to resolve display names
 * @param isTestnet - When true, formats addresses for testnet display
 * @param spamWallets - List of wallet addresses treated as spam sources
 * @param appState - Optional app state used to detect owned addresses
 * @param bounceableFormat - Preferred bounceable address formatting fallback
 * @param walletsSettings - Per-address settings (name, color) used for avatar and display resolution
 * @param knownWallets - Built-in known wallet registry used to resolve well-known names
 * @returns A JSX element representing the transaction row
 */
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

    const itemAmount = BigInt(tx.amount);
    const absAmount = itemAmount < 0 ? itemAmount * BigInt(-1) : itemAmount;
    const destination = tx.destination
    const source = tx.source;
    const destinationAddress = Address.parse(destination);
    const sourceAddress = Address.parse(source);
    const kind: 'in' | 'out' = destinationAddress.equals(props.own) ? 'in' : 'out';
    const displayAddress = kind === 'in' ? sourceAddress : destinationAddress;
    const opAddress = displayAddress.toString({ testOnly: isTestnet });
    const { getAddressFormat } = useAddressFormatsHistory();
    const bounceable = getAddressFormat(displayAddress) ?? (props.bounceableFormat);
    const isOwn = (props.appState?.addresses ?? []).findIndex((a) => a.address.equals(displayAddress)) >= 0;
    const targetContract = useContractInfo(opAddress);
    const comment = parseForwardPayloadComment(tx.forward_payload);
    const ledgerContext = useLedgerTransport();
    const ledgerAddresses = ledgerContext?.wallets;

    const walletSettings = props.walletsSettings[opAddress];

    const avatarColorHash = walletSettings?.color ?? avatarHash(opAddress, avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];
    const contact = contacts[opAddress];

    // Operation
    let op = kind === 'in' ? t('tx.received') : t('tx.sent');
    const status = tx.transaction_aborted ? 'failed' : 'success';

    if (kind === 'out' && targetContract?.kind === 'jetton-card') {
        op = t('known.holders.accountJettonTopUp');
    }

    if (status === 'failed') {
        op = t('tx.failed');
    }

    const forcedAvatar = useForcedAvatarType({
        address: opAddress,
        contractInfo: targetContract
    });

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
    if (knownWallets[opAddress]) {
        known = knownWallets[opAddress];
    }
    if (!!contact) { // Resolve contact known wallet
        known = { name: contact.name }
    }
    if (!!walletSettings?.name) {
        known = { name: walletSettings.name }
    }

    const spam = isJettonTxSPAM(
        tx,
        {
            knownWallets,
            isDenyAddress: (addressString?: string | null) => !!denyList[addressString ?? '']?.reason,
            spamWallets,
            spamMinAmount,
            isTestnet,
            own: props.own
        }
    );

    const amountColor = (kind === 'in')
        ? (spam ? theme.textPrimary : theme.accentGreen)
        : theme.textPrimary;

    const jettonMasterContent = mapJettonToMasterState(jetton, isTestnet);

    const { isSCAM: isSCAMJetton } = useVerifyJetton({
        ticker: jetton.symbol,
        master: jetton.master.toString({ testOnly: isTestnet }),
    });

    const symbolText = jettonMasterContent?.symbol ? ` ${jettonMasterContent.symbol}${isSCAMJetton ? ' • ' : ''}` : '';

    return (
        <Pressable
            onPress={() => props.onPress(props.tx)}
            style={[styles.pressable, { paddingBottom: !!comment ? 0 : undefined }]}
            onLongPress={() => props.onLongPress?.(props.tx)}
        >
            <PerfView style={styles.txContainer}>
                <PerfView style={styles.avatar}>
                    <TxAvatar
                        status={status}
                        parsedAddressFriendly={opAddress}
                        kind={kind}
                        spam={spam}
                        isOwn={isOwn}
                        theme={theme}
                        walletSettings={walletSettings}
                        markContact={!!contact}
                        avatarColor={avatarColor}
                        knownWallets={knownWallets}
                        forceAvatar={forcedAvatar}
                        isLedger={isLedgerTarget}
                    />
                </PerfView>
                <PerfView style={styles.titleDescriptionView}>
                    <PerfView style={styles.titleView}>
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
                        style={[{ color: theme.textSecondary }, styles.addressTime]}
                        ellipsizeMode={'middle'}
                        numberOfLines={1}
                    >
                        {known
                            ? known.name
                            : <AddressComponent
                                testOnly={isTestnet}
                                address={displayAddress}
                                bounceable={bounceable}
                            />
                        }
                        {' • '}
                        {`${formatTime(tx.transaction_now)}`}
                    </Text>
                </PerfView>
                <PerfView style={styles.amountView}>
                    {status === 'failed' ? (
                        <PerfText style={[{ color: theme.accentRed }, Typography.semiBold17_24]}>
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
            {!!comment && !(spam && dontShowComments) && (
                <PerfView style={[styles.comment, { backgroundColor: theme.border }]}>
                    <PerfText
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                        style={[styles.commentText, { color: theme.textPrimary }]}
                    >
                        {comment}
                    </PerfText>
                </PerfView>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressable: {
        paddingHorizontal: 16,
        paddingVertical: 20
    },
    txContainer: {
        alignSelf: 'stretch',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatar: {
        width: 46, height: 46,
        borderRadius: 23,
        position: 'relative',
        borderWidth: 0, marginRight: 10,
        justifyContent: 'center', alignItems: 'center'
    },
    titleDescriptionView: { flex: 1, marginRight: 4 },
    titleView: { flexDirection: 'row', alignItems: 'center' },
    addressTime: {
        marginRight: 8, marginTop: 2,
        ...Typography.regular15_20
    },
    amountView: { justifyContent: 'flex-end' },
    comment: {
        flexShrink: 1, alignSelf: 'flex-start',
        marginTop: 8,
        paddingHorizontal: 10, paddingVertical: 8,
        borderRadius: 10, marginLeft: 46 + 10, height: 36
    },
    commentText: {
        ...Typography.regular15_20,
        maxWidth: 400
    }
});

JettonTransactionView.displayName = 'JettonTransactionView';