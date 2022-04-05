import BN from "bn.js";
import { fromNano } from "ton";

export function bnToFloat(value: BN) {
    console.log('here');
    return parseFloat(fromNano(value));
}