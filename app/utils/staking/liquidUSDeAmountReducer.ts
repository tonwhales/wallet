import { toNano } from "@ton/core";
import { formatInputAmount } from "../formatCurrency";

export type LiquidUSDeAmountAction = { type: 'usde', amount: string } | { type: 'tsUsde', amount: string };
type AmountState = { usde: string, tsUsde: string };

export function liquidUSDeAmountReducer(rate: bigint) {
    return (state: AmountState, action: LiquidUSDeAmountAction): AmountState => {
        if (action.amount === '' || action.amount === '') {
            return { usde: '', tsUsde: '' };
        }
        try {
            const amountString = action.amount.replace(',', '.').replaceAll(' ', '');
            const amount = toNano(amountString);

            if (action.type === 'usde') {
                const usde = formatInputAmount(action.amount, 9, { skipFormattingDecimals: true }, state.usde);
                const computed = amount * toNano(rate.toString())
                console.log('comput', amount.toString(), rate.toString(), computed.toString());
                const tsUsde = formatInputAmount(computed.toString(), 9, { skipFormattingDecimals: true }, state.tsUsde);
                console.log('tsUsde', tsUsde);

                if (usde === state.usde) {
                    return state;
                }

                return { usde, tsUsde };
            }

            const tsUsde = formatInputAmount(action.amount, 9, { skipFormattingDecimals: true }, state.tsUsde);
            const computed = amount / toNano(rate.toString())
            const usde = formatInputAmount(computed.toString(), 9, { skipFormattingDecimals: true }, state.usde);

            if (tsUsde === state.tsUsde) {
                return state;
            }

            return { usde, tsUsde };
        } catch {
            return state;
        }
    }
}