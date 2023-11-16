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

export const CurrencySymbols: { [key: string]: { symbol: string, end?: boolean, label: string } } = {
    [PrimaryCurrency.Usd]: { symbol: '$', label: 'U.S. Dollar' },
    [PrimaryCurrency.Eur]: { symbol: '€', end: true, label: 'Euro' },
    [PrimaryCurrency.Rub]: { symbol: '₽', end: true, label: 'Russian Ruble' },
    [PrimaryCurrency.Gbp]: { symbol: '£', label: 'British Pound' },
    [PrimaryCurrency.Chf]: { symbol: '₣', label: 'Swiss Franc' },
    [PrimaryCurrency.Cny]: { symbol: '¥', label: 'Chinese Yuan' },
    [PrimaryCurrency.Krw]: { symbol: '₩', label: 'South Korean Won' },
    [PrimaryCurrency.Idr]: { symbol: 'Rp', end: true, label: 'Indonesian Rupiah' },
    [PrimaryCurrency.Inr]: { symbol: '₹', label: 'Indian Rupee' },
    [PrimaryCurrency.Jpy]: { symbol: '¥', label: 'Japanese Yen' },
};

function toLocaleNumber(value: string) {
    const { decimalSeparator } = getNumberFormatSettings();
    let parts = value.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " "); // Add spaces between thousands
    return parts.join(decimalSeparator === ',' ? ',' : '.');;
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
