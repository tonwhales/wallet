import { failure, success, Type } from "io-ts"
import * as t from 'io-ts';
import { Address } from "ton"
import { AppConfig } from "../../AppConfig";
import BN from "bn.js";

export class AddressType extends Type<Address, string, unknown> {
    readonly _tag: 'AddressType' = 'AddressType'
    constructor() {
        super(
            'Address',
            (u): u is Address => u instanceof Address,
            (u, c) => {
                if (!t.string.validate(u, c)) {
                    return failure(u, c);
                }
                return Address.isFriendly(u as string) ? success(Address.parse(u as string)) : failure(u, c);
            },
            (u) => u.toFriendly({ testOnly: AppConfig.isTestnet })
        )
    }
}

export const address = new AddressType();

export class BNType extends Type<BN, string, unknown> {
    readonly _tag: 'BNType' = 'BNType'
    constructor() {
        super(
            'Address',
            (u): u is BN => BN.isBN(u),
            (u, c) => {
                if (!t.string.validate(u, c)) {
                    return failure(u, c);
                }
                try {
                    return success(new BN(u as string, 10));
                } catch (e) {
                    return failure(u, c);
                }
            },
            (u) => u.toString(10)
        )
    }
}

export const bignum = new BNType();