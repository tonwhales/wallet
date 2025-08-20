import { memo } from "react";
import { View, Text, Pressable, ViewStyle } from "react-native";
import { useTheme } from "../../engine/hooks/theme/useTheme";
import { Typography } from "../styles";
import { t } from "../../i18n/t";
import { getCoinInfoByCurrency, getKnownCurrencyFromName } from "../../engine/utils/chain";
import { humanizeNumber } from "../../utils/holders/humanize";
import { PendingIcon } from "../avatar/PendingIcon";
import { OrderCountdown } from "./OrderCountdown";
import { ChangellyTransactionModel } from "../../engine/api/changelly/fetchChangellyUserTransactions";
import { getOrderState } from "../../engine/utils/orders";

import OrderIcon from "@assets/order/order.svg";
import CountdownIcon from "@assets/order/countdown.svg";
import SuccessIcon from '@assets/order/success.svg';
import FailureIcon from '@assets/order/failure.svg';


interface OrderItemViewProps {
    order: ChangellyTransactionModel;
    onPress: (order: ChangellyTransactionModel) => void;
}

export const OrderItemView = memo(({ order, onPress }: OrderItemViewProps) => {
    const theme = useTheme();
    const { isInitial, isPending, isSuccess, isFailure } = getOrderState(order.status);

    const knownCurrencyTo = getKnownCurrencyFromName(order.toCurrency);
    const symbol = knownCurrencyTo ? getCoinInfoByCurrency(knownCurrencyTo).name.toUpperCase() : order.toCurrency.toUpperCase();

    const description = (() => {
        if (isInitial) return t('order.waitingForTransfer');
        if (isPending) return t('order.info.status.pending');
        if (isSuccess) return t('order.info.status.success');
        if (isFailure) return t('order.info.status.failure');

        return undefined;
    })();

    const iconStatus = (() => {
        const style: ViewStyle = {
            position: 'absolute',
            bottom: -2, right: -2,
            borderWidth: 1,
            borderColor: theme.white,
            borderRadius: 10,
        }

        if (isInitial || isPending)
            return <PendingIcon
                borderColor={theme.surfaceOnElevation}
            />

        if (isSuccess) return <SuccessIcon width={18} height={18} style={style} color={theme.accentGreen} />;

        if (isFailure) return <FailureIcon width={18} height={18} style={style} color={theme.accentRed} />;

        return null;
    })();
    return (
        <Pressable
            onPress={() => onPress(order)}
            style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                backgroundColor: theme.surfaceOnBg,
                borderRadius: 20,
                padding: 20,
                opacity: pressed ? 0.5 : 1,
            })}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                <View style={{
                    backgroundColor: theme.divider,
                    borderRadius: 23,
                    width: 46,
                    height: 46,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <OrderIcon width={46} height={46} color={theme.iconPrimary} />
                    {iconStatus}
                </View>
                <View style={{ flexShrink: 1 }}>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={[Typography.semiBold17_24, { color: theme.textPrimary }]}>{t('order.deposit')}</Text>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={[Typography.regular15_20, { color: theme.textSecondary }]}>{description}</Text>
                </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={[Typography.semiBold17_24, { color: theme.accentGreen }]}>+{humanizeNumber(order.amountExpectedTo || 0)} {symbol}</Text>
                {isInitial && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <CountdownIcon width={16} height={16} color={theme.iconPrimary} />
                        <OrderCountdown
                            expiresAt={order.expiresAt}
                            style={[Typography.regular15_20, { color: theme.textSecondary }]}
                        />
                    </View>
                )}
            </View>
        </Pressable>
    );
});

OrderItemView.displayName = 'OrderItemView';
