import * as React from 'react';
import { Pressable, Text } from 'react-native';
import { ValueComponent } from '../../../components/ValueComponent';
import { AddressComponent } from '../../../components/address/AddressComponent';
import { t } from '../../../i18n/t';
import { PriceComponent } from '../../../components/PriceComponent';
import { Address } from '@ton/core';
import { ThemeType } from '../../../engine/state/theme';
import { formatTime } from '../../../utils/dates';
import { PerfText } from '../../../components/basic/PerfText';
import { PerfView } from '../../../components/basic/PerfView';
import { Typography } from '../../../components/styles';
import { WalletSettings } from '../../../engine/state/walletSettings';
import { TxAvatar } from './TxAvatar';
import { ForcedAvatarType } from '../../../components/avatar/ForcedAvatar';
import { SpamLabel } from '../../../components/SpamLabel';
import { KnownWallet } from '../../../secure/KnownWallets';

export interface TransactionItemLayoutProps {
    operation: string;
    parsedAddress: Address;
    addressBounceable: boolean;
    time: number;
    status: 'success' | 'failed' | 'pending';
    absAmount: bigint;
    isOutgoing: boolean;
    showAmount: boolean;
    symbolText: string;
    showMultipleMessages?: boolean;
    messagesCount?: number;
    avatarColor: string;
    spam?: boolean;
    isOwn?: boolean;
    isLedger?: boolean;
    markContact?: boolean;
    forcedAvatar?: ForcedAvatarType;
    jettonDecimals?: number;
    theme: ThemeType;
    isTestnet: boolean;
    showPrice?: boolean;
    showSpamLabel?: boolean;
    showSCAMLabel?: boolean;
    amountColor?: string;
    pricePrefix?: string;
    known?: KnownWallet;
    walletSettings?: WalletSettings;
    knownWallets: { [key: string]: KnownWallet };
    comment?: string;
    showComment?: boolean;
    extraCurrencies?: string[];
    onPress: () => void;
    onLongPress?: () => void;
}

export function TransactionItemLayout(props: TransactionItemLayoutProps) {
    const {
        operation,
        parsedAddress,
        addressBounceable,
        time,
        status,
        absAmount,
        isOutgoing,
        showAmount,
        symbolText,
        showMultipleMessages,
        messagesCount,
        avatarColor,
        spam = false,
        isOwn = false,
        isLedger = false,
        markContact = false,
        forcedAvatar,
        jettonDecimals,
        theme,
        isTestnet,
        showPrice = false,
        showSpamLabel = false,
        amountColor,
        pricePrefix,
        known,
        walletSettings,
        knownWallets,
        comment,
        showComment = true,
        extraCurrencies = [],
        onPress,
        onLongPress
    } = props;
    
    return (
        <Pressable
            onPress={onPress}
            style={{
                paddingHorizontal: 16,
                paddingVertical: 20,
                paddingBottom: comment && showComment ? 0 : undefined
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
                        parsedAddressFriendly={parsedAddress.toString({ testOnly: isTestnet })}
                        kind={isOutgoing ? 'out' : 'in'}
                        spam={spam}
                        isOwn={isOwn}
                        theme={theme}
                        walletSettings={walletSettings}
                        markContact={markContact}
                        avatarColor={avatarColor}
                        knownWallets={knownWallets}
                        forceAvatar={forcedAvatar}
                        verified={false}
                        isLedger={isLedger}
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
                            {operation}
                        </PerfText>
                        {showSpamLabel && spam && (
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
                        {!showMultipleMessages && (
                            <>
                                {known
                                    ? known.name
                                    : <AddressComponent
                                        testOnly={isTestnet}
                                        address={parsedAddress}
                                        bounceable={addressBounceable}
                                    />
                                }
                                {' • '}
                            </>
                        )}
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
                                { color: amountColor || theme.textPrimary, marginRight: 2 }, 
                                Typography.semiBold17_24
                            ]}
                            numberOfLines={1}
                        >
                            {showMultipleMessages && messagesCount ? (
                                `${messagesCount} ${t('common.messages').toLowerCase()}`
                            ) : showAmount && (
                                <>
                                    {pricePrefix || (!isOutgoing ? '+' : '-')}
                                    <ValueComponent
                                        value={absAmount}
                                        decimals={jettonDecimals}
                                        precision={3}
                                        centFontStyle={{ fontSize: 15 }}
                                    />
                                    <Text style={{ fontSize: 15 }}>
                                        {symbolText}
                                    </Text>
                                </>
                            )}
                        </Text>
                    )}
                    
                    {showPrice && (
                        <PriceComponent
                            amount={absAmount}
                            prefix={pricePrefix || (!isOutgoing ? '+' : '-')}
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
                    
                    {extraCurrencies.map((text, index) => (
                        <PerfText
                            key={`extra-currency-${index}`}
                            minimumFontScale={0.4}
                            adjustsFontSizeToFit={true}
                            numberOfLines={1}
                            style={[
                                { color: amountColor || theme.textPrimary, marginTop: 12 }, 
                                Typography.semiBold17_24
                            ]}
                        >
                            {text}
                        </PerfText>
                    ))}
                </PerfView>
            </PerfView>
            
            {comment && showComment && (
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
                        {comment}
                    </PerfText>
                </PerfView>
            )}
        </Pressable>
    );
}

TransactionItemLayout.displayName = 'TransactionItemLayout'; 