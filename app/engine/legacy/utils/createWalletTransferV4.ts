import BN from "bn.js";
import { Address, beginCell, Cell, CellMessage, CommentMessage, CommonMessageInfo, fromNano, InternalMessage, toNano } from "@ton/core";
import { sign } from "ton-crypto";
import { Maybe } from "ton/dist/types";

export function internalFromSignRawMessage(message: {
    target: string;
    amount: bigint;
    amountAll: boolean;
    payload: Cell | null;
    stateInit: Cell | null;
}, bounce?: boolean): InternalMessage | null {
    let to: Address;
    try {
        to = Address.parse(message.target);
    } catch (e) {
        return null;
    }

    return new InternalMessage({
        to,
        value: message.amount,
        bounce: bounce ?? true,
        body: new CommonMessageInfo({
            stateInit: message.stateInit
                ? new CellMessage(message.stateInit)
                : null,
            body: message.payload
                ? new CellMessage(message.payload)
                : new CommentMessage('')
        })
    })
}

export function createWalletTransferV4(args: {
    seqno: number,
    sendMode: number,
    walletId: number,
    messages: InternalMessage[],
    secretKey: Buffer | null,
    timeout?: Maybe<number>
}) {

    // Check number of messages
    if (args.messages.length > 4) {
        throw new Error("Maximum number of messages in a single transfer is 4");
    }

    let signingMessageBuilder = beginCell()
        .storeUint(args.walletId, 32);
    if (args.seqno === 0) {
        for (let i = 0; i < 32; i++) {
            signingMessageBuilder.storeBit(1);
        }
    } else {
        signingMessageBuilder.storeUint(args.timeout || Math.floor(Date.now() / 1e3) + 60, 32); // Default timeout: 60 seconds
    }
    signingMessageBuilder.storeUint(args.seqno, 32);
    signingMessageBuilder.storeUint(0, 8); // Simple order
    for (let m of args.messages) {
        signingMessageBuilder.storeUint(args.sendMode, 8);
        const msg = new Cell();
        m.writeTo(msg);
        signingMessageBuilder.storeRef(msg);
    }

    const signingMessage = signingMessageBuilder.endCell();

    // Sign message
    let signature: Buffer
    if (args.secretKey) {
        signature = sign(signingMessage.hash(), args.secretKey);
    } else {
        signature = Buffer.alloc(64);
    }

    // Body
    const body = beginCell()
        .storeBuffer(signature)
        .storeCellCopy(signingMessage)
        .endCell();

    return body;
}