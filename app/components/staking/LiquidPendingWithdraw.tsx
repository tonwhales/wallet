import { memo, useEffect, useMemo, useState } from "react"
import { View, Text } from "react-native"
import { Countdown } from "../Countdown";
import { Typography } from "../styles";
import { t } from "../../i18n/t";
import { PriceComponent } from "../PriceComponent";
import { ItemDivider } from "../ItemDivider";
import { useTheme } from "../../engine/hooks";
import { fromBnWithDecimals } from "../../utils/withDecimals";
import { toNano } from "@ton/core";

export const LiquidPendingWithdraw = memo(({
    pendingUntil,
    amount,
    last,
    symbol,
    decimals = 9,
    priceUSD,
    onTimeOut
}: {
    pendingUntil: number,
    amount: bigint,
    last?: boolean,
    symbol?: string,
    decimals?: number,
    priceUSD?: number,
    onTimeOut?: () => void
}) => {
    const theme = useTheme();
    const [left, setLeft] = useState(pendingUntil - Math.floor(Date.now() / 1000));

    useEffect(() => {
        const timerId = setInterval(() => {
            setLeft(pendingUntil - Math.floor(Date.now() / 1000));
        }, 1000);
        return () => {
            clearInterval(timerId);
        };
    }, [pendingUntil]);

    useEffect(() => {
        if (left <= 0) {
            onTimeOut?.();
        }
    }, [left]);

    const _amount = useMemo(() => {
        try {
            return parseFloat(fromBnWithDecimals(amount, decimals));
        } catch (error) {
            return 0;
        }
    }, [amount, decimals]);

    return (
        <>
            <View style={{
                flexDirection: 'row', width: '100%',
                justifyContent: 'space-between', alignItems: 'center',
            }}>
                <View>
                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                        {t('products.staking.withdrawStatus.pending')}
                    </Text>
                    <Text style={[{ color: theme.textSecondary, marginTop: 2 }, Typography.regular15_20]}>
                        <Countdown
                            hidePrefix
                            left={left}
                            textStyle={[{ flex: 1, flexShrink: 1 }, Typography.regular15_20]}
                        />
                    </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                        {_amount.toFixed(3)}
                        <Text style={{ color: theme.textSecondary }}>
                            {symbol || ' TON'}
                        </Text>
                    </Text>
                    <PriceComponent
                        amount={toNano(_amount)}
                        style={{
                            backgroundColor: theme.transparent,
                            paddingHorizontal: 0,
                            paddingVertical: 0,
                            alignSelf: 'flex-end'
                        }}
                        textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                        theme={theme}
                        priceUSD={priceUSD}
                    />
                </View>
            </View>
            {!last && (<ItemDivider marginHorizontal={0} marginVertical={8} />)}
        </>
    );
});