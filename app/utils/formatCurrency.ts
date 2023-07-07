import { getNumberFormatSettings } from "react-native-localize";
import { CurrencySymbols } from "../engine/products/PriceProduct";

function toLocaleNumber(value: string) {
    const { decimalSeparator } = getNumberFormatSettings();

    if (decimalSeparator === ',') {
        return `${value}`.replace('.', ',');
    }
    return value;
}

export function formatCurrency(amount: string, currency: string, neg?: boolean): string {
    const symbols = CurrencySymbols[currency];
    if (!symbols) {
        return `${neg ? '-' : ''}${toLocaleNumber(amount)} ${currency?.toUpperCase()}`;
    }

    if (!symbols.end) {
        return `${neg ? '-' : ''}${symbols.symbol} ${toLocaleNumber(amount)}`;
    }
    return `${neg ? '-' : ''}${toLocaleNumber(amount)} ${symbols.symbol}`;
}
