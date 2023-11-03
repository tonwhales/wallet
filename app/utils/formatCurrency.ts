import { getNumberFormatSettings } from "react-native-localize";

export const PrimaryCurrency: { [key: string]: string } = {
    Usd: 'USD',
    Eur: 'EUR',
    Rub: 'RUB',
    Gbp: 'GBP',
    Chf: 'CHF',
    Cny: 'CNY',
    Krw: 'KRW',
    Idr: 'IDR',
    Inr: 'INR',
    Jpy: 'JPY',
}

export const CurrencySymbols: { [key: string]: { symbol: string, end?: boolean } } = {
    [PrimaryCurrency.Usd]: { symbol: '$' },
    [PrimaryCurrency.Eur]: { symbol: '€' },
    [PrimaryCurrency.Rub]: { symbol: '₽', end: true },
    [PrimaryCurrency.Gbp]: { symbol: '£' },
    [PrimaryCurrency.Chf]: { symbol: '₣' },
    [PrimaryCurrency.Cny]: { symbol: '¥' },
    [PrimaryCurrency.Krw]: { symbol: '₩' },
    [PrimaryCurrency.Idr]: { symbol: 'Rp', end: true },
    [PrimaryCurrency.Inr]: { symbol: '₹' },
    [PrimaryCurrency.Jpy]: { symbol: '¥' },
};

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
        return `${neg ? '-' : ''}${symbols.symbol}${toLocaleNumber(amount)}`;
    }
    return `${neg ? '-' : ''}${toLocaleNumber(amount)}${symbols.symbol}`;
}
