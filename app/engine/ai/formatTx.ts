import { EventCategory, TxElement } from ".";
import { formatCurrency } from "../../utils/formatCurrency";

interface FormattedTxAmount {
    isNeg: boolean;
    text: string;
}

function isNegativeAmount(category: EventCategory): boolean {
    return [EventCategory.PURCHASE_FAILED, EventCategory.PURCHASE, EventCategory.WITHDRAWAL].includes(category);
}

export function formatTxAmount(tx: TxElement): FormattedTxAmount {
    const { amount, currency, category } = tx.attributes;

    if (!amount || !currency) {
        return {
            isNeg: false,
            text: ''
        };
    }

    const isNeg = category ? isNegativeAmount(category) : false;
    const text = formatCurrency(amount, currency, isNeg);

    return {
        isNeg,
        text
    };
}