import { CurrencySymbols } from "../engine/products/PriceProduct";

function toLocaleNumber(value: string) {
    let parts = value.toString().split('.');
    parts[0] = parts[0].replaceAll(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join('.');
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
