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

export function parseWalletTransaction(tx: StoredTransaction, own: string, isTestnet: boolean): Transaction {

    //
    // Resolve previous
    //

    let prev: { lt: string, hash: string } | null = null;
    if (tx.prevTransaction.lt !== '0') {
        prev = tx.prevTransaction;
    }

    //
    // Resolve fees
    // 

    let fees = tx.fees;
    // if (tx.description.storagePhase) {
    //     fees = fees.add(tx.description.storagePhase.storageFeesCollected);
    // }
    // for (let out of tx.outMessages) {
    //     if (out.info.type === 'internal') {
    //         fees = fees.add(out.info.fwdFee);
    //     }
    // }

    //
    // Resolve amount
    //

    let amount = new BN(0);
    if (tx.inMessage && tx.inMessage.info.type === 'internal') {
        amount = amount.add(new BN(tx.inMessage.info.value));
    }
    for (let out of tx.outMessages) {
        if (out.info.type === 'internal') {
            amount = amount.sub(new BN(out.info.value));
        }
    }

    //
    // Resolve address
    //

    let address: Address | null = null;
    if (tx.inMessage && tx.inMessage.info.type === 'external-in') {
        for (let o of tx.outMessages) {
            if (o.info.dest && typeof o.info.dest === 'string') {
                address = Address.parse(o.info.dest);
            }
        }
    }
    if (tx.inMessage && tx.inMessage.info.type === 'internal') {
        address = Address.parse(tx.inMessage.info.src);
    }

    const inMessageBody = tx.inMessage ? Cell.fromBoc(Buffer.from(tx.inMessage.body, 'base64'))[0] : null;

    //
    // Resolve seqno
    //

    let seqno: number | null = null;

    if (tx.inMessage && tx.inMessage.info.type === 'external-in') {
        const parse = inMessageBody!.beginParse();
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

    let body: TxBody | null = null;
    let status: 'success' | 'failed' = 'success';
    if (tx.inMessage && tx.inMessage.info.type === 'external-in') {
        const parse = inMessageBody!.beginParse();
        parse.skip(512 + 32 + 32 + 32); // Signature + wallet_id + timeout + seqno
        const command = parse.readUintNumber(8);
        if (command === 0) {
            let message = parseMessageRelaxed(parse.readRef());
            if (message.info.dest && Address.isAddress(message.info.dest)) {
                address = message.info.dest;
            }
            body = parseBody(message.body);
        }
        if (tx.outMessagesCount === 0) {
            status = 'failed';
        }
    }
    if (tx.inMessage && tx.inMessage.info.type === 'internal') {
        body = parseBody(inMessageBody!);
    }

    const mentioned = new Set<string>();
    if (tx.inMessage && tx.inMessage.info.type === 'internal' && tx.inMessage.info.src === own) {
        mentioned.add(tx.inMessage.info.src);
    }
    for (let out of tx.outMessages) {
        if (out.info.dest && Address.isAddress(out.info.dest) && out.info.dest !== own) {
            mentioned.add(out.info.dest.toFriendly({ testOnly: isTestnet }));
        }
    }

    return {
        lt: tx.lt,
        fees: new BN(fees),
        amount,
        address,
        seqno,
        kind,
        body,
        status,
        time: tx.time,
        bounced,
        prev,
        mentioned: Array.from(mentioned),
        hash: Buffer.from(tx.hash, 'base64'),
    };
}