import { memo } from "react";
import { ThemeType } from "../../engine/state/theme";
import { PerfView } from "../basic/PerfView";
import { PerfText } from "../basic/PerfText";
import { Typography } from "../styles";
import { t } from "../../i18n/t";
import { ItemDivider } from "../ItemDivider";
import { ItemGroup } from "../ItemGroup";
import { ContractKind } from "../../engine/api/fetchContractInfo";
import { toNano } from "@ton/core";
import { fromBnWithDecimals } from "../../utils/withDecimals";

export type HoldersOp = {
    type: 'topUp';
    amount: string;
} | {
    type: 'jettonTopUp';
} | {
    type: 'limitsChange';
    onetime?: string | null;
    daily?: string | null;
    monthly?: string | null;
}

function formatAmount(amount: string | null | undefined, type: 'USDT' | 'TON'): string | null {
    if (!amount) {
        return null;
    }
    
    // convert back to nano and format with decimals
    return `${fromBnWithDecimals(toNano(amount), type === 'USDT' ? 6 : 9)} ${type}`;
}

export const HoldersOpView = memo(({ theme, op, targetKind }: { theme: ThemeType, op: HoldersOp, targetKind?: ContractKind }) => {
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

    // We have no jetton address so are forced to use built-in decimals
    const type = targetKind === 'jetton-card' ? 'USDT' : 'TON'
    const onetime = formatAmount(op.onetime, type);
    const daily = formatAmount(op.daily, type);
    const monthly = formatAmount(op.monthly, type);

    return (
        <ItemGroup style={{ marginTop: 16 }}>
            <PerfView style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                <PerfText style={[{ color: theme.textSecondary, marginBottom: 8 }, Typography.regular17_24]}>
                    {t('known.holders.limitsTitle')}
                </PerfText>
                {!!onetime && (
                    <>
                        <PerfView style={{ justifyContent: 'space-between', flexDirection: 'row', width: '100%' }}>
                            <PerfText style={[{ color: theme.textPrimary }, Typography.regular15_20]}>
                                {t('known.holders.limitsOneTime')}
                            </PerfText>
                            <PerfText style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                {onetime}
                            </PerfText>
                        </PerfView>
                        {(!!op.daily || !!op.monthly) && (
                            <ItemDivider marginHorizontal={0} />
                        )}
                    </>
                )}
                {!!daily && (
                    <>
                        <PerfView style={{ justifyContent: 'space-between', flexDirection: 'row', width: '100%' }}>
                            <PerfText style={[{ color: theme.textPrimary }, Typography.regular15_20]}>
                                {t('known.holders.limitsDaily')}
                            </PerfText>
                            <PerfText style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                                {daily}
                            </PerfText>
                        </PerfView>
                        {!!op.monthly && (
                            <ItemDivider marginHorizontal={0} />
                        )}
                    </>
                )}
                {!!monthly && (
                    <PerfView style={{ justifyContent: 'space-between', flexDirection: 'row', width: '100%' }}>
                        <PerfText style={[{ color: theme.textPrimary }, Typography.regular15_20]}>
                            {t('known.holders.limitsMonthly')}
                        </PerfText>
                        <PerfText style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                            {monthly}
                        </PerfText>
                    </PerfView>
                )}
            </PerfView>
        </ItemGroup>
    );
})