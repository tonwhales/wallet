import * as t from 'io-ts';
import { failure, success } from "io-ts"
import { RawTransaction } from '@ton/core';
import * as c from '../utils/codecs';

export const rawAccountStatusCodec = t.union([
    t.literal('uninitialized'),
    t.literal('frozen'),
    t.literal('active'),
    t.literal('non-existing')
]);

export const rawAccountStatusChangeCodec = t.union([
    t.literal('unchanged'),
    t.literal('frozen'),
    t.literal('deleted'),
]);

export const rawCurreencyCollectionCodec = t.type({
    extraCurrencies: t.union([t.null, t.record(t.number, t.number)]),
    coins: c.bignum
});

export const rawHashUpdateCodec = t.type({
    oldHash: c.buffer,
    newHash: c.buffer
});

export const rawStoragePhaseCodec = t.type({
    storageFeesCollected: c.bignum,
    storageFeesDue: t.union([c.bignum, t.null]),
    statusChange: rawAccountStatusChangeCodec
});

export const rawCreditPhaseCodec = t.type({
    dueFeesColelcted: t.union([c.bignum, t.null]),
    credit: rawCurreencyCollectionCodec
});

export const skippedComputePhaseCodec = t.type({
    type: t.literal('skipped'),
    reason: t.union([t.literal('no-state'), t.literal('bad-state'), t.literal('no-gas')]),
});

export const computedComputePhaseCodec = t.type({
    type: t.literal('computed'),
    success: t.boolean,
    messageStateUsed: t.boolean,
    accountActivated: t.boolean,
    gasFees: c.bignum,
    gasUsed: c.bignum,
    gasLimit: c.bignum,
    gasCredit: t.union([c.bignum, t.null]),
    mode: t.number,
    exitCode: t.number,
    exitArg: t.union([t.number, t.null]),
    vmSteps: t.number,
    vmInitStateHash: c.buffer,
    vmFinalStateHash: c.buffer
});

export const rawComputePhaseCodec = t.union([skippedComputePhaseCodec, computedComputePhaseCodec]);

export const rawStorageUsedShortCodec = t.type({
    cells: t.number,
    bits: t.number
});

export const rawActionPhaseCodec = t.type({
    success: t.boolean,
    valid: t.boolean,
    noFunds: t.boolean,
    statusChange: rawAccountStatusChangeCodec,
    totalFwdFees: t.union([c.bignum, t.null]),
    totalActionFees: t.union([c.bignum, t.null]),
    resultCode: t.number,
    resultArg: t.union([t.number, t.null]),
    totalActions: t.number,
    specialActions: t.number,
    skippedActions: t.number,
    messagesCreated: t.number,
    actionListHash: c.buffer,
    totalMessageSizes: rawStorageUsedShortCodec
});

export const okBouncePhaseCodec = t.type({
    type: t.literal('ok'),
    msgSize: rawStorageUsedShortCodec,
    msgFees: c.bignum,
    fwdFees: c.bignum
});

export const noFundsBouncePhaseCodec = t.type({
    type: t.literal('no-funds'),
    msgSize: rawStorageUsedShortCodec,
    fwdFees: c.bignum
});

export const negativeFundsBouncePhaseCodec = t.type({
    type: t.literal('negative-funds'),
});

export const rawBouncePhaseCodec = t.union([
    okBouncePhaseCodec,
    noFundsBouncePhaseCodec,
    negativeFundsBouncePhaseCodec
]);

export const genericTransactionDescriptionCodeс = t.type({
    type: t.literal('generic'),
    creditFirst: t.boolean,
    storagePhase: t.union([rawStoragePhaseCodec, t.null]),
    creditPhase: t.union([rawCreditPhaseCodec, t.null]),
    computePhase: rawComputePhaseCodec,
    actionPhase: t.union([rawActionPhaseCodec, t.null]),
    bouncePhase: t.union([rawBouncePhaseCodec, t.null]),
    aborted: t.boolean,
    destroyed: t.boolean,
});

export const storageTransactionDescriptionCodec = t.type({
    type: t.literal('storage'),
    storagePhase: rawStoragePhaseCodec
});

export const tickTockTransactionDescriptionCodec = t.type({
    type: t.literal('tick-tock'),
    isTock: t.boolean,
    storagePhase: rawStoragePhaseCodec,
    computePhase: rawComputePhaseCodec,
    actionPhase: t.union([rawActionPhaseCodec, t.null]),
    aborted: t.boolean,
    destroyed: t.boolean,
});

export const rawTransactionDescriptionCodec = t.union([
    genericTransactionDescriptionCodeс,
    storageTransactionDescriptionCodec,
    tickTockTransactionDescriptionCodec
]);

export const internalCommonMessageInfoCodec = (isTestnet: boolean) => t.type({
    type: t.literal('internal'),
    ihrDisabled: t.boolean,
    bounce: t.boolean,
    bounced: t.boolean,
    src: c.address(isTestnet),
    dest: c.address(isTestnet),
    value: rawCurreencyCollectionCodec,
    ihrFee: c.bignum,
    fwdFee: c.bignum,
    createdLt: c.bignum,
    createdAt: t.number
});

export const externalOutCommonMessageInfoCodec = (isTestnet: boolean) => t.type({
    type: t.literal('external-out'),
    src: c.address(isTestnet),
    dest: t.union([c.addressExternal, t.null]),
    createdLt: c.bignum,
    createdAt: t.number
});

export const externalInCommonMessageInfoCodec = (isTestnet: boolean) => t.type({
    type: t.literal('external-in'),
    src: t.union([c.addressExternal, t.null]),
    dest: c.address(isTestnet),
    importFee: c.bignum
});

export const rawCommonMessageInfoCodec = (isTestnet: boolean) => t.union([
    internalCommonMessageInfoCodec(isTestnet),
    externalOutCommonMessageInfoCodec(isTestnet),
    externalInCommonMessageInfoCodec(isTestnet)
]);

export const rawTickTockCodec = t.type({
    tick: t.boolean,
    tock: t.boolean
});

export const rawStateInitCodec = t.type({
    splitDepth: t.union([t.number, t.null]),
    code: t.union([c.cell, t.null]),
    data: t.union([c.cell, t.null]),
    special: t.union([rawTickTockCodec, t.null]),
    raw: c.cell
});

export const rawMessageCodec = (isTestnet: boolean) => t.type({
    raw: c.cell,
    info: rawCommonMessageInfoCodec(isTestnet),
    init: t.union([rawStateInitCodec, t.null]),
    body: c.cell
});

export const rawTransactionCodec = (isTestnet: boolean) => t.type({
    address: c.address(isTestnet),
    lt: c.bignum,
    prevTransaction: t.type({
        lt: c.bignum,
        hash: c.buffer,
    }),
    time: t.number,
    outMessagesCount: t.number,
    oldStatus: rawAccountStatusCodec,
    newStatus: rawAccountStatusCodec,
    fees: rawCurreencyCollectionCodec,
    update: rawHashUpdateCodec,
    description: rawTransactionDescriptionCodec,
    inMessage: rawMessageCodec(isTestnet),
    outMessages: t.array(rawMessageCodec(isTestnet))
});

export const bodyCodec = t.union([
    t.type({
        type: t.literal('comment'),
        comment: t.string
    }),
    t.type({
        type: t.literal('payload'),
        cell: c.cell
    })
]);

export const walletTransactionCodec = (isTestnet: boolean) => t.type({
    id: t.string,
    lt: t.union([t.string, t.null]),
    fees: c.bignum,
    amount: c.bignum,
    address: t.union([c.address(isTestnet), t.null]),
    seqno: t.union([t.number, t.null]),
    kind: t.union([t.literal('out'), t.literal('in')]),
    body: t.union([bodyCodec, t.null]),
    status: t.union([t.literal('success'), t.literal('failed'), t.literal('pending')]),
    time: t.number,
    bounced: t.boolean,
    prev: t.union([t.type({
        lt: t.string,
        hash: t.string
    }), t.null]),
    mentioned: t.array(t.string),
    hash: c.buffer
});

class RawTransactionType extends t.Type<RawTransaction, string, unknown> {
    readonly _tag: 'RawTransactionType' = 'RawTransactionType';

    constructor(isTestnet: boolean) {
        super(
            'RawTransaction',
            (u): u is RawTransaction => rawTransactionCodec(isTestnet).is(u),
            (u, c) => {
                if (!t.string.validate(u, c)) {
                    return failure(u, c);
                }
                try {
                    const s = u as string;
                    const tx = rawTransactionCodec(isTestnet).decode(s) as any as RawTransaction;
                    return success(tx);
                } catch (error) {
                    return t.failure(u, c);
                }
            },
            (u) => {
                return JSON.stringify(rawTransactionCodec(isTestnet).encode(u as any));
            }
        );
    }
}

export const rawTransaction = (isTestnet: boolean) => new RawTransactionType(isTestnet);

