import { Cell } from "@ton/core";
import { TxBody } from '../types';

export function parseBody(cell: Cell): TxBody | null {
    let slice = cell.beginParse();
    if (slice.remainingBits < 32) {
        return null;
    }

    // Comment
    if (slice.loadUint(32) === 0) {
        if (slice.remainingBits / 8 === 0) {
            return null;
        }
        let res = slice.loadBuffer(Math.floor(slice.remainingBits / 8)).toString();
        let rr = slice;
        if (rr.remainingRefs > 0) {
            rr = rr.loadRef().beginParse();
            res += rr.loadBuffer(Math.floor(rr.remainingBits / 8)).toString();
        }
        if (res.length > 0) {
            return { type: 'comment', comment: res };
        } else {
            return null;
        }
    }

    // Binary payload
    return { type: 'payload', cell };
}