import { GeneralHoldersAccount } from "../../engine/api/holders/fetchAccounts";

export const CONTRACTS_DEPOSIT_BY_DETAILS = [
    'ton.card.v7',
    'ton.card.v8',
    'ton.jetton.v3'
];

export const CONTRACTS_DEPOSIT_BY_DETAILS_SOLANA = [
    'solana.card.v2'
];

export function hasDirectTonDeposit(account: GeneralHoldersAccount) {
    if (account.network !== 'ton-mainnet' && account.network !== 'ton-testnet') {
        return false;
    }
    const contract = account.contract;
    return CONTRACTS_DEPOSIT_BY_DETAILS.includes(contract);
}

export function hasDirectSolanaDeposit(account: GeneralHoldersAccount) {
    if (account.network !== 'solana') {
        return false;
    }
    const contract = account.contract;
    return CONTRACTS_DEPOSIT_BY_DETAILS_SOLANA.includes(contract);
}
