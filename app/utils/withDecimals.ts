import BN from "bn.js";
const numberToBN = require('number-to-bn');

var zero = new BN(0);
var negative1 = new BN(-1);

function numberToString(arg: any) {
    if (typeof arg === 'string') {
        if (!arg.match(/^-?[0-9.]+$/)) {
            throw new Error('while converting number to string, invalid number value \'' + arg + '\', should be a number matching (^-?[0-9.]+).');
        }
        return arg;
    } else if (typeof arg === 'number') {
        return String(arg);
    } else if (typeof arg === 'object' && arg.toString && (arg.toTwos || arg.dividedToIntegerBy)) {
        if (arg.toPrecision) {
            return String(arg.toPrecision());
        } else {
            return arg.toString(10);
        }
    }
    throw new Error('while converting number to string, invalid number value \'' + arg + '\' type ' + typeof arg + '.');
}

export function toBNWithDecimals(value: number | string | BN, decimals?: number | null) {
    let ether = numberToString(value);
    let baseString = `1${'0'.repeat(decimals ? decimals : 9)}`;
    let base = new BN(baseString, 10);
    let baseLength = baseString.length - 1 || 1;

    // Is it negative?
    let negative = ether.substring(0, 1) === '-';
    if (negative) {
        ether = ether.substring(1);
    }

    if (ether === '.') {
        throw new Error('while converting number ' + value + ' to wei, invalid value');
    }

    // Split it into a whole and fractional part
    let comps = ether.split('.');
    if (comps.length > 2) {
        throw new Error('while converting number ' + value + ' to wei,  too many decimal points');
    }

    let whole = comps[0],
        fraction = comps[1];

    if (!whole) {
        whole = '0';
    }
    if (!fraction) {
        fraction = '0';
    }
    if (fraction.length > baseLength) {
        throw new Error('while converting number ' + value + ' to wei, too many decimal places');
    }

    while (fraction.length < baseLength) {
        fraction += '0';
    }

    whole = new BN(whole);
    fraction = new BN(fraction);
    let wei = whole.mul(base).add(fraction);

    if (negative) {
        wei = wei.mul(negative1);
    }

    return new BN(wei.toString(10), 10);
}

export function fromBNWithDecimals(input: BN | number | string, decimals?: number | null) {
    var wei = numberToBN(input);
    var negative = wei.lt(zero);
    let baseString = `1${'0'.repeat(decimals ? decimals : 9)}`;
    let base = new BN(baseString, 10);
    let baseLength = decimals || 1;

    if (negative) {
        wei = wei.mul(negative1);
    }

    var fraction = wei.mod(base).toString(10); // eslint-disable-line

    while (fraction.length < baseLength) {
        fraction = '0' + fraction;
    }

    fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1];

    var whole = wei.div(base).toString(10); // eslint-disable-line

    var value = '' + whole + (fraction == '0' ? '' : '.' + fraction); // eslint-disable-line

    if (negative) {
        value = '-' + value;
    }

    return value;
}