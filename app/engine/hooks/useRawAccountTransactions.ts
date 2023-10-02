import { useInfiniteQuery } from '@tanstack/react-query';
import { Queries } from '../queries';
import { AccountStatus, Address, CommonMessageInfo, ExternalAddress, Message, StateInit, Transaction, loadMessageRelaxed } from '@ton/core';
import { getLastBlock } from '../accountWatcher';
import { useNetwork } from './useNetwork';
import { log } from '../../utils/log';
import { TxBody } from '../legacy/Transaction';
import { parseBody } from '../transactions/parseWalletTransaction';
import { resolveOperation } from '../transactions/resolveOperation';
import { TonClient4 } from '@ton/ton';
import { LocalizedResources } from '../../i18n/schema';

type StoredAddressExternal = {
    bits: number;
    data: string;
};

type StoredMessageInfo = {
    type: 'internal';
    value: string;
    dest: string;
    src: string;
    bounced: boolean;
    bounce: boolean;
    ihrDisabled: boolean;
    createdAt: number;
    createdLt: string;
    fwdFee: string;
    ihrFee: string;
} | {
    type: 'external-in';
    dest: string;
    src: StoredAddressExternal | null;
    importFee: string;
} | {
    type: 'external-out';
    dest: StoredAddressExternal | null;
};

type StoredStateInit = {
    splitDepth?: number | null;
    code: string | null;
    data: string | null;
    special?: { tick: boolean, tock: boolean } | null;
};

type StoredMessage = {
    body: string,
    info: StoredMessageInfo,
    init: StoredStateInit | null,
};

export type StoredOperation = {
    address: string;
    comment?: string;
    items: StoredOperationItem[];

    // Address
    op?: { res: LocalizedResources, options?: any };
    // title?: string;
    // image?: string;

};

export type StoredOperationItem = {
    kind: 'ton'
    amount: string;
} | {
    kind: 'token',
    amount: string;
};

export type StoredTransaction = {
    address: string;
    lt: string;
    hash: string
    prevTransaction: {
        lt: string;
        hash: string;
    };
    time: number;
    outMessagesCount: number;
    oldStatus: AccountStatus;
    newStatus: AccountStatus;
    fees: string;
    update: {
        oldHash: string;
        newHash: string;
    };
    inMessage: StoredMessage | null;
    outMessages: StoredMessage[];
    parsed: {
        seqno: number | null;
        body: TxBody | null;
        status: 'success' | 'failed' | 'pending';
        dest: string | null;
        kind: 'out' | 'in';
        amount: string;
        resolvedAddress: string;
        bounced: boolean;
        mentioned: string[];
    },
    operation: StoredOperation;
}


function externalAddressToStored(address?: ExternalAddress | null) {
    if (!address) {
        return null;
    }

    return {
        bits: address.bits,
        data: address.value.toString(16),
    }
}

function messageInfoToStored(msgInfo: CommonMessageInfo, isTestnet: boolean): StoredMessageInfo {
    switch (msgInfo.type) {
        case 'internal':
            return {
                value: msgInfo.value.coins.toString(10),
                type: msgInfo.type,
                dest: msgInfo.dest.toString({ testOnly: isTestnet }),
                src: msgInfo.src.toString({ testOnly: isTestnet }),
                bounced: msgInfo.bounced,
                bounce: msgInfo.bounce,
                ihrDisabled: msgInfo.ihrDisabled,
                createdAt: msgInfo.createdAt,
                createdLt: msgInfo.createdLt.toString(10),
                fwdFee: msgInfo.forwardFee.toString(10),
                ihrFee: msgInfo.ihrFee.toString(10),

            };
        case 'external-in':
            return { dest: msgInfo.dest.toString({ testOnly: isTestnet }), importFee: msgInfo.importFee.toString(10), type: msgInfo.type, src: externalAddressToStored(msgInfo.src) };
        case 'external-out':
            return { dest: externalAddressToStored(msgInfo.dest), type: msgInfo.type };
    }
}

function initToStored(msgInfo?: StateInit | null): StoredStateInit | null {
    if (!msgInfo) {
        return null;
    }
    return {
        code: msgInfo.code?.toBoc({ idx: false }).toString('base64') ?? null,
        data: msgInfo.data?.toBoc({ idx: false }).toString('base64') ?? null,
        special: msgInfo.special,
        splitDepth: msgInfo.splitDepth,
    }
}

function rawMessageToStoredMessage(msg: Message, isTestnet: boolean): StoredMessage {
    return {
        body: msg.body.toBoc({ idx: false }).toString('base64'),
        info: messageInfoToStored(msg.info, isTestnet),
        init: initToStored(msg.init),
    }
}

function rawTransactionToStoredTransaction(tx: Transaction, hash: string, own: Address, isTestnet: boolean): StoredTransaction {
    const inMessageBody = tx.inMessage?.body || null;

    //
    // Resolve seqno
    //

    let seqno: number | null = null;
    let body: TxBody | null = null;
    let status: 'success' | 'failed' = 'success';
    let dest: string | null = null;
    if (tx.inMessage && tx.inMessage.info.type === 'external-in') {
        const parse = inMessageBody!.beginParse();
        parse.skip(512 + 32 + 32); // Signature + wallet_id + timeout
        seqno = parse.loadUint(32);
        const command = parse.loadUint(8);
        if (command === 0) {
            let message = loadMessageRelaxed(parse.loadRef().beginParse());
            if (message.info.dest && Address.isAddress(message.info.dest)) {
                dest = message.info.dest.toString({ testOnly: isTestnet });
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

    //
    // Resolve amount
    //

    let amount = BigInt(0);
    if (tx.inMessage && tx.inMessage.info.type === 'internal') {
        amount = amount + tx.inMessage.info.value.coins;
    }
    for (let out of tx.outMessages.values()) {
        if (out.info.type === 'internal') {
            amount = amount - out.info.value.coins;
        }
    }

    //
    // Resolve address
    //

    let addressResolved: string;
    if (dest) {
        addressResolved = dest;
    } else if (tx.inMessage && tx.inMessage.info.type === 'internal') {
        addressResolved = tx.inMessage.info.src.toString({ testOnly: isTestnet });
    } else {
        addressResolved = own.toString({ testOnly: isTestnet });
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

    const mentioned = new Set<string>();
    if (tx.inMessage && tx.inMessage.info.type === 'internal' && !tx.inMessage.info.src.equals(own)) {
        mentioned.add(tx.inMessage.info.src.toString({ testOnly: isTestnet }));
    }
    for (let out of tx.outMessages.values()) {
        if (out.info.dest && Address.isAddress(out.info.dest) && !out.info.dest.equals(own)) {
            mentioned.add(out.info.dest.toString({ testOnly: isTestnet }));
        }
    }

    return {
        address: own.toString({ testOnly: isTestnet }),
        fees: tx.totalFees.coins.toString(10),
        inMessage: tx.inMessage ? rawMessageToStoredMessage(tx.inMessage, isTestnet) : null,
        outMessages: tx.outMessages.values().map(a => rawMessageToStoredMessage(a, isTestnet)),
        lt: tx.lt.toString(10),
        hash,
        newStatus: tx.endStatus,
        oldStatus: tx.oldStatus,
        outMessagesCount: tx.outMessagesCount,
        prevTransaction: {
            hash: tx.prevTransactionHash.toString(16),
            lt: tx.prevTransactionLt.toString(10)
        },
        time: tx.now,
        update: {
            newHash: tx.stateUpdate.newHash.toString('base64'),
            oldHash: tx.stateUpdate.oldHash.toString('base64'),
        },
        parsed: {
            seqno,
            body,
            status,
            dest,
            amount: amount.toString(10),
            bounced,
            kind: kind,
            mentioned: [...mentioned],
            resolvedAddress: addressResolved,
        },
        operation: resolveOperation({
            account: own,
            amount: amount,
            body: body
        }, isTestnet),
    }
}


export function useRawAccountTransactions(client: TonClient4, account: string) {
    const { isTestnet } = useNetwork();
    let query = useInfiniteQuery<StoredTransaction[]>({
        queryKey: Queries.Account(account).Transactions(),
        getNextPageParam: (last) => {
            if (!last || !last[last.length - 1]) {
                return null;
            }

            return {
                lt: last[last.length - 1].lt,
                hash: last[last.length - 1].hash,
            };
        },
        queryFn: async (ctx) => {
            let accountAddr = Address.parse(account);
            let lt: string;
            let hash: string;
            let sliceFirst: boolean = false;
            if (ctx.pageParam?.lt && ctx.pageParam?.hash) {
                lt = ctx.pageParam.lt;
                hash = ctx.pageParam.hash;
                sliceFirst = true;
            } else {
                let accountLite = await client.getAccountLite(await getLastBlock(), accountAddr);
                if (!accountLite.account.last) {
                    return [];
                }

                lt = accountLite.account.last.lt;
                hash = accountLite.account.last.hash;
            }

            log(`[txns-query] fetching ${lt}_${hash}`);
            let txs = await client.getAccountTransactions(accountAddr, BigInt(lt), Buffer.from(hash, 'base64'));
            if (sliceFirst) {
                txs = txs.slice(1);
            }

            let converted = txs.map(r => rawTransactionToStoredTransaction(r.tx, r.tx.hash().toString('base64'), accountAddr, isTestnet));
            log(`[txns-query] fetched ${lt}_${hash}`);
            return converted;
        },
        staleTime: Infinity,
    });

    if (!query.data) {
        return null;
    }

    return query;
}