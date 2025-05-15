// liquidUSDeStaking

import { Address, beginCell, Cell, toNano } from "@ton/core";
import { OperationType } from "../../engine/transactions/parseMessageBody";

function buildTransferMessage(
    opCode: OperationType,
    toAddress: Address,
    senderWallet: Address,
    jettonAmount: bigint,
    fwdAmount: bigint,
    queryId: number
): Cell {
    return beginCell()
        .storeUint(opCode, 32) // Jetton transfer op code (fixed opcode)
        .storeUint(queryId, 64) // query_id
        .storeCoins(jettonAmount) // Jetton amount
        .storeAddress(toAddress) // Recipient address
        .storeAddress(senderWallet) // Sender's wallet address
        .storeUint(0, 1) // Empty custom payload
        .storeCoins(fwdAmount) // Forward TON amount
        .storeUint(0, 1) // Empty forward payload
        .endCell()
}

// Deposit
export function createDespositLiquidUSDeStakingPayload(
    {
        vaultAddress,
        owner,
        amount,
        fwdAmount = toNano('0.1'),
        queryId = 69,
        isTestnet,
    }: {
        vaultAddress: Address,
        owner: Address,
        amount: bigint,
        fwdAmount?: bigint,
        queryId?: number,
        isTestnet: boolean
    }
) {
    return buildTransferMessage(
        OperationType.JettonTransfer,
        vaultAddress,
        owner,
        amount,
        fwdAmount,
        queryId
    );
}

// Unstake
export function createUnstakeLiquidUSDeStakingPayload(
    {
        minterAddress,
        owner,
        amount,
        fwdAmount = toNano('0.1'),
        queryId = 69,
        isTestnet,
    }: {
        minterAddress: Address,
        owner: Address,
        amount: bigint,
        fwdAmount?: bigint,
        queryId?: number,
        isTestnet: boolean
    }
) {
    return buildTransferMessage(
        OperationType.JettonTransfer,
        minterAddress,
        owner,
        amount,
        fwdAmount,
        queryId
    );
}

// Withdraw
export function createWithdrawLiquidUSDeStakingPayload(
    {
        minterAddress,
        owner,
        amount,
        fwdAmount = toNano('0.1'),
        queryId = 69,
        isTestnet,
    }: {
        minterAddress: Address,
        owner: Address,
        amount: bigint,
        fwdAmount?: bigint,
        queryId?: number,
        isTestnet: boolean
    }
) {
    return buildTransferMessage(
        OperationType.LiquidUSDeStakingWithdraw,
        minterAddress,
        owner,
        amount,
        fwdAmount,
        queryId
    );
}