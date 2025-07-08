import * as React from 'react';
import { Pressable, Text } from 'react-native';
import { ValueComponent } from '../../../components/ValueComponent';
import { AddressComponent } from '../../../components/address/AddressComponent';
import { avatarColors } from '../../../components/avatar/Avatar';
import { KnownWallet, useKnownWallets } from '../../../secure/KnownWallets';
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
import { PreparedMessage } from '../../../engine/hooks/transactions/usePeparedMessages';
import { TxAvatar } from './TxAvatar';
import { useContractInfo } from '../../../engine/hooks';
import { useAddressFormatsHistory } from '../../../engine/hooks';
import { ForcedAvatarType } from '../../../components/avatar/ForcedAvatar';

export function PreparedMessageView(props: {
    own: Address,
    message: PreparedMessage,
    separator: boolean,
    theme: ThemeType,
    navigation: TypedNavigation,
    onPress: () => void,
    onLongPress?: () => void,
    ledger?: boolean,
    contacts: { [key: string]: AddressContact },
    isTestnet: boolean,
    appState?: AppState,
    bounceableFormat: boolean,
    walletsSettings: { [key: string]: WalletSettings },
    time: number,
    status: 'success' | 'failed' | 'pending',
    knownWallets: { [key: string]: KnownWallet }
}) {
    const { theme, message, contacts, isTestnet, status, time, onPress, onLongPress, walletsSettings, appState } = props;
    const operation = message.operation;
    const item = operation.items[0];
    const itemAmount = BigInt(item.amount);
    const absAmount = itemAmount < 0 ? itemAmount * BigInt(-1) : itemAmount;
    const opAddress = item.kind === 'token' ? operation.address : message.friendlyTarget;
    const parsedOpAddr = Address.parseFriendly(opAddress);
    const parsedAddress = parsedOpAddr.address;
    const parsedAddressFriendly = parsedAddress.toString({ testOnly: isTestnet });
    const parsedAddressNonBounceable = parsedAddress.toString({ testOnly: isTestnet, bounceable: false });
    const targetContractInfo = useContractInfo(parsedAddressFriendly);
    const { getAddressFormat } = useAddressFormatsHistory();    
    // If format is saved in local history we'll show it
    // Otherwise if targetContract is wallet we show the address in a format taken from Settings
    // Otherwise we show the address in a format taken from the transaction (which is in most of the cases wrong)
    const bounceable = getAddressFormat(parsedAddress) ?? (targetContractInfo?.kind === 'wallet'
        ? props.bounceableFormat
        : parsedOpAddr.isBounceable);
    const isOwn = (appState?.addresses ?? []).findIndex((a) => a.address.equals(Address.parse(opAddress))) >= 0;
    const walletSettings = walletsSettings[parsedAddressFriendly];
    const avatarColorHash = walletSettings?.color ?? avatarHash(parsedAddressFriendly, avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];
    // Previously contacts could be created with different address formats, now it's only bounceable, but we need to check both formats to keep compatibility
    const contact = contacts[parsedAddressFriendly] || contacts[parsedAddressNonBounceable];
    const knownWallets = useKnownWallets(isTestnet);
    const targetContract = useContractInfo(opAddress);

    const forcedAvatar: ForcedAvatarType | undefined = useMemo(() => {
        if (targetContract?.kind === 'card' || targetContract?.kind === 'jetton-card') {
            return 'holders';
        }
    }, [targetContract, opAddress]);

    // Operation
    const op = useMemo(() => {
        if (operation.op) {
            const isLiquid = getLiquidStakingAddress(isTestnet).equals(Address.parse(opAddress));
            if (operation.op.res === 'known.withdraw' && isLiquid) {
                return t('known.withdrawLiquid');
            }
            return t(operation.op.res, operation.op.options);
        } else {
            if (status === 'pending') {
                return t('tx.sending');
            } else {
                return t('tx.sent');
            }
        }
    }, [operation.op, status]);

    // Resolve built-in known wallets
    let known: KnownWallet | undefined = knownWallets[parsedAddressFriendly];
    if (!!contact && !known) { // Resolve contact known wallet
        known = { name: contact.name }
    }
    if (!!walletSettings?.name) {
        known = { name: walletSettings.name }
    }

    return (
        <Pressable
            onPress={onPress}
            style={{
                paddingHorizontal: 16,
                paddingVertical: 20,
                paddingBottom: operation.comment ? 0 : undefined
            }}
            onLongPress={onLongPress}
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
                        kind={'out'}
                        spam={false}
                        isOwn={isOwn}
                        theme={theme}
                        walletSettings={walletSettings}
                        markContact={!!contact}
                        avatarColor={avatarColor}
                        knownWallets={props.knownWallets}
                        isLedger={props.ledger}
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
                    </PerfView>
                    <Text
                        style={[
                            { color: theme.textSecondary, marginRight: 8, marginTop: 2 },
                            Typography.regular15_20
                        ]}
                        ellipsizeMode={'middle'}
                        numberOfLines={1}
                    >
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
                        {`${formatTime(time)}`}
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
                            style={[
                                {
                                    color: theme.textPrimary,
                                    marginRight: 2,
                                },
                                Typography.semiBold17_24
                            ]}
                            numberOfLines={1}
                        >
                            {'-'}
                            <ValueComponent
                                value={absAmount}
                                decimals={item.kind === 'token' ? message.jettonMaster?.decimals : undefined}
                                precision={3}
                                centFontStyle={{ fontSize: 15 }}
                            />
                            <Text style={{ fontSize: 15 }}>
                                {item.kind === 'token' ? `${message.jettonMaster?.symbol ? ` ${message.jettonMaster?.symbol}` : ''}` : ' TON'}
                            </Text>
                        </Text>
                    )}
                    {item.kind !== 'token' && (
                        <PriceComponent
                            amount={absAmount}
                            prefix={'-'}
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
                </PerfView>
            </PerfView>
            {!!operation.comment && (
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
PreparedMessageView.displayName = 'PreparedMessageView';