import { useInfiniteQuery } from '@tanstack/react-query';
import { Queries } from '../queries';
import { Address, AddressExternal, RawAccountStatus, RawCommonMessageInfo, RawCurrencyCollection, RawHashUpdate, RawMessage, RawStateInit, RawTickTock, RawTransaction, RawTransactionDescription, TonClient4, parseTransaction } from 'ton';
import BN from 'bn.js';
import { getLastBlock } from '../accountWatcher';
import { useNetwork } from './useNetwork';
import { log } from '../../utils/log';

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
    splitDepth: number | null;
    code: string | null;
    data: string | null;
    special: { tick: boolean, tock: boolean } | null;
};

type StoredMessage = {
    body: string,
    info: StoredMessageInfo, 
    init: StoredStateInit | null,
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
    oldStatus: RawAccountStatus;
    newStatus: RawAccountStatus;
    fees: string;
    update: {
        oldHash: string;
        newHash: string;
    };
    inMessage: StoredMessage | null;
    outMessages: StoredMessage[];
}


function externalAddressToStored(address: AddressExternal | null) {
    if (!address) {
        return null;
    }

    return {
        bits: address.bits.length,
        data: address.bits.getTopUppedArray().toString('base64'),
    }
}

function messageInfoToStored(msgInfo: RawCommonMessageInfo, isTestnet: boolean): StoredMessageInfo {
    switch (msgInfo.type) {
        case 'internal':
            return { 
                value: msgInfo.value.coins.toString(10),
                type: msgInfo.type, 
                dest: msgInfo.dest.toFriendly({ testOnly: isTestnet }),
                src: msgInfo.src.toFriendly({ testOnly: isTestnet }),
                bounced: msgInfo.bounced,
                bounce: msgInfo.bounce,
                ihrDisabled: msgInfo.ihrDisabled,
                createdAt: msgInfo.createdAt,
                createdLt: msgInfo.createdLt.toString(10),
                fwdFee: msgInfo.fwdFee.toString(10),
                ihrFee: msgInfo.ihrFee.toString(10),

            };
        case 'external-in':
            return { dest: msgInfo.dest.toFriendly({ testOnly: isTestnet }), importFee: msgInfo.importFee.toString(10), type: msgInfo.type, src: externalAddressToStored(msgInfo.src) };
        case 'external-out':
            return { dest: externalAddressToStored(msgInfo.dest), type: msgInfo.type };
    }
}

function initToStored(msgInfo: RawStateInit | null): StoredStateInit | null {
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

function rawMessageToStoredMessage(msg: RawMessage, isTestnet: boolean): StoredMessage {
    return {
        body: msg.body.toBoc({ idx: false }).toString('base64'),
        info: messageInfoToStored(msg.info, isTestnet),
        init: initToStored(msg.init),
    }
}

function rawTransactionToStoredTransaction(tx: RawTransaction, hash: string, isTestnet: boolean): StoredTransaction {
    return {
        address: tx.address.toFriendly({ testOnly: isTestnet }),
        fees: tx.fees.coins.toString(10),
        inMessage: tx.inMessage ? rawMessageToStoredMessage(tx.inMessage, isTestnet) : null,
        outMessages: tx.outMessages.map(a => rawMessageToStoredMessage(a, isTestnet)),
        lt: tx.lt.toString(10),
        hash,
        newStatus: tx.newStatus,
        oldStatus: tx.oldStatus,
        outMessagesCount: tx.outMessagesCount,
        prevTransaction: {
            hash: tx.prevTransaction.hash.toString('base64'),
            lt: tx.prevTransaction.lt.toString(10)
        },
        time: tx.time,
        update: {
            newHash: tx.update.newHash.toString('base64'),
            oldHash: tx.update.oldHash.toString('base64'),
        }
    }
}


export function useRawAccountTransactions(client: TonClient4, account: string) {
    const { isTestnet } = useNetwork();
    let query = useInfiniteQuery<StoredTransaction[]>({
        queryKey: Queries.Account(account).Transactions(),
        getNextPageParam: (last) => {
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

            let txs = await client.getAccountTransactions(accountAddr, new BN(lt), Buffer.from(hash, 'base64'));
            let raw = txs.map(a => ({
                ...parseTransaction(a.block.workchain, a.tx.beginParse()),
                hash: a.tx.hash().toString('base64'),
            }));
            if (sliceFirst) {
                raw = raw.slice(1);
            }
            return raw.map(r => rawTransactionToStoredTransaction(r, r.hash, isTestnet));
        },
        staleTime: Infinity,
    });

    if (!query.data) {
        return null;
    }

    return query;
}