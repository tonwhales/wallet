import { useInfiniteQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { Address, CommonMessageInfo, ExternalAddress, Message, StateInit, Transaction, loadMessageRelaxed } from '@ton/core';
import { getLastBlock } from '../../accountWatcher';
import { useNetwork } from '../network/useNetwork';
import { parseBody } from '../../transactions/parseWalletTransaction';
import { resolveOperation } from '../../transactions/resolveOperation';
import { TonClient4 } from '@ton/ton';
import { StoredMessage, StoredMessageInfo, StoredStateInit, StoredTransaction, StoredTxBody, TxBody } from '../../types';
import { fetchAccountTransactions } from '../../api/fetchAccountTransactions';

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
        try {
            const parse = inMessageBody!.beginParse();
            parse.skip(512 + 32 + 32); // Signature + wallet_id + timeout
            seqno = parse.loadUint(32);
            const command = parse.loadUint(8);
            if (command === 0 && parse.remainingRefs > 0) {
                let message = loadMessageRelaxed(parse.loadRef().beginParse());
                if (message.info.dest && Address.isAddress(message.info.dest)) {
                    dest = message.info.dest.toString({ testOnly: isTestnet });
                }
                body = parseBody(message.body);

                if (tx.outMessagesCount === 0) {
                    status = 'failed';
                }
            }
        } catch (e) {
            console.error('failed to parse external-in message', e, inMessageBody?.toBoc().toString('base64'));
        }
    }

    if (tx.inMessage && tx.inMessage.info.type === 'internal') {
        body = parseBody(inMessageBody!);
    }

    let storedBody: StoredTxBody | null = null;
    if (body) {
        storedBody = body?.type === 'comment' ? { type: 'comment', comment: body.comment } : { type: 'payload' };
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
            body: storedBody,
            status,
            dest,
            amount: amount.toString(10),
            bounced,
            kind: kind,
            mentioned: [...mentioned],
            resolvedAddress: addressResolved,
        },
        operation: resolveOperation({
            account: Address.parse(addressResolved),
            amount: amount,
            body: body
        }, isTestnet),
    }
}


const TRANSACTIONS_LENGTH = 16;

export function useRawAccountTransactions(client: TonClient4, account: string, refetchOnMount: boolean = false) {
    const { isTestnet } = useNetwork();

    let query = useInfiniteQuery<StoredTransaction[]>({
        queryKey: Queries.Transactions(account),
        refetchOnMount: refetchOnMount,
        getNextPageParam: (last) => {
            if (!last || !last[TRANSACTIONS_LENGTH - 2]) {
                return undefined;
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

            return await fetchAccountTransactions(accountAddr, isTestnet, { lt, hash });
        },
        structuralSharing: (old, next) => {
            let firstOld = old?.pages[0];
            let firstNext = next?.pages[0];

            // If something absent
            if (!firstOld || !firstNext) {
                return next;
            }

            if (firstOld.length < 1 || firstNext.length < 1) {
                return next;
            }

            // If first elements are equal
            if (firstOld[0]?.lt === firstNext[0]?.lt && firstOld[0]?.hash === firstNext[0]?.hash) {
                return next;
            }

            // Something changed, rebuild the list
            let offset = firstNext.findIndex(a => a.lt === firstOld![0].lt && a.hash === firstOld![0].hash);

            // If not found, we need to invalidate the whole list
            if (offset === -1) {
                return {
                    pageParams: [next.pageParams[0]],
                    pages: [next.pages[0]],
                };
            }

            // If found, we need to shift pages and pageParams
            let pages: StoredTransaction[][] = [next.pages[0]];
            let pageParams: ({ lt: string, hash: string } | undefined)[] = [next.pageParams[0] as any];
            let tail = old!.pages[0].slice(TRANSACTIONS_LENGTH - offset);
            let nextPageParams = { hash: next.pages[0][next.pages[0].length - 1].hash, lt: next.pages[0][next.pages[0].length - 1].lt };

            for (let page of old!.pages.slice(1)) {
                let newPage = tail.concat(page.slice(0, TRANSACTIONS_LENGTH - 1 - offset));
                pageParams.push(nextPageParams);
                pages.push(newPage);

                tail = page.slice(TRANSACTIONS_LENGTH - 1 - offset);
                nextPageParams = { hash: newPage[newPage.length - 1].hash, lt: newPage[newPage.length - 1].lt };
            }

            return { pages, pageParams };
        },
    });

    return query;
}