import { useCallback, useMemo, useState } from "react";
import { SelectedInput } from "../../../secure/simpleTransfer/hooks/useSimpleTransfer";
import { TypedNavigation } from "../../../../utils/useTypedNavigation";
import { SolanaAddressInputState } from "../../../../components/address/SolanaAddressInput";
import { fromNano, toNano } from "@ton/core";
import { solanaAddressFromPublicKey, isSolanaAddress, solanaAddressFromString, SolanaAddress } from "../../../../utils/solana/core";
import { useSelectedAccount, useSolanaAccount } from "../../../../engine/hooks";
import { t } from "../../../../i18n/t";
import { formatInputAmount } from "../../../../utils/formatCurrency";
import { SolanaSimpleTransferParams } from "../SolanaSimpleTransferFragment";
import { usePrevious } from "../../../secure/simpleTransfer/hooks/usePrevious";
import { SolanaOrder } from "../../../secure/ops/Order";
import { Alert } from "react-native";

type Options = {
    params: SolanaSimpleTransferParams;
    navigation: TypedNavigation;
    owner: SolanaAddress;
}

export const useSolanaSimpleTransfer = ({ params, navigation, owner }: Options) => {
    const acc = useSelectedAccount();
    const accSolanaAddress = solanaAddressFromPublicKey(acc!.publicKey);
    const account = useSolanaAccount(accSolanaAddress);
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

    const targetAddressValid: [SolanaAddress | null, boolean] = useMemo(() => {
        if (target.length < 44) {
            return [null, false];
        }
        if (!isSolanaAddress(target)) {
            return [null, true];
        }
        try {
            return [solanaAddressFromString(target), false];
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
            value = toNano(valid);
            return value;
        } catch {
            return null;
        }
    }, [amount]);

    const balance = account.data?.lamports || 0n;

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
            amount: validAmount,
            comment: commentString,
        }
    }, [targetAddressValid, validAmount, commentString]);

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
        const amount = fromNano(balance);
        const formatted = formatInputAmount(amount.replace('.', ','), 9, { skipFormattingDecimals: true });
        setAmount(formatted);
    }, [balance]);

    const continueDisabled = !order;

    const onQRCodeRead = useCallback((src: string) => {
        // TODO
    }, []);

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

        navigation.navigateSolanaTransfer({ order });
    }, [navigation, targetAddressValid, validAmount, commentString]);

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
        onQRCodeRead,
        doSend
    }
}