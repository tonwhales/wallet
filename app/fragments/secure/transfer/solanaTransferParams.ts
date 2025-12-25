import { Message, Transaction, VersionedTransaction } from "@solana/web3.js";
import { parseTransactionInstructions } from "../../../utils/solana/parseInstructions";
import { SolanaOrder, SolanaOrderApp } from "../ops/Order";

type SolanaOrderTransferParams = {
    type: 'order';
    order: SolanaOrder
}

type SolanaMessageTransferParams = {
    type: 'message';
    message: string;
}

type SolanaTransactionTransferParams = {
    type: 'transaction';
    transaction: string;
    app?: SolanaOrderApp;
}

type SolanaVersionedTransactionParams = {
    type: 'versioned-transaction';
    transaction: string;
    app?: SolanaOrderApp;
}

export type SolanaTransferParams = (
    SolanaOrderTransferParams
    | SolanaMessageTransferParams
    | SolanaTransactionTransferParams
    | SolanaVersionedTransactionParams
) & {
    callback?: (ok: boolean, signature: string | null) => void
};

export type TransferLoadedParams = {
    type: 'order';
    order: SolanaOrder
} | {
    type: 'instructions';
    instructions: ReturnType<typeof parseTransactionInstructions>;
    transaction: Transaction;
    app?: SolanaOrderApp;
} | {
    type: 'versioned-instructions';
    instructions: ReturnType<typeof parseTransactionInstructions>;
    transaction: VersionedTransaction;
    app?: SolanaOrderApp;
}

export function parseVersionedTransactionFromBuffer(buffer: Buffer): {
    transaction: VersionedTransaction,
    instructions: ReturnType<typeof parseTransactionInstructions>
} | null {
    const uint8Array = new Uint8Array(buffer);

    try {
        const transaction = VersionedTransaction.deserialize(uint8Array);
        const message = transaction.message;
        const instructions = message.compiledInstructions.map((ix) => {
            const programId = message.staticAccountKeys[ix.programIdIndex];
            const keys = ix.accountKeyIndexes.map((idx) => ({
                pubkey: message.staticAccountKeys[idx],
                isSigner: message.isAccountSigner(idx),
                isWritable: message.isAccountWritable(idx)
            }));
            return {
                programId,
                keys,
                data: Buffer.from(ix.data)
            };
        });
        return {
            transaction,
            instructions: parseTransactionInstructions(instructions)
        };
    } catch (e) {
        console.error('parseVersionedTransactionFromBuffer error', e);
        return null;
    }
}

export function paramsToTransfer(order: SolanaTransferParams): TransferLoadedParams | null {
    switch (order.type) {
        case 'order':
            return order;
        case 'message':
            try {
                const message = Message.from(Buffer.from(order.message, 'base64'));
                const transaction = Transaction.populate(message);
                return {
                    type: 'instructions',
                    instructions: parseTransactionInstructions(transaction.instructions),
                    transaction
                };
            } catch {
                return null;
            }
        case 'transaction':
            try {
                const transaction = Transaction.from(Buffer.from(order.transaction, 'base64'));
                return {
                    type: 'instructions',
                    instructions: parseTransactionInstructions(transaction.instructions),
                    transaction,
                    app: order.app
                };
            } catch {
                return null;
            }
        case 'versioned-transaction': {
            const buffer = Buffer.from(order.transaction, 'base64');
            const parsed = parseVersionedTransactionFromBuffer(buffer);
            if (!parsed) {
                return null;
            }
            return {
                type: 'versioned-instructions',
                instructions: parsed.instructions,
                transaction: parsed.transaction,
                app: order.app
            };
        }
        default:
            return null;
    }
}

