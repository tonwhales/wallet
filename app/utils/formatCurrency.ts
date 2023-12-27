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
  [PrimaryCurrency.Usd]: { symbol: '$', end: true, label: 'U.S. Dollar' },
  [PrimaryCurrency.Eur]: { symbol: '€', end: true, label: 'Euro' },
  [PrimaryCurrency.Rub]: { symbol: '₽', end: true, label: 'Russian Ruble' },
  [PrimaryCurrency.Gbp]: { symbol: '£', end: true, label: 'British Pound' },
  [PrimaryCurrency.Chf]: { symbol: '₣', end: true, label: 'Swiss Franc' },
  [PrimaryCurrency.Cny]: { symbol: '¥', end: true, label: 'Chinese Yuan' },
  [PrimaryCurrency.Krw]: { symbol: '₩', end: true, label: 'South Korean Won' },
  [PrimaryCurrency.Idr]: { symbol: 'Rp', end: true, label: 'Indonesian Rupiah' },
  [PrimaryCurrency.Inr]: { symbol: '₹', end: true, label: 'Indian Rupee' },
  [PrimaryCurrency.Jpy]: { symbol: '¥', end: true, label: 'Japanese Yen' },
};

export function formatInputAmount(
  raw: string,
  decimals: number,
  formatting?: {
    skipFormattingReal?: boolean,
    skipFormattingDecimals?: boolean,
    trimSeparator?: boolean,
  },
  previousRaw?: string,
) {
  // Check for deleted char being space
  if (!!previousRaw) {
    const charsChanged = previousRaw.length - raw.length;

    if (charsChanged === 1) {
      // finding deleted char and checking if it was space, if so, deleting one more char
      let charIndex;
      const deletedChar = previousRaw.split('').find((char, index) => {
        if (char !== raw[index]) {
          charIndex = index;
          return true;
        }
      });
      if (deletedChar === ' ' && !!charIndex) {
        raw = raw.slice(0, charIndex - 1) + raw.slice(charIndex);
      }
    }
  }


  const { skipFormattingReal, skipFormattingDecimals, trimSeparator } = formatting || {};
  const { decimalSeparator } = getNumberFormatSettings();

  if (raw.endsWith(',') || raw.endsWith('.')) {
    raw = raw.slice(0, -1) + decimalSeparator;
  }

  raw = raw.replaceAll(' ', '');

  // remove non-numeric charsets except comma and dot
  raw = raw.replace(/[^0-9\,\.]/g, '');
  // replace all comma with dot
  raw = raw.replace(/\,/g, '.');
  // allow only one leading zero
  raw = raw.replace(/^([0]+)/, '0');
  // prepend zero before leading comma
  raw = raw.replace(/^([\.]+)/, '0.');

  // allow only one comma
  let commaFound = false;
  raw = raw.replace(/\./g, () => {
    if (!commaFound) {
      commaFound = true;
      return '.';
    } else {
      return '';
    }
  });

  // apply length limitations
  const exp = raw.split('.');
  if (!skipFormattingReal) {
    exp[0] = exp[0].substring(0, 16);
  }
  let expNumLength = exp[0].length;
  exp[0] = exp[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  if (exp[1]) {
    exp[1] = exp[1]
      .substring(0, Math.min(decimals, skipFormattingDecimals ? 255 : Math.max(16 - expNumLength, 0)))
      .trim();
  }

  return trimSeparator && typeof exp[1] === 'string' && exp[1].length === 0
    ? exp[0]
    : exp.join(decimalSeparator);
}

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
    return `${neg ? '-' : ''}${symbols.symbol} ${toLocaleNumber(amount)}`;
  }
  return `${neg ? '-' : ''}${toLocaleNumber(amount)} ${symbols.symbol}`;
}
