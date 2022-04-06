import BN from "bn.js";
import { fromNano } from "ton";

export function bnIsLess(a: BN, b: number) {
    return parseFloat(fromNano(a)) < b;
}

export function bnIsGreater(a: BN, b: number) {
    return parseFloat(fromNano(a)) > b;
}