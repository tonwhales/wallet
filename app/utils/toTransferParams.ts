import { Address, toNano } from "@ton/core";
import { PendingTransaction } from "../engine/state/pending";
import { SimpleTransferParams } from "../fragments/secure/SimpleTransferFragment";
import { TransferFragmentProps } from "../fragments/secure/TransferFragment";
import { fromBnWithDecimals } from "./withDecimals";
import { TransactionDescription } from "../engine/types";

export type RepeatTxParams = (SimpleTransferParams & { type: 'simple' }) | (TransferFragmentProps & { type: 'transfer' });

export function pendingTxToTransferParams(tx: PendingTransaction, testOnly: boolean): RepeatTxParams | null {
    if (!tx.address) {
        return null;
    }

    // Skip batch transactions
    if (tx.body?.type === 'batch') {
        return null;
    }

    if (tx.body?.type === 'token') {
        const amount = fromBnWithDecimals(tx.body.amount, tx.body.jetton.decimals ?? 9);

        return {
            type: 'simple',
            target: tx.body.target.toString({ testOnly: true, bounceable: tx.body.bounceable }),
            comment: tx.body.comment,
            amount: toNano(amount),
            stateInit: null,
            job: null,
            jetton: tx.body.jetton.wallet,
            callback: null
        };
    }

    if (tx.body?.type === 'payload') {
        return {
            type: 'transfer',
            text: null,
            job: null,
            order: {
                type: 'order',
                messages: [{
                    target: tx.address?.toString({ testOnly, bounceable: tx.bounceable }) || '',
                    amount: -tx.amount,
                    amountAll: false,
                    stateInit: tx.body.stateInit || null,
                    payload: tx.body.cell
                }]
            }
        };
    }

    if (tx.body?.type === 'comment') {
        return {
            type: 'simple',
            target: tx.address?.toString({ testOnly, bounceable: tx.bounceable }) || '',
            comment: tx.body.comment,
            amount: -tx.amount,
            stateInit: null,
            job: null,
            jetton: null,
            callback: null
        };
    }

    return {
        type: 'simple',
        target: tx.address.toString({ testOnly, bounceable: tx.bounceable }),
        comment: null,
        amount: -tx.amount,
        stateInit: null,
        job: null,
        jetton: null,
        callback: null
    };
}

export function previewToTransferParams(
    tx: TransactionDescription,
    isTestnet: boolean,
    bounceableFormat: boolean,
    isLedger: boolean
): RepeatTxParams | null {

    if (isLedger) {
        return null
    }

    if (tx.base.parsed.kind === 'in') {
        return null
    }

    if (tx.base.parsed.body?.type === 'payload') {
        const operation = tx.base.operation;
        const item = operation.items[0];
        if (item.kind === 'token') {
            const operation = tx.base.operation;
            const opAddressString = operation.address;
            const opAddr = Address.parseFriendly(opAddressString);
            const bounceable = bounceableFormat ? true : opAddr.isBounceable;
            const target = opAddr.address.toString({ testOnly: isTestnet, bounceable });
            const comment = operation.comment;
            const master = tx.masterMetadata;
            const decimals = master?.decimals ?? 9;
            const amount = fromBnWithDecimals(item.amount, decimals);
            const jetton = Address.parse(tx.base.parsed.resolvedAddress);

            return {
                type: 'simple',
                target,
                comment,
                amount: toNano(amount),
                jetton,
                stateInit: null,
                job: null,
                callback: null
            }
        }

    } else {
        const operation = tx.base.operation;
        const item = operation.items[0];
        const opAddressString = item.kind === 'token' ? operation.address : tx.base.parsed.resolvedAddress;
        const opAddr = Address.parseFriendly(opAddressString);
        const bounceable = bounceableFormat ? true : opAddr.isBounceable;
        const target = opAddr.address.toString({ testOnly: isTestnet, bounceable });

        return {
            type: 'simple',
            target,
            comment: tx.base.parsed.body && tx.base.parsed.body.type === 'comment' ? tx.base.parsed.body.comment : null,
            amount: BigInt(tx.base.parsed.amount) > 0n ? BigInt(tx.base.parsed.amount) : -BigInt(tx.base.parsed.amount),
            job: null,
            stateInit: null,
            jetton: null,
            callback: null
        }
    }

    return null;
}