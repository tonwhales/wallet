import BN from "bn.js";
import { fromNano } from "ton";

export function bnToFloat(value: BN) {
    return parseFloat(fromNano(value));
}