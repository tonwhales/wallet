export function toBnWithDecimals(src: bigint | number | string, precision: number): bigint {
    const prec = 10n ** BigInt(precision);
    if (typeof src === 'bigint') {
      return src * prec;
    }
    if (typeof src === 'number') {
      return BigInt(src) * prec;
    }
    // Check sign
    let neg = false;
    while (src.startsWith('-')) {
      neg = !neg;
      // eslint-disable-next-line no-param-reassign
      src = src.slice(1);
    }
    // Split string
    if (src === '.') {
      throw Error('Invalid number');
    }
    const parts = src.split('.');
    if (parts.length > 2) {
      throw Error('Invalid number');
    }
    // Prepare parts
    let whole = parts[0];
    let frac = parts[1];
    if (!whole) {
      whole = '0';
    }
    if (!frac) {
      frac = '0';
    }
    if (frac.length > precision && /* corner case for zero precision values */ (frac !== '0' && precision !== 0)) { 
      throw Error('Invalid number');
    }
    while (frac.length < precision) {
      frac += '0';
    }
    // Convert
    let r = BigInt(whole) * prec + BigInt(frac);
    if (neg) {
      r = -r;
    }
    return r;
  }
  
  export function fromBnWithDecimals(src: bigint | string, precision?: number | null): string {
    precision = precision ?? 9;
    
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