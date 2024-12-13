import { GeneralHoldersAccount } from "../../engine/api/holders/fetchAccounts";

export const CONTRACTS_DEPOSIT_BY_DETAILS = [
    'ton.card.v7',
    'ton.card.v8',
    'ton.jetton.v3'
];

export function hasDirectDeposit(account: GeneralHoldersAccount) {
    const contract = account.contract;
    return CONTRACTS_DEPOSIT_BY_DETAILS.includes(contract);
}