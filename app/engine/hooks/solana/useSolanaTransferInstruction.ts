import { useMemo } from "react";
import {
    HoldersCloseCardInstruction,
    HoldersDepositInstruction,
    HoldersLimitsInstruction,
    HoldersExecuteWithdrawalInstruction,
    HoldersCancelWithdrawalInstruction,
    HoldersAllocateWithdrawalsInstruction,
    HoldersDeleteCardInstruction,
    HoldersUpdateCardStateV2Instruction,
    ParsedTransactionInstruction
} from "../../../utils/solana/parseInstructions";
import { useSolanaToken } from "./useSolanaToken";
import { fromBnWithDecimals } from "../../../utils/withDecimals";
import { SOLANA_USDC_MINT_DEVNET } from "../../../utils/solana/address";

export function useSolanaTransferInstruction(instruction: ParsedTransactionInstruction, owner: string) {
    let {
        from,
        to,
        mint,
        amount,
        isHoldersOp,
        limits,
        withdrawalSeqno,
        feeAmount
    } = useMemo(() => {
        let from = null;
        let to = null;
        let mint = null;
        let amount = null;
        let isHoldersOp = false;
        let limits = null;
        let withdrawalSeqno = null;
        let feeAmount = null;

        if (!instruction) {
            return {
                from,
                to,
                mint,
                amount,
                isHoldersOp,
                limits,
                withdrawalSeqno,
                feeAmount
            };
        }

        switch (instruction.name) {
            case 'depositCard':
                const deposit = instruction as unknown as HoldersDepositInstruction;

                from = deposit.accounts?.find((account: any) => account.name === 'Signer')?.pubkey.toString() ?? '';
                to = deposit.accounts?.find((account: any) => account.name === 'Card Token Account')?.pubkey.toString() ?? '';
                mint = deposit.accounts?.find((account: any) => account.name === 'Token Mint')?.pubkey.toString() ?? '';

                amount = deposit.args?.find((arg: any) => arg.name === 'amount')?.data ?? '';
                isHoldersOp = true;
                break;
            case 'updateCardLimits':
                const update = instruction as unknown as HoldersLimitsInstruction;

                from = update.accounts?.find((account: any) => account.name === 'Signer')?.pubkey.toString() ?? '';
                to = update.accounts?.find((account: any) => account.name === 'Card')?.pubkey.toString() ?? '';
                mint = update.accounts?.find((account: any) => account.name === 'Token Mint')?.pubkey.toString() ?? '';

                isHoldersOp = true;
                limits = {
                    onetime: update.args?.find((arg: any) => arg.name === 'newOnetime')?.data,
                    daily: update.args?.find((arg: any) => arg.name === 'newDaily')?.data,
                    monthly: update.args?.find((arg: any) => arg.name === 'newMonthly')?.data,
                };
                break;
            case 'closeCard':
                const close = instruction as unknown as HoldersCloseCardInstruction;

                from = close.accounts?.find((account: any) => account.name === 'Signer')?.pubkey.toString() ?? '';
                to = close.accounts?.find((account: any) => account.name === 'Card')?.pubkey.toString() ?? '';
                mint = close.accounts?.find((account: any) => account.name === 'Token Mint')?.pubkey.toString() ?? '';

                isHoldersOp = true;
                break;
            case 'executeWithdrawal': {
                const executeWithdrawal = instruction as unknown as HoldersExecuteWithdrawalInstruction;

                from = executeWithdrawal.accounts?.find((account: any) => account.name === 'Withdrawals Token Account')?.pubkey.toString() ?? '';
                to = executeWithdrawal.accounts?.find((account: any) => account.name === 'Destination Token Account')?.pubkey.toString() ?? '';
                mint = executeWithdrawal.accounts?.find((account: any) => account.name === 'Token Mint')?.pubkey.toString() ?? '';

                withdrawalSeqno = executeWithdrawal.args?.find((arg: any) => arg.name === 'withdrawalSeqno')?.data ?? null;
                feeAmount = executeWithdrawal.args?.find((arg: any) => arg.name === 'feeAmount')?.data ?? null;

                isHoldersOp = true;
                break;
            }
            case 'cancelWithdrawal': {
                const cancelWithdrawal = instruction as unknown as HoldersCancelWithdrawalInstruction;

                from = cancelWithdrawal.accounts?.find((account: any) => account.name === 'Signer')?.pubkey.toString() ?? '';
                to = cancelWithdrawal.accounts?.find((account: any) => account.name === 'Card')?.pubkey.toString() ?? '';
                mint = cancelWithdrawal.accounts?.find((account: any) => account.name === 'Token Mint')?.pubkey.toString() ?? '';

                withdrawalSeqno = cancelWithdrawal.args?.find((arg: any) => arg.name === 'withdrawalSeqno')?.data ?? null;

                isHoldersOp = true;
                break;
            }
            case 'allocateWithdrawals': {
                const allocate = instruction as unknown as HoldersAllocateWithdrawalsInstruction;

                from = allocate.accounts?.find((account: any) => account.name === 'Signer')?.pubkey.toString() ?? '';
                to = allocate.accounts?.find((account: any) => account.name === 'Withdrawals')?.pubkey.toString() ?? '';
                mint = allocate.accounts?.find((account: any) => account.name === 'Token Mint')?.pubkey.toString() ?? '';

                isHoldersOp = true;
                break;
            }
            case 'deleteCard': {
                const deleteCard = instruction as unknown as HoldersDeleteCardInstruction;

                from = deleteCard.accounts?.find((account: any) => account.name === 'Owner')?.pubkey.toString() ?? '';
                to = deleteCard.accounts?.find((account: any) => account.name === 'Card')?.pubkey.toString() ?? '';
                mint = deleteCard.accounts?.find((account: any) => account.name === 'Token Mint')?.pubkey.toString() ?? '';

                isHoldersOp = true;
                break;
            }
            case 'updateCardStateV2': {
                const updateV2 = instruction as unknown as HoldersUpdateCardStateV2Instruction;

                from = updateV2.accounts?.find((account: any) => account.name === 'Controller')?.pubkey.toString() ?? '';
                to = updateV2.accounts?.find((account: any) => account.name === 'Card')?.pubkey.toString() ?? '';
                mint = updateV2.accounts?.find((account: any) => account.name === 'Token Mint')?.pubkey.toString() ?? '';

                isHoldersOp = true;
                break;
            }
            case 'createAssociatedTokenAccount': {
                const ataInstruction = instruction as any;

                from = ataInstruction.accounts?.find((account: any) => account.name === 'payer')?.pubkey ?? '';
                to = ataInstruction.accounts?.find((account: any) => account.name === 'associatedToken')?.pubkey ?? '';
                mint = ataInstruction.accounts?.find((account: any) => account.name === 'mint')?.pubkey ?? '';

                break;
            }
            // Generic holders operations
            case 'createRoot':
            case 'issueCard':
            case 'refund':
            case 'syncCardBalance':
            case 'updateCardState':
            case 'withdrawFromTreasure':
            case 'addToWhitelist':
            case 'removeFromWhitelist':
            case 'resetWhitelist':
            case 'changeController':
            case 'changeGracefulPeriod':
            case 'assignNewTreasureAuthority':
            case 'setSupportAuthority':
            case 'setWithdrawalConfig':
            case 'fixIncorrectDeposit': {
                const genericInstruction = instruction as any;

                from = genericInstruction.accounts?.find((account: any) =>
                    account.name === 'Signer' || account.name === 'Owner' || account.name === 'Controller'
                )?.pubkey.toString() ?? '';
                to = genericInstruction.accounts?.find((account: any) =>
                    account.name === 'Card' || account.name === 'Root'
                )?.pubkey.toString() ?? '';
                mint = genericInstruction.accounts?.find((account: any) => account.name === 'Token Mint')?.pubkey.toString() ?? '';

                isHoldersOp = true;
                break;
            }
        }

        return {
            from,
            to,
            mint,
            amount,
            isHoldersOp,
            limits,
            withdrawalSeqno,
            feeAmount
        }
    }, [instruction?.name]);

    if (mint === '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU') {
        mint = SOLANA_USDC_MINT_DEVNET;
    }

    const solanaToken = useSolanaToken(owner, mint);

    const validAmount = useMemo(() => {
        if (!amount) {
            return null;
        }

        if (solanaToken) {
            return BigInt(amount);
        }

        return BigInt(amount);
    }, [solanaToken?.decimals, amount]);

    const decimals = solanaToken
        ? solanaToken?.decimals ?? 6
        : 9;

    if (amount) {
        amount = `${fromBnWithDecimals(validAmount ?? 0n, decimals)}${solanaToken?.symbol ? ` ${solanaToken.symbol}` : ''}`;
    }

    return {
        from,
        to,
        mint,
        amount,
        isHoldersOp,
        limits,
        validAmount,
        solanaToken,
        decimals,
        withdrawalSeqno,
        feeAmount
    }
}
