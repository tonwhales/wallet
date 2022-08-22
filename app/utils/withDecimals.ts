import BN from "bn.js";
import { fromNano, toNano } from "ton";
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

export function toBNWithDecimals(input: string, decimals?: number | null) {
    if (decimals === null || decimals === undefined) {
        return toNano(input);
    }
    var ether = numberToString(input);
    const numBase = String(Math.pow(10, decimals));
    const base = new BN(numBase, 10);
    const baseLength = numBase.length - 1 || 1;

    // Is it negative?
    var negative = ether.substring(0, 1) === '-';
    if (negative) {
        ether = ether.substring(1);
    }

    if (ether === '.') {
        throw new Error('while converting number ' + input + ' to wei, invalid value');
    }

    
    // Split it into a whole and fractional part
    var comps = ether.split('.');
    if (decimals === 0 && comps.length > 1) {
        throw new Error('while converting number ' + input + ' to wei,  to many decimal places');
    }
    if (comps.length > 2) {
        throw new Error('while converting number ' + input + ' to wei,  comps.length > 2');
    }

    var whole = comps[0],
        fraction = comps[1];

    if (!whole) {
        whole = '0';
    }
    if (!fraction) {
        fraction = '0';
    }
    if (fraction.length > baseLength) {
        throw new Error('while converting number ' + input + ' to wei, fraction.length > baseLength');
    }

    while (fraction.length < baseLength) {
        fraction += '0';
    }

    whole = new BN(whole);
    fraction = new BN(fraction);
    var wei = whole.mul(base).add(fraction);

    if (negative) {
        wei = wei.mul(negative1);
    }

    return new BN(wei.toString(10), 10);
}

export function fromBNWithDecimals(input: BN | number | string, decimals?: number | null) {
    if (decimals === null || decimals === undefined) {
        return fromNano(input);
    }
    var wei = numberToBN(input);
    var negative = wei.lt(zero);
    const numBase = String(Math.pow(10, decimals));
    const base = new BN(numBase, 10);
    var baseLength = numBase.toString().length - 1 || 1;
    var options: any = {};

    if (negative) {
        wei = wei.mul(negative1);
    }

    var fraction = wei.mod(base).toString(10);

    while (fraction.length < baseLength) {
        fraction = '0' + fraction;
    }

    if (!options.pad) {
        fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1];
    }

    var whole = wei.div(base).toString(10);

    if (options.commify) {
        whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    var value = '' + whole + (fraction == '0' ? '' : '.' + fraction);

    if (negative) {
        value = '-' + value;
    }

    return value;
}