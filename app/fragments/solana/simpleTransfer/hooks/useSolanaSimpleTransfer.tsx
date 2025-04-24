import { useCallback, useMemo, useState } from "react";
import { SelectedInput } from "../../../secure/simpleTransfer/hooks/useSimpleTransfer";
import { TypedNavigation } from "../../../../utils/useTypedNavigation";
import { SolanaAddressInputState } from "../../../../components/address/SolanaAddressInput";
import { fromNano, toNano } from "@ton/core";
import { solanaAddressFromPublicKey, isSolanaAddress } from "../../../../utils/solana/address";
import { useSelectedAccount, useSolanaAccount, useSolanaToken, useSolanaClients } from "../../../../engine/hooks";
import { t } from "../../../../i18n/t";
import { formatInputAmount } from "../../../../utils/formatCurrency";
import { SolanaSimpleTransferParams } from "../SolanaSimpleTransferFragment";
import { usePrevious } from "../../../secure/simpleTransfer/hooks/usePrevious";
import { SolanaOrder } from "../../../secure/ops/Order";
import { Alert } from "react-native";
import { fromBnWithDecimals, toBnWithDecimals } from "../../../../utils/withDecimals";
import { emulateSolanaTranOrder } from "../../../secure/utils/emulateSolanaTranOrder";

type Options = {
    params: SolanaSimpleTransferParams;
    navigation: TypedNavigation;
    owner: string;
    token?: string | null;
}

export const useSolanaSimpleTransfer = ({ params, navigation, owner, token }: Options) => {
    const acc = useSelectedAccount();
    const accSolanaAddress = solanaAddressFromPublicKey(acc!.publicKey).toString();
    const account = useSolanaAccount(accSolanaAddress);
    const accountToken = useSolanaToken(accSolanaAddress, token);
    const { client, publicClient } = useSolanaClients();
    const hasParamsFilled = !!params?.target && !!params?.amount;
    const [selectedInput, setSelectedInput] = useState<SelectedInput | null>(hasParamsFilled ? null : SelectedInput.ADDRESS);

    const [addressInputState, setAddressInputState] = useState<SolanaAddressInputState>(
        {
            input: params?.target || '',
            target: params?.target || '',
            suffix: undefined,
        }
    );

    const { target } = addressInputState;

    const [commentString, setComment] = useState(params?.comment || '');
    const [amount, setAmount] = useState(params?.amount ? fromNano(params.amount) : '');

    const targetAddressValid: [string | null, boolean] = useMemo(() => {
        if (!target || target.length < 44) {
            return [null, false];
        }
        if (!isSolanaAddress(target)) {
            return [null, true];
        }
        try {
            return [target, false];
        } catch {
            return [null, true];
        }
    }, [target]);

    const validAmount = useMemo(() => {
        let value: bigint | null = null;

        if (!amount) {
            return null;
        }

        try {
            const valid = amount.replace(',', '.').replaceAll(' ', '');
            value = accountToken?.decimals ? toBnWithDecimals(valid, accountToken.decimals) : toNano(valid);
            return value;
        } catch {
            return null;
        }
    }, [amount, accountToken?.decimals]);

    const balanceToken = BigInt(accountToken?.amount ?? 0n);
    const balance = token ? balanceToken : (account.data?.balance || 0n);

    const order: SolanaOrder | null = useMemo(() => {
        if (!validAmount) {
            return null;
        }

        if (!targetAddressValid[0]) {
            return null;
        }

        return {
            type: 'solana',
            target: targetAddressValid[0],
            token: accountToken ? {
                mint: accountToken.address,
                symbol: accountToken.symbol,
                decimals: accountToken.decimals
            } : null,
            amount: validAmount,
            comment: commentString,
        }
    }, [targetAddressValid[0], validAmount, commentString, accountToken]);

    const amountError = useMemo(() => {
        if (amount.length === 0) {
            return undefined;
        }
        if (validAmount === null) {
            return t('transfer.error.invalidAmount');
        }
        if (validAmount < 0n) {
            return t('transfer.error.invalidAmount');
        }
        if (validAmount > balance) {
            return t('transfer.error.notEnoughCoins');
        }

        return undefined;
    }, [validAmount, balance, amount]);

    const onAddAll = useCallback(() => {
        // Reserve 5000 lamports (0.000005 SOL) for transaction fees when sending SOL
        const reserveFee = token ? 0n : 5000n;
        const effectiveBalance = balance > reserveFee ? balance - reserveFee : 0n;
        const amount = fromBnWithDecimals(effectiveBalance, accountToken?.decimals ?? 9);
        const formatted = formatInputAmount(amount.replace('.', ','), accountToken?.decimals ?? 9, { skipFormattingDecimals: true });
        setAmount(formatted);
    }, [balance, accountToken?.decimals, token]);

    const continueDisabled = !order;

    const doSendData = usePrevious({
        owner: owner,
        balance,
        order
    });

    const doSend = useCallback(async () => {
        if (!doSendData.current?.order) {
            return;
        }

        const { order, balance } = doSendData.current;

        // Check amount
        if (balance < order.amount || balance === 0n) {
            Alert.alert(t('common.error'), t('transfer.error.notEnoughCoins'));
            return;
        }

        if (validAmount === 0n) {
            const allowSendingZero = await new Promise((resolve) => {
                Alert.alert(t('transfer.error.zeroCoinsAlert'), undefined, [
                    { onPress: () => resolve(true), text: t('common.continueAnyway') },
                    { onPress: () => resolve(false), text: t('common.cancel'), isPreferred: true }
                ]);
            });
            if (!allowSendingZero) return;
        }

        try {
            const emulationError = await emulateSolanaTranOrder({ order, solanaClients: { client, publicClient }, sender: owner });
            if (emulationError?.lamportsNeeded && !token) {
                const accountAfterAmount = order.amount - emulationError.lamportsNeeded;

                if (accountAfterAmount > 0n) {
                    const newOrder = {
                        ...order,
                        amount: accountAfterAmount
                    }

                    navigation.navigateSolanaTransfer({ type: 'order', order: newOrder });
                    return;
                } else {
                    Alert.alert(t('transfer.solana.error.title'), (emulationError as Error).message);
                    return;
                }
            }

            navigation.navigateSolanaTransfer({ type: 'order', order });
        } catch (error: any) {
            // Handle the specific "Attempt to debit" error
            if (error.message?.includes('Attempt to debit an account but found no record of a prior credit')) {
                Alert.alert(
                    t('common.error'),
                    'Account has not been initialized on chain yet. Please fund the account first.'
                );
                return;
            }
            // Handle other errors
            Alert.alert(t('common.error'), error.message || 'Unknown error occurred');
        }
    }, [navigation, targetAddressValid, validAmount, commentString, client, publicClient, owner, token]);

    return {
        addressInputState,
        setAddressInputState,
        selectedInput,
        setSelectedInput,
        targetAddressValid,
        commentString,
        setComment,
        amount,
        setAmount,
        validAmount,
        balance,
        order,
        amountError,
        continueDisabled,
        onAddAll,
        doSend,
        symbol: accountToken?.symbol ?? 'SOL',
        decimals: accountToken?.decimals ?? 9,
        logoURI: accountToken?.logoURI ?? ''
    }
}