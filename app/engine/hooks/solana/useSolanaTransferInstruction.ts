import { useMemo } from "react";
import { HoldersCloseCardInstruction, HoldersDepositInstruction, HoldersLimitsInstruction, ParsedTransactionInstruction } from "../../../utils/solana/parseInstructions";
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
        limits
    } = useMemo(() => {
        let from = null;
        let to = null;
        let mint = null;
        let amount = null;
        let isHoldersOp = false;
        let limits = null;

        if (!instruction) {
            return {
                from,
                to,
                mint,
                amount,
                isHoldersOp,
                limits
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
        }

        return {
            from,
            to,
            mint,
            amount,
            isHoldersOp,
            limits,
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

        if (!!solanaToken) {
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
        decimals
    }
}
