import { fromNano, toNano } from "@ton/core";
import { formatInputAmount } from "../formatCurrency";

export type LiquidStakingAmountAction = { type: 'ton', amount: string } | { type: 'wsTon', amount: string };
type AmountState = { ton: string, wsTon: string };

export function liquidStakingAmountReducer(withdrawRate: bigint, depositRate: bigint, type: 'withdraw' | 'top_up') {
    return (state: AmountState, action: LiquidStakingAmountAction): AmountState => {
        if (action.amount === '') {
            return { ton: '', wsTon: '' };
        }
        try {
            const rate = fromNano(type === 'withdraw' ? withdrawRate : depositRate);

            const amount = action.amount.replace(',', '.').replaceAll(' ', '');
            if (action.type === 'ton') {
                const ton = formatInputAmount(action.amount, 9, { skipFormattingDecimals: true }, state.ton);
                const computed = parseFloat(amount) * parseFloat(rate);
                const wsTon = fromNano(toNano(computed.toFixed(9)));

                if (ton === state.ton) {
                    return state;
                }

                return { ton, wsTon };
            }

            const wsTon = formatInputAmount(action.amount, 9, { skipFormattingDecimals: true }, state.wsTon);
            const computed = parseFloat(amount) * (1 / parseFloat(rate));
            const ton = fromNano(toNano(computed.toFixed(9)));

            if (wsTon === state.wsTon) {
                return state;
            }

            return { ton, wsTon };
        } catch {
            return state;
        }
    }
}