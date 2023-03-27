import { failure, success, Type } from "io-ts"
import * as t from 'io-ts';
import { Address, AddressExternal, BitString, Cell } from "ton"
import { AppConfig } from "../../AppConfig";
import BN from "bn.js";

export class AddressType extends Type<Address, string, unknown> {
    readonly _tag: 'AddressType' = 'AddressType'
    constructor() {
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
                return u.toFriendly({ testOnly: AppConfig.isTestnet });
            }
        )
    }
}

export const address = new AddressType();

export class BNType extends Type<BN, string, unknown> {
    readonly _tag: 'BNType' = 'BNType'
    constructor() {
        super(
            'BN',
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

class AddressExternalType extends t.Type<AddressExternal, string, unknown> {
    readonly _tag: 'AddressExternalType' = 'AddressExternalType';

    constructor() {
        super(
            'AddressExternal',
            (u): u is AddressExternal => u instanceof AddressExternal,
            (u, c) => {
                if (!t.string.validate(u, c)) {
                    return failure(u, c);
                }
                try {
                    const s = u as string;
                    const bitString = BitString.alloc(s.length);
                    for (let i = 0; i < s.length; i++) {
                        bitString.writeBit(s[i] === '1');
                    }
                    return success(new AddressExternal(bitString));
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

class MapStringBnType extends t.Type<Map<string, BN>, string, unknown> {
    readonly _tag: 'MapType' = 'MapType';

    constructor() {
        super(
            'Map',
            (u): u is Map<string, BN> => u instanceof Map,
            (u, c) => {
                if (!t.string.validate(u, c)) {
                    return failure(u, c);
                }
                try {
                    const s = u as string;
                    const map = new Map<string, BN>();
                    const parts = s.split(',');
                    for (const part of parts) {
                        const [key, value] = part.split(':');
                        map.set(key, new BN(value, 10));
                    }
                    return success(map);
                } catch (error) {
                    return t.failure(u, c);
                }
            },
            (u) => {
                const parts = [];
                for (const [key, value] of u.entries()) {
                    parts.push(`${key}:${value.toString(10)}`);
                }
                return parts.join(',');
            }
        )
    }
}

export const mapStringBn = new MapStringBnType();
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