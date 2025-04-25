import { useRecoilState } from "recoil";
import { PendingSolanaTransaction, pendingSolanaTransactionsState } from "../../state/pending";

export function usePendingSolanaTransactions(address: string, isTestnet: boolean): [
    PendingSolanaTransaction[],
    (valOrUpdater: ((currVal: PendingSolanaTransaction[]) => PendingSolanaTransaction[]) | PendingSolanaTransaction[]) => void
] {
    return useRecoilState(pendingSolanaTransactionsState(`${address} ${isTestnet ? 'testnet' : 'mainnet'}`));
}