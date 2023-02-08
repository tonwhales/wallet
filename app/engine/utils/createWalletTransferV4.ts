import { beginCell, Cell, InternalMessage } from "ton";
import { sign } from "ton-crypto";
import { Maybe } from "ton/dist/types";

export function createWalletTransferV4(args: {
    seqno: number,
    sendMode: number,
    walletId: number,
    messages: InternalMessage[],
    secretKey: Buffer,
    timeout?: Maybe<number>
}) {

    // Check number of messages
    if (args.messages.length > 4) {
        throw new Error("Maximum number of messages in a single transfer is 4");
    }

    let signingMessage = beginCell()
        .storeUint(args.walletId, 32);
    if (args.seqno === 0) {
        for (let i = 0; i < 32; i++) {
            signingMessage.storeBit(1);
        }
    } else {
        signingMessage.storeUint(args.timeout || Math.floor(Date.now() / 1e3) + 60, 32); // Default timeout: 60 seconds
    }
    signingMessage.storeUint(args.seqno, 32);
    signingMessage.storeUint(0, 8); // Simple order
    for (let m of args.messages) {
        signingMessage.storeUint(args.sendMode, 8);
        const msg = new Cell();
        m.writeTo(msg);
        signingMessage.storeRef(msg);
    }

    // Sign message
    let signature: Buffer = sign(signingMessage.endCell().hash(), args.secretKey);

    // Body
    const body = beginCell()
        .storeBuffer(signature)
        .storeCellCopy(signingMessage.endCell())
        .endCell();

    return body;
}