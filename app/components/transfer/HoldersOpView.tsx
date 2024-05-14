import { memo } from "react";
import { ThemeType } from "../../engine/state/theme";
import { PerfView } from "../basic/PerfView";
import { PerfText } from "../basic/PerfText";
import { Typography } from "../styles";
import { t } from "../../i18n/t";
import { ItemDivider } from "../ItemDivider";
import { ItemGroup } from "../ItemGroup";

export type HoldersOpType = {
    type: 'topUp';
    amount: string;
} | {
    type: 'jettonTopUp';
} | {
    type: 'limitsChange';
    onetime: string | null;
    daily: string | null;
    monthly: string | null;
}

export const HoldersOpView = memo(({ theme, op }: { theme: ThemeType, op: HoldersOpType }) => {
    if (op.type === 'jettonTopUp') { // Jetton account top up (amount is shown in the Tx preview title)
        return null;
    }

    if (op.type === 'topUp') { // TON account top up
        return (
            <ItemGroup style={{ marginTop: 16 }}>
                <PerfView style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                    <PerfText style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                        {t('known.holders.topUpTitle')}
                    </PerfText>
                    <PerfView style={{ alignItems: 'flex-start' }}>
                        <PerfText style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                            {`${op.amount} TON`}
                        </PerfText>
                    </PerfView>
                </PerfView>
            </ItemGroup>
        );
    }

    return ( // 
        <ItemGroup>
            <PerfView style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                <PerfText style={[{ color: theme.textSecondary, marginBottom: 8 }, Typography.regular17_24]}>
                    {t('known.holders.limitsTitle')}
                </PerfText>
                {!!op.onetime && (
                    <>
                        <PerfView style={{ justifyContent: 'space-between', flexDirection: 'row', width: '100%' }}>
                            <PerfText style={[{ color: theme.textPrimary }, Typography.regular15_20]}>
                                {t('known.holders.limitsOneTime')}
                            </PerfText>
                            <PerfText style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                {`${op.onetime} TON`}
                            </PerfText>
                        </PerfView>
                        {(!!op.daily || !!op.monthly) && (
                            <ItemDivider marginHorizontal={0} />
                        )}
                    </>
                )}
                {!!op.daily && (
                    <>
                        <PerfView style={{ justifyContent: 'space-between', flexDirection: 'row', width: '100%' }}>
                            <PerfText style={[{ color: theme.textPrimary }, Typography.regular15_20]}>
                                {t('known.holders.limitsDaily')}
                            </PerfText>
                            <PerfText style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                {`${op.daily} TON`}
                            </PerfText>
                        </PerfView>
                        {!!op.monthly && (
                            <ItemDivider marginHorizontal={0} />
                        )}
                    </>
                )}
                {!!op.monthly && (
                    <PerfView style={{ justifyContent: 'space-between', flexDirection: 'row', width: '100%' }}>
                        <PerfText style={[{ color: theme.textPrimary }, Typography.regular15_20]}>
                            {t('known.holders.limitsMonthly')}
                        </PerfText>
                        <PerfText style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                            {`${op.monthly} TON`}
                        </PerfText>
                    </PerfView>
                )}
            </PerfView>
        </ItemGroup>
    );
})