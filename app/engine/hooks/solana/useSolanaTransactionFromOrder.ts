import { useState, useEffect } from "react";
import { Transaction } from "@solana/web3.js";
import { SolanaOrder } from "../../../fragments/secure/ops/Order";
import { buildSolanaTransaction } from "../../../fragments/secure/utils/buildSolanaTransaction";
import { SolanaClient } from "./useSolanaClient";

/**
 * Build Solana transaction from order for preview and fee calculation
 * @param order - Solana order
 * @param sender - Sender address
 * @param solanaClients - Solana clients
 * @returns Transaction or null if building failed
 */
export function useSolanaTransactionFromOrder(
    order: SolanaOrder,
    sender: string,
    solanaClients: { client: SolanaClient; publicClient: SolanaClient }
) {
    const [transaction, setTransaction] = useState<Transaction>();

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const result = await buildSolanaTransaction({
                    order,
                    sender,
                    solanaClients
                    // No keyPair - only compute addresses, don't create ATAs
                });

                if (!cancelled) {
                    setTransaction(result.transaction);
                }
            } catch (error) {
                console.warn('Failed to build transaction for preview:', error);
                if (!cancelled) {
                    setTransaction(undefined);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [order, sender]);

    return transaction;
}

