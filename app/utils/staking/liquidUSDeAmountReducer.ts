import { formatInputAmount } from "../formatCurrency";

export type LiquidUSDeAmountAction = { type: 'usde', amount: string } | { type: 'tsUsde', amount: string };
type AmountState = { usde: string, tsUsde: string };

export function reduceLiquidUSDeAmount(state: AmountState, action: LiquidUSDeAmountAction, rate: number) {
    if (action.amount === '' || action.amount === '') {
        return { usde: '', tsUsde: '' };
    }
    try {

        const sanitizedAmount = action.amount.replace(',', '.').replaceAll(' ', '');
        if (action.type === 'usde') {
            const usde = formatInputAmount(sanitizedAmount, 6, { skipFormattingDecimals: true }, state.usde);
            const usdeNum = Number(sanitizedAmount);
            const computed = usdeNum / rate;
            const tsUsde = formatInputAmount(computed.toString(), 6, { skipFormattingDecimals: true }, state.tsUsde);

            return { usde, tsUsde };
        }

        const tsUsde = formatInputAmount(sanitizedAmount, 6, { skipFormattingDecimals: true }, state.tsUsde);
        const tsUsdeNum = Number(sanitizedAmount);
        const computed = tsUsdeNum * rate;
        const usde = formatInputAmount(computed.toString(), 6, { skipFormattingDecimals: true }, state.usde);

        return { usde, tsUsde };
    } catch {
        return state;
    }
}

export function liquidUSDeAmountReducer(rate: number) {
    return (state: AmountState, action: LiquidUSDeAmountAction): AmountState => {
        return reduceLiquidUSDeAmount(state, action, rate);
    }
}