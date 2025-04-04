import { memo } from "react";
import { PerfView } from "../basic/PerfView";
import { PerfText } from "../basic/PerfText";
import { Typography } from "../styles";
import { t } from "../../i18n/t";
import { ItemDivider } from "../ItemDivider";
import { ItemGroup } from "../ItemGroup";
import { useSolanaToken, useTheme } from "../../engine/hooks";
import { SolanaToken } from "../../engine/api/solana/fetchSolanaTokens";

function formatAmount(amount: string | null | undefined, token: SolanaToken | null): string | null {
    try {
        if (!amount) {
            return null;
        }

        return `${Number(amount) / 10 ** (token?.decimals ?? 6)} ${token?.symbol ?? 'USDC'}`;
    } catch {
        return null;
    }
}

export const HoldersSolanaLimitsView = memo(({
    onetime,
    daily,
    monthly,
    mint,
    owner
}: {
    onetime?: string | null;
    daily?: string | null;
    monthly?: string | null;
    mint?: string | null;
    owner: string;
}) => {
    const theme = useTheme();
    const token = useSolanaToken(owner, mint);

    // We have no jetton address so are forced to use built-in decimals (6 for USDC)
    const _onetime = formatAmount(onetime, token);
    const _daily = formatAmount(daily, token);
    const _monthly = formatAmount(monthly, token);

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