import BN from "bn.js";
import { Cell } from "ton";
import { bnToAddress } from "./bnToAddress";

function parseObject(x: { [key: string]: any }): any {
    const typeName = x['@type'];
    switch (typeName) {
        case 'tvm.list':
        case 'tvm.tuple':
            return x.elements.map(parseObject);
        case 'tvm.stackEntryTuple':
            return parseObject(x.tuple);
        case 'tvm.stackEntryNumber':
            return parseObject(x.number);
        case 'tvm.numberDecimal':
            return new BN(x.number, 10);
        default:
            throw new Error('unknown type ' + typeName);
    }
}

export class TupleSlice {
    private readonly items: any[];
    constructor(items: any[]) {
        this.items = [...items];
    }

    readNumber() {
        if (this.items[0][0] !== 'num') {
            throw Error('Not a number');
        }
        let res = parseInt(this.items[0][1]);
        this.items.splice(0, 1);
        return res;
    }

    readBoolean() {
        if (this.items[0][0] !== 'num') {
            throw Error('Not a number');
        }
        let res = parseInt(this.items[0][1]);
        this.items.splice(0, 1);
        return res === 0 ? false : true;
    }

    readBigNumber() {
        if (this.items[0][0] !== 'num') {
            throw Error('Not a number');
        }
        let res = new BN((this.items[0][1] as string).slice(2), 'hex');
        this.items.splice(0, 1);
        return res;
    }

    readCell() {
        if (this.items[0][0] !== 'cell') {
            throw Error('Not a cell');
        }
        let res = Cell.fromBoc(Buffer.from(this.items[0][1].bytes as string, 'base64'))[0];
        this.items.splice(0, 1);
        return res;
    }

    readWorkchainAddress() {
        if (this.items[0][0] !== 'num') {
            throw Error('Not a number');
        }
        let bn = this.readBigNumber();
        return bnToAddress(bn);
    }

    readList() {
        if (this.items[0][0] !== 'list') {
            throw Error('Not a list');
        }
        let res = parseObject(this.items[0][1]);
        this.items.splice(0, 1);
        return res
    }

    readTuple() {
        if (this.items[0][0] !== 'tuple') {
            throw Error('Not a tuple');
        }
        let res = parseObject(this.items[0][1]);
        this.items.splice(0, 1);
        return res
    }
}