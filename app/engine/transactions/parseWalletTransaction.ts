import { BN } from "bn.js";
import { Address, Cell, parseMessageRelaxed, RawTransaction } from "ton";
import { Transaction, TxBody } from '../hooks/useAccountTransactions';
import { StoredTransaction } from '../hooks/useRawAccountTransactions';

export function parseBody(cell: Cell): TxBody | null {
    let slice = cell.beginParse();
    if (slice.remaining < 32) {
        return null;
    }

    // Comment
    if (slice.readUintNumber(32) === 0) {
        let res = slice.readBuffer(Math.floor(slice.remaining / 8)).toString();
        let rr = slice;
        if (rr.remainingRefs > 0) {
            rr = rr.readRef();
            res += rr.readBuffer(Math.floor(rr.remaining / 8)).toString();
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