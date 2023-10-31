import { failure, success, Type } from "io-ts";
import * as t from 'io-ts';
import { Address, ExternalAddress, Cell, BitBuilder } from "@ton/core";

export class AddressType extends Type<Address, string, unknown> {
    readonly _tag: 'AddressType' = 'AddressType'
    constructor(isTestnet: boolean) {
        super(
            'Address',
            (u): u is Address => u instanceof Address,
            (u, c) => {
                if (typeof u === 'string') {
                    return Address.isFriendly(u) ? success(Address.parse(u)) : failure(u, c);
                } else {
                    return failure(u, c);
                }
            },
            (u) => {
                return u.toString({ testOnly: isTestnet });
            }
        )
    }
}

export const address = (isTestnet: boolean) => new AddressType(isTestnet);

export class BNType extends Type<bigint, string, unknown> {
    readonly _tag: 'BitIntType' = 'BitIntType'
    constructor() {
        super(
            'BigInt',
            (u): u is bigint => typeof u === 'bigint',
            (u, c) => {
                if (!t.string.validate(u, c)) {
                    return failure(u, c);
                }
                try {
                    return success(BigInt(u as string));
                } catch (e) {
                    return failure(u, c);
                }
            },
            (u) => u.toString(10)
        )
    }
}

export const bignum = new BNType();


export class BufferType extends Type<Buffer, string, unknown> {
    readonly _tag: 'BufferType' = 'BufferType'
    constructor() {
        super(
            'Buffer',
            (u): u is Buffer => Buffer.isBuffer(u),
            (u, c) => {
                if (!t.string.validate(u, c)) {
                    return failure(u, c);
                }
                try {
                    return success(Buffer.from(u as string, 'base64'));
                } catch (e) {
                    return failure(u, c);
                }
            },
            (u) => u.toString('base64')
        )
    }
}

export const buffer = new BufferType();

export class CellType extends Type<Cell, string, unknown> {
    readonly _tag: 'CellType' = 'CellType'
    constructor() {
        super(
            'Cell',
            (u): u is Cell => u instanceof Cell,
            (u, c) => {
                if (!t.string.validate(u, c)) {
                    return failure(u, c);
                }
                try {
                    let boc = Buffer.from(u as string, 'base64');
                    return success(Cell.fromBoc(boc)[0]);
                } catch (e) {
                    return failure(u, c);
                }
            },
            (u) => u.toBoc({ idx: false }).toString('base64')
        )
    }
}

export const cell = new CellType();

class AddressExternalType extends t.Type<ExternalAddress, string, unknown> {
    readonly _tag: 'AddressExternalType' = 'AddressExternalType';

    constructor() {
        super(
            'AddressExternal',
            (u): u is ExternalAddress => u instanceof ExternalAddress,
            (u, c) => {
                if (!t.string.validate(u, c)) {
                    return failure(u, c);
                }
                try {
                    const s = u as string;
                    const bitString = new BitBuilder(s.length);
                    for (let i = 0; i < s.length; i++) {
                        bitString.writeBit(s[i] === '1');
                    }
                    return success(new ExternalAddress(BigInt('0b' + s), s.length));
                } catch (error) {
                    return t.failure(u, c);
                }
            },
            (u) => {
                return u.bits.toString();
            }
        )
    }
}

export const addressExternal = new AddressExternalType();

export class EnumType<A> extends t.Type<A> {
    public readonly _tag: 'EnumType' = 'EnumType'
    public enumObject!: object
    public constructor(e: object, name?: string) {
      super(
        name || 'enum',
        (u): u is A => {
          if (!Object.values(this.enumObject).find((v) => v === u)) {
            return false
          }
          // enum reverse mapping check
          if (typeof (this.enumObject as any)[u as string] === 'number') {
            return false
          }
  
          return true
        },
        (u, c) => (this.is(u) ? t.success(u) : t.failure(u, c)),
        t.identity,
      )
      this.enumObject = e
    }
  }
  
  // simple helper function
  export const createEnumType = <T>(e: object, name?: string) => new EnumType<T>(e, name)