import { BN } from "bn.js";
import { Address, Cell, parseMessage, RawTransaction } from "ton";
import { Body, Transaction } from "../Transaction";

export function parseBody(cell: Cell): Body | null {
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

export function parseWalletTransaction(tx: RawTransaction): Transaction {

    //
    // Resolve previous
    //

    let prev: { lt: string, hash: string } | null = null;
    if (!tx.prevTransaction.lt.eq(new BN(0))) {
        prev = { lt: tx.prevTransaction.lt.toString(10), hash: tx.prevTransaction.hash.toString('base64') };
    }

    //
    // Resolve fees
    // 

    let fees = tx.fees.coins;
    if (tx.description.storagePhase) {
        fees = fees.add(tx.description.storagePhase.storageFeesCollected);
    }
    for (let out of tx.outMessages) {
        if (out.info.type === 'internal') {
            fees = fees.add(out.info.fwdFee);
        }
    }

    //
    // Resolve amount
    //

    let amount = new BN(0);
    if (tx.inMessage && tx.inMessage.info.type === 'internal') {
        amount = amount.add(tx.inMessage.info.value.coins);
    }
    for (let out of tx.outMessages) {
        if (out.info.type === 'internal') {
            amount = amount.sub(out.info.value.coins);
        }
    }

    //
    // Resolve address
    //

    let address: Address | null = null;
    if (tx.inMessage && tx.inMessage.info.type === 'external-in') {
        for (let o of tx.outMessages) {
            if (o.info.dest) {
                address = o.info.dest;
            }
        }
    }
    if (tx.inMessage && tx.inMessage.info.type === 'internal') {
        address = tx.inMessage.info.src;
    }

    //
    // Resolve seqno
    //

    let seqno: number | null = null;
    if (tx.inMessage && tx.inMessage.info.type === 'external-in') {
        const parse = tx.inMessage.body.beginParse();
        parse.skip(512 + 32 + 32); // Signature + wallet_id + timeout
        seqno = parse.readUintNumber(32);
    }

    //
    // Resolve kind
    //

    let kind: 'out' | 'in' = 'out';
    let bounced = false;
    if (tx.inMessage && tx.inMessage.info.type === 'internal') {
        kind = 'in';
        if (tx.inMessage.info.bounced) {
            bounced = true;
        }
    }

    //
    // Resolve body and status
    //

    let body: Body | null = null;
    let status: 'success' | 'failed' = 'success';
    if (tx.inMessage && tx.inMessage.info.type === 'external-in') {
        const parse = tx.inMessage.body.beginParse();
        parse.skip(512 + 32 + 32 + 32); // Signature + wallet_id + timeout + seqno
        const command = parse.readUintNumber(8);
        if (command === 0) {
            let message = parseMessage(parse.readRef());
            if (message.info.dest) {
                address = message.info.dest;
            }
            body = parseBody(message.body);
        }
        if (tx.outMessagesCount === 0) {
            status = 'failed';
        }
        if (command === 3) {
            body = {
                type: 'comment',
                comment: 'Remove plugin'
            }
        }
    }
    if (tx.inMessage && tx.inMessage.info.type === 'internal') {
        body = parseBody(tx.inMessage.body);
    }

    return {
        id: 'chain:' + tx.lt.toString(10),
        lt: tx.lt.toString(10),
        fees,
        amount,
        address,
        seqno,
        kind,
        body,
        status,
        time: tx.time,
        bounced,
        prev
    };
}