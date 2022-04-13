import { BN } from "bn.js";
import { toNano } from "ton";

export function parseAmountToBn(amount: string) {
    if (amount === '') {
        return new BN(0);
    }

    let value = amount.replace(',', '.');

    return toNano(value);
}

export function parseAmountToNumber(amount: string) {
    if (amount === '') return 0;
    let value = parseFloat(amount.replace(',', '.'));
    if (isNaN(value)) return 0;
    return parseFloat(value.toFixed(8));
}

export function parseAmountToValidBN(amount: string) {
    try {
        return parseAmountToBn(amount);
    } catch (error) {
        return new BN(0);
    }
}

export function toFixedBN(amount: number) {
    return toNano(parseFloat(amount.toFixed(8)))
}