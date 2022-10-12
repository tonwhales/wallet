import { getNumberFormatSettings } from "react-native-localize";
import { CurrencySymbols, PrimaryCurrency } from "../engine/products/PriceProduct";

function toLocaleNumber(value: string) {
    const { decimalSeparator } = getNumberFormatSettings();

    if (decimalSeparator === ',') {
        return `${value}`.replace('.', ',');
    }
    return value;
}

export function formatCurrency(amount: string, currency: string): string {
    const symbols = CurrencySymbols[currency];
    if (!symbols) {
        return `${toLocaleNumber(amount)} ${currency?.toUpperCase()}`;
    }

    if (!symbols.end) {
        return `${symbols.symbol}${toLocaleNumber(amount)}`;
    }
    return `${toLocaleNumber(amount)}${symbols.symbol}`;
}
