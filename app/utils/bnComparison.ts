import { fromNano } from "@ton/core";

export function bnIsLess(a: bigint, b: number) {
    return parseFloat(fromNano(a)) < b;
}