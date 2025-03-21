import { Address, Cell, fromNano, toNano } from "@ton/core";
import { LedgerOrder } from "../../fragments/secure/ops/Order";
import { SignRawMessage } from "../../engine/tonconnect/types";
import { OperationType } from "../../engine/transactions/parseMessageBody";

export function validateLedgerJettonTransfer(msg: SignRawMessage): LedgerOrder | null {
    if (!msg.payload) {
        return null;
    }

    const p = Cell.fromBoc(Buffer.from(msg.payload, 'base64'))[0];

    try {
        const slice = p.beginParse();
        const op = slice.loadUint(32);
        if (op !== OperationType.JettonTransfer) {
            return null;
        }

        const queryId = slice.loadUintBig(64);
        const amount = slice.loadCoins();
        const destination = slice.loadAddress();
        const responseDestination = slice.loadAddress();
        const customPayload = slice.loadBit() ? slice.loadRef() : null;
        const forwardTonAmount = slice.loadCoins();
        let forwardPayload = null;
        if (slice.remainingBits > 0) {
            forwardPayload = slice.loadMaybeRef() ?? slice.asCell();
        }

        const payload: {
            type: 'jetton-transfer';
            queryId: bigint | null;
            amount: bigint;
            destination: Address;
            responseDestination: Address;
            customPayload: Cell | null;
            forwardAmount: bigint;
            forwardPayload: Cell | null;
            knownJetton: {
                jettonId: number;
                workchain: number;
            } | null;
        } = {
            type: 'jetton-transfer',
            queryId,
            amount,
            destination,
            responseDestination,
            customPayload,
            forwardAmount: forwardTonAmount,
            forwardPayload,
            knownJetton: null
        }

        const order: LedgerOrder = {
            type: 'ledger',
            target: msg.address,
            amount: toNano(fromNano(msg.amount)),
            amountAll: false,
            stateInit: msg.stateInit ? Cell.fromBoc(Buffer.from(msg.stateInit, 'base64'))[0] : null,
            payload
        };

        return order;
    } catch {
        return null;
    }
}