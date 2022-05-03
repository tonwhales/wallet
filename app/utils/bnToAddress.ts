import BN from "bn.js";
import { Address } from "ton";

export function bnToAddress(bn: BN) {
    let r = bn.toString("hex");
    while (r.length < 64) {
        r = "0" + r;
    }
    return new Address(0, Buffer.from(r, "hex"));
}