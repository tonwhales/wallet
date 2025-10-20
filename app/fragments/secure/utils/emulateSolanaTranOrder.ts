import { SendSolanaOrderParams } from "./signAndSendSolanaOrder";
import { SendTransactionError } from "@solana/web3.js";
import { fromNano } from "@ton/core";
import { mapSolanaError, SendSolanaTransactionError } from "./mapSolanaError";
import { buildSolanaTransaction } from "./buildSolanaTransaction";

export async function emulateSolanaTranOrder({ order, solanaClients, sender }: Omit<SendSolanaOrderParams, 'theme' | 'authContext'>) {
    const { client } = solanaClients;

    const { transaction } = await buildSolanaTransaction({
        order,
        sender,
        solanaClients
        // No keyPair - only compute addresses for simulation
    });

    const simulation = await client.simulateTransaction(transaction);
    if (simulation.value.err) {
        const logs = simulation.value.logs || [];
        let error = new SendTransactionError({
            action: 'simulate',
            signature: '',
            transactionMessage: JSON.stringify(simulation.value.err),
            logs
        });

        try {
            if (JSON.stringify(simulation.value.err).includes('InsufficientFundsForRent')) {
                const minRent = await client.getMinimumBalanceForRentExemption(128);
                const rent = BigInt(minRent);

                error = new SendTransactionError({
                    action: 'simulate',
                    signature: '',
                    transactionMessage: `InsufficientFundsForRent:${fromNano(rent)}`,
                    logs
                });
            }
        } catch { }

        const res = mapSolanaError(error);
        if (res instanceof SendSolanaTransactionError && (res.lamportsNeeded || res.rentNeeded)) {
            return res;
        }
    }

    return null;
}