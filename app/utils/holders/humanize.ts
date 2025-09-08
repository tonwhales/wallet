import { CurrencySymbols } from "../formatCurrency";

export function getObjectType(value: any): string {
  return Object.prototype.toString.call(value);
}

export function isNumber(value: any): value is number {
  return typeof value === 'number';
}

export function isString(value: any): value is string {
  return typeof value === 'string' || getObjectType(value) === '[object String]';
}

export function isUndefined(value: any): value is undefined {
  return typeof value === 'undefined';
}

export function isNullOrUndefined(data: unknown): data is null | undefined {
  return data === null || isUndefined(data);
}

export function getFiatSymbol(fiatCurrency: string): string {
  return (
    Object.entries(CurrencySymbols).find((k) => k[0] === fiatCurrency)?.[1]?.symbol ||
    fiatCurrency
  );
}

export function parseCoins(value: string): number {
  return parseFloat(value?.replace(/,/g, '.') || '0');
}

export function fromCoins(src: bigint | string, precision: number): string {
  const prec = 10n ** BigInt(precision);
  let v = BigInt(src);
  let neg = false;
  if (v < 0) {
    neg = true;
    v = -v;
  }
  // Convert fraction
  const frac = v % prec;
  let facStr = frac.toString();
  while (facStr.length < precision) {
    facStr = `0${facStr}`;
  }
  [, facStr] = facStr.match(/^([0-9]*[1-9]|0)(0*)/)!;
  // Convert whole
  const whole = v / prec;
  const wholeStr = whole.toString();
  // Value
  let value = `${wholeStr}${facStr === '0' ? '' : `.${facStr}`}`;
  if (neg) {
    value = `-${value}`;
  }
  return value;
}

export function humanizeNumber(
  value: string | number,
  minimumFractionDigits = 0,
  maximumFractionDigits = 2,
  digitsAfterDot = 2
): string {
  if (isNullOrUndefined(value)) return '0';

  const stringedValue = typeof value === 'number' ? String(value) : value;
  const dotIndex = stringedValue.indexOf('.');

  const humanizedValue =
    dotIndex < 0 ? stringedValue : stringedValue.slice(0, dotIndex + digitsAfterDot + 1);

  return Number(humanizedValue)
    .toLocaleString('en', {
      minimumFractionDigits,
      maximumFractionDigits
    })
    .replace(/,/g, ' ');
}

/**
 * 1 = 1
 * 1.1234 = 1.12
 * 0.1234 = 0.12
 * 0.000001234 = 0.0000012
 */
export function humanizeNumberAdaptive(value: string | number): string {
  if (isNullOrUndefined(value)) return '0';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '0';
  
  // For numbers >= 1 or integers - maximum 2 decimal places
  if (Math.abs(num) >= 1) {
    const fractionDigits = num % 1 === 0 ? 0 : 2;
    return humanizeNumber(num, 0, fractionDigits);
  }
  
  // For numbers < 1 - find position of first significant digit + 2
  const str = Math.abs(num).toString();
  const match = str.match(/\.0*(\d)/);
  const digitsAfterDot = match ? str.indexOf(match[1]) - str.indexOf('.') + 1 : 2;
  
  return humanizeNumber(num, 0, digitsAfterDot, digitsAfterDot);
}

export function humanizeCoins(
  price: bigint | string,
  decimals?: number,
  currency?: string
): string {
  let value = price as string;

  if (isNumber(decimals)) {
    value = fromCoins(price, decimals);
  }

  return `${humanizeNumber(parseCoins(value))}${currency ? ` ${currency}` : ''}`;
}

export function humanizeFiat(value: string | number, currency?: string): string {
  return `${humanizeNumber(isString(value) ? parseCoins(value) : value)}${currency ? ` ${getFiatSymbol(currency)}` : ''
    }`;
}

export function addSpaceSeparators(value: string | number): string {
  if (isNullOrUndefined(value)) return '0';
  
  const stringValue = String(value);
  const parts = stringValue.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}