import { memo, useMemo } from "react";
import { ThemeType } from "../../../engine/state/theme";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { CryptoCurrency, HoldersTransaction } from "../../../engine/types";
import { View, Text, StyleSheet, StyleProp, Pressable } from "react-native";
import { ValueComponent } from "../../../components/ValueComponent";
import { Typography } from "../../../components/styles";
import { useTheme } from "../../../engine/hooks/theme";
import { PriceComponent } from "../../../components/PriceComponent";
import { toNano } from "@ton/core";
import { Image, ImageStyle } from "expo-image";
import { t } from "../../../i18n/t";
import { transactionTypeFormatter } from "../../../utils/holders/transactionTypeFormatter";
import { formatTime } from "../../../utils/dates";
import { useIsConnectAppReady, useNetwork } from "../../../engine/hooks";
import { holdersUrl, HoldersUserState } from "../../../engine/api/holders/fetchUserState";
import { HoldersAccountStatus } from "../../../engine/hooks/holders/useHoldersAccountStatus";
import { HoldersAppParams, HoldersAppParamsType } from "../../holders/HoldersAppFragment";
import { humanizeFiat } from "../../../utils/holders/humanize";

const styles = StyleSheet.create({
    ic: { height: 32, width: 32 },
    icContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    }
});

const IcActivate = ({ style }: { style?: StyleProp<ImageStyle> }) => (
    <Image
        source={require('@assets/holders/ic-activated.png')}
        style={[styles.ic, style]}
    />
);

const IcSetup = ({ style }: { style?: StyleProp<ImageStyle> }) => (
    <Image
        source={require('@assets/holders/ic-setup.png')}
        style={[styles.ic, style]}
    />
);

const IcPay = ({ style }: { style?: StyleProp<ImageStyle> }) => (
    <Image
        source={require('@assets/holders/ic-pay.png')}
        style={[styles.ic, style]}
    />
);

const IcDeposit = ({ style }: { style?: StyleProp<ImageStyle> }) => (
    <Image
        source={require('@assets/holders/ic-deposit.png')}
        style={[styles.ic, style]}
    />
);

const IcWithdrawal = ({ style }: { style?: StyleProp<ImageStyle> }) => (
    <Image
        source={require('@assets/holders/ic-withdrawal.png')}
        style={[styles.ic, style]}
    />
);

const IcExit = ({ style }: { style?: StyleProp<ImageStyle> }) => (
    <Image
        source={require('@assets/holders/ic-exit.png')}
        style={[styles.ic, style]}
    />
);

const IcFreeze = ({ style }: { style?: StyleProp<ImageStyle> }) => (
    <Image
        source={require('@assets/holders/ic-freeze.png')}
        style={[styles.ic, style]}
    />
);

const IcUnfreeze = ({ style }: { style?: StyleProp<ImageStyle> }) => (
    <Image
        source={require('@assets/holders/ic-unfreeze.png')}
        style={[styles.ic, style]}
    />
);

const IcBlock = ({ style }: { style?: StyleProp<ImageStyle> }) => (
    <Image
        source={require('@assets/holders/ic-lock.png')}
        style={[styles.ic, style]}
    />
);

const IcCardPaid = ({ style }: { style?: StyleProp<ImageStyle> }) => (
    <Image
        source={require('@assets/holders/ic-card-paid.png')}
        style={[styles.ic, style]}
    />
);

const IcTime = ({ style }: { style?: StyleProp<ImageStyle> }) => (
    <Image
        source={require('@assets/holders/ic-time.png')}
        style={[styles.ic, style]}
    />
)

const IcFailed = ({ style }: { style?: StyleProp<ImageStyle> }) => (
    <Image
        source={require('@assets/holders/ic-failed.png')}
        style={[styles.ic, style]}
    />
);

const RightContent = ({ tx }: { tx: HoldersTransaction }) => {
    const theme = useTheme();
    const type = tx.type
    const isPrepaidTopUp = type === 'prepaid_topup';
    const isPrepaidCharge = type === 'prepaid_charge';
    const isPrepaid = type.includes('prepaid');
    const isDeposit =
        type === 'deposit' || type === 'charge_back' || isPrepaidTopUp;
    const isDecline = type === 'decline';

    const isTxnEvent = ['charge', 'charge_failed', 'decline', 'charge_back'].includes(
        type
    );

    const isCurrencyEvent = ['account_charge'].includes(type);

    if (
        isDeposit ||
        isPrepaidCharge ||
        isDecline ||
        type === 'account_charge' ||
        type === 'charge' ||
        type === 'charge_failed' ||
        type === 'card_paid' ||
        type === 'crypto_account_withdraw'
    ) {
        const data = tx.data;
        const { cryptoCurrency } = data as { cryptoCurrency?: CryptoCurrency };

        const {
            currencyAmount,
            currency,
            amount,
            cryptoAmount,
            txnCurrency,
            txnCurrencyAmount,
            transactionAmount,
            transactionCurrency
        } = data as {
            currencyAmount?: string;
            currency?: string;
            amount?: string;
            cryptoAmount?: string;
            txnCurrency?: string;
            txnCurrencyAmount?: string;
            transactionAmount?: string;
            transactionCurrency?: string;
        };

        return (
            <View style={{ justifyContent: 'center' }}>
                {(!isPrepaid && cryptoCurrency && data.amount) && (
                    <Text
                        style={[
                            {
                                color: type === 'charge_failed' || type === 'decline'
                                    ? theme.accentRed
                                    : (isDeposit ? theme.accentGreen : theme.textPrimary),
                                marginRight: 2
                            },
                            Typography.semiBold17_24
                        ]}
                        numberOfLines={1}
                    >
                        {isDeposit ? '+' : '-'}
                        <ValueComponent
                            value={amount || '0'}
                            decimals={cryptoCurrency.decimals}
                            precision={3}
                            suffix={` ${cryptoCurrency.ticker}`}
                            centFontStyle={{ fontSize: 15 }}
                        />
                    </Text>
                )}

                {(isCurrencyEvent && currencyAmount && currency) && (
                    <Text
                        style={[
                            { color: type === 'charge_failed' || type === 'decline' ? theme.accentRed : theme.textPrimary, marginRight: 2, alignSelf: 'flex-end' },
                            Typography.semiBold17_24
                        ]}
                        numberOfLines={1}
                    >
                        {`${isDeposit ? '+' : '-'}${humanizeFiat(currencyAmount, currency)}`}
                    </Text>
                )}

                {(isTxnEvent && txnCurrency && txnCurrencyAmount) && (
                    <Text
                        style={[
                            { color: isDecline ? theme.accentRed : theme.textSecondary, marginRight: 2, alignSelf: 'flex-end' },
                            Typography.regular15_20
                        ]}
                        numberOfLines={1}
                    >
                        {isDecline
                            ? humanizeFiat(txnCurrencyAmount, txnCurrency)
                            : `${isDeposit ? '+' : '-'}${humanizeFiat(txnCurrencyAmount, txnCurrency)}`}
                    </Text>
                )}

                {(isPrepaidCharge && amount && currency) && (
                    <Text
                        style={[
                            { color: isDecline ? theme.accentRed : theme.textPrimary, marginRight: 2 },
                            Typography.semiBold17_24
                        ]}
                        numberOfLines={1}
                    >
                        {`-${humanizeFiat(amount, currency)}`}
                    </Text>
                )}

                {(isPrepaidCharge &&
                    transactionAmount &&
                    transactionCurrency &&
                    transactionCurrency !== currency) && (
                        <Text
                            style={[
                                { color: isDecline ? theme.accentRed : theme.textPrimary, marginRight: 2 },
                                Typography.semiBold17_24
                            ]}
                            numberOfLines={1}
                        >
                            {`-${humanizeFiat(transactionAmount, transactionCurrency)}`}
                        </Text>
                    )}

                {(isPrepaidTopUp && amount) && (
                    <Text
                        style={[
                            { color: theme.accentGreen, marginRight: 2 },
                            Typography.semiBold17_24
                        ]}
                        numberOfLines={1}
                    >
                        {`+${humanizeFiat(amount, currency)}`}
                    </Text>
                )}

                {(isPrepaidTopUp && cryptoCurrency) && (
                    <Text
                        style={[
                            { color: theme.accentGreen, marginRight: 2 },
                            Typography.semiBold17_24
                        ]}
                        numberOfLines={1}
                    >
                        {'+'}
                        <ValueComponent
                            value={cryptoAmount || '0'}
                            decimals={cryptoCurrency.decimals}
                            precision={3}
                            suffix={` ${cryptoCurrency.ticker}`}
                            centFontStyle={{ fontSize: 15 }}
                        />
                    </Text>
                )}
            </View>
        );
    }

    return null;
}

const TransactionIcon = ({ type, logoUrl }: { type: string, logoUrl?: string }) => {
    const theme = useTheme();
    const icStyle = { tintColor: theme.iconPrimary };
    if (type === 'card_ready' || type === 'crypto_account_ready') {
        return <IcActivate style={icStyle} />;
    }

    if (type === 'limits_change') {
        return <IcSetup style={icStyle} />;
    }

    if (
        type === 'charge' ||
        type === 'account_charge' ||
        type === 'prepaid_charge' ||
        type === 'decline' ||
        type === 'charge_failed' ||
        type === 'charge_back'
    ) {
        if (logoUrl) {
            return (
                <Image
                    alt="Merchant"
                    source={{ uri: logoUrl }}
                    style={{ width: 50, height: 50, borderRadius: 25 }}
                    placeholder={require('@assets/holders/ic-pay.png')}
                />
            );
        }

        return <IcPay style={icStyle} />;
    }

    switch (type) {
        case 'deposit':
        case 'prepaid_topup':
            return <IcDeposit style={icStyle} />;
        case 'crypto_account_withdraw':
        case 'card_withdraw':
            return <IcWithdrawal style={icStyle} />;
        case 'contract_closed':
            return <IcExit style={icStyle} />;
        case 'card_freeze':
            return <IcFreeze style={icStyle} />;
        case 'card_unfreeze':
            return <IcUnfreeze style={icStyle} />;
        case 'card_block':
            return <IcBlock style={icStyle} />;
        case 'card_paid':
            return <IcCardPaid style={icStyle} />;
        default:
            return <IcSetup />;
    }
}

const LeftContent = ({ tx }: { tx: HoldersTransaction }) => {
    const theme = useTheme();
    const type = tx.type;
    const isPending =
        (type === 'deposit' || type === 'limits_change') && tx.data.pending;

    const merchantInfo = (tx as any)?.data?.merchantInfo;
    const eventPurposeType = (tx as any).data?.purpose?.kind;
    const eventName = t(transactionTypeFormatter(eventPurposeType || type, isPending));

    return (
        <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center' }}>
            <View style={[styles.icContainer, { backgroundColor: theme.surfaceOnElevation }]}>
                <TransactionIcon type={type} logoUrl={merchantInfo?.logoUrl} />
                {isPending && (
                    <View style={{
                        height: 18, width: 18,
                        position: 'absolute',
                        bottom: -1, right: -1,
                        borderRadius: 16, borderWidth: 2, borderColor: theme.backgroundPrimary,
                        justifyContent: 'center', alignItems: 'center'
                    }}>
                        <IcTime style={{ height: 14, width: 14 }} />
                    </View>
                )}
                {(type === 'charge_failed' || type === 'decline') && (
                    <View style={{
                        height: 18, width: 18,
                        position: 'absolute',
                        bottom: -1, right: -1,
                        borderRadius: 16, borderWidth: 2, borderColor: theme.backgroundPrimary,
                        justifyContent: 'center', alignItems: 'center'
                    }}>
                        <IcFailed style={{ height: 14, width: 14 }} />
                    </View>
                )}
            </View>
            <View>
                <Text style={[Typography.semiBold17_24, { color: theme.textPrimary }]}>
                    {merchantInfo?.cleanName || merchantInfo?.dirtyName || eventName}
                </Text>
                <Text style={[Typography.regular13_18, { color: theme.textSecondary }]}>
                    {formatTime(tx.time)}
                </Text>
            </View>
        </View>
    );
}

export const HoldersTransactionView = memo(({
    tx,
    theme,
    navigation,
    holdersAccStatus
}: {
    tx: HoldersTransaction,
    theme: ThemeType,
    navigation: TypedNavigation,
    holdersAccStatus?: HoldersAccountStatus
}) => {
    const { isTestnet } = useNetwork();
    const url = holdersUrl(isTestnet);
    const isHoldersReady = useIsConnectAppReady(url);

    const needsEnrolment = useMemo(() => {
        if (holdersAccStatus?.state === HoldersUserState.NeedEnrollment) {
            return true;
        }
        return false;
    }, [holdersAccStatus]);

    const onPress = () => {
        const params: HoldersAppParams = { type: HoldersAppParamsType.Path, path: '/transactions', query: {} };
        if (needsEnrolment || !isHoldersReady) {
            navigation.navigateHoldersLanding({ endpoint: url, onEnrollType: params }, isTestnet);
            return;
        }

        navigation.navigateHolders(params, isTestnet);
    };

    return (
        <Pressable
            style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 12 }}
            onPress={onPress}
        >
            <LeftContent tx={tx} />
            <RightContent tx={tx} />
        </Pressable>
    );
});