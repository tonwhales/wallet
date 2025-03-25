import { memo } from "react";
import { PerfView } from "../basic/PerfView";
import { PerfText } from "../basic/PerfText";
import { Typography } from "../styles";
import { t } from "../../i18n/t";
import { ItemDivider } from "../ItemDivider";
import { ItemGroup } from "../ItemGroup";
import { toNano } from "@ton/core";
import { fromBnWithDecimals } from "../../utils/withDecimals";
import { useTheme } from "../../engine/hooks";

function formatAmount(amount: string | null | undefined): string | null {
    if (!amount) {
        return null;
    }

    return `${fromBnWithDecimals(toNano(amount), 6)} USDC`;
}

export const HoldersSolanaLimitsView = memo(({
    onetime,
    daily,
    monthly
}: {
    onetime?: string | null;
    daily?: string | null;
    monthly?: string | null;
}) => {
    const theme = useTheme();

    // We have no jetton address so are forced to use built-in decimals (6 for USDC)
    const _onetime = formatAmount(onetime);
    const _daily = formatAmount(daily);
    const _monthly = formatAmount(monthly);

    return (
        <ItemGroup>
            <PerfView style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                <PerfText style={[{ color: theme.textSecondary, marginBottom: 8 }, Typography.regular17_24]}>
                    {t('known.holders.limitsTitle')}
                </PerfText>
                {!!_onetime && (
                    <PerfView>
                        <PerfView style={{ justifyContent: 'space-between', flexDirection: 'row', width: '100%' }}>
                            <PerfText style={[{ color: theme.textPrimary }, Typography.regular15_20]}>
                                {t('known.holders.limitsOneTime')}
                            </PerfText>
                            <PerfText style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                {_onetime}
                            </PerfText>
                        </PerfView>
                        {(_daily || _monthly) && (
                            <ItemDivider marginHorizontal={0} />
                        )}
                    </PerfView>
                )}
                {!!_daily && (
                    <PerfView>
                        <PerfView style={{ justifyContent: 'space-between', flexDirection: 'row', width: '100%' }}>
                            <PerfText style={[{ color: theme.textPrimary }, Typography.regular15_20]}>
                                {t('known.holders.limitsDaily')}
                            </PerfText>
                            <PerfText style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                {_daily}
                            </PerfText>
                        </PerfView>
                        {(_monthly) && (
                            <ItemDivider marginHorizontal={0} />
                        )}
                    </PerfView>
                )}
                {!!_monthly && (
                    <PerfView>
                        <PerfView style={{ justifyContent: 'space-between', flexDirection: 'row', width: '100%' }}>
                            <PerfText style={[{ color: theme.textPrimary }, Typography.regular15_20]}>
                                {t('known.holders.limitsMonthly')}
                            </PerfText>
                            <PerfText style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                {_monthly}
                            </PerfText>
                        </PerfView>
                    </PerfView>
                )}
            </PerfView>
        </ItemGroup>
    );
})