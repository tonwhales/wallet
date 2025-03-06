import { useCallback, useMemo, useState } from "react";
import { SelectedInput } from "../../../secure/simpleTransfer/hooks/useSimpleTransfer";
import { ParamListBase } from "@react-navigation/native";
import { RouteProp } from "@react-navigation/native";
import { TypedNavigation } from "../../../../utils/useTypedNavigation";
import { SolanaAddressInputState } from "../../../../components/address/SolanaAddressInput";
import { fromNano, toNano } from "@ton/core";
import { solanaAddressFromPublicKey, isSolanaAddress, solanaAddressFromString } from "../../../../utils/solana/core";
import { useSelectedAccount, useSolanaAccount } from "../../../../engine/hooks";
import { t } from "../../../../i18n/t";
import { formatInputAmount } from "../../../../utils/formatCurrency";
import { SolanaSimpleTransferParams } from "../SolanaSimpleTransferFragment";

type Options = {
    params: SolanaSimpleTransferParams;
    route: RouteProp<ParamListBase>;
    navigation: TypedNavigation;
}

export const useSolanaSimpleTransfer = ({ params, route, navigation }: Options) => {
    const acc = useSelectedAccount();
    const accSolanaAddress = solanaAddressFromPublicKey(acc!.publicKey);
    const account = useSolanaAccount(accSolanaAddress);

    const hasParamsFilled = !!params?.target && !!params?.amount;
    const [selectedInput, setSelectedInput] = useState<SelectedInput | null>(hasParamsFilled ? null : SelectedInput.ADDRESS);

    const [addressDomainInputState, setAddressDomainInputState] = useState<SolanaAddressInputState>(
        {
            input: params?.target || '',
            target: params?.target || '',
            suffix: undefined,
        }
    );

    const { target } = addressDomainInputState;

    const [commentString, setComment] = useState(params?.comment || '');
    const [amount, setAmount] = useState(params?.amount ? fromNano(params.amount) : '');

    const targetAddressValid = useMemo(() => {
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

    const order = useMemo(() => {
        if (!validAmount) {
            return null;
        }

        if (!targetAddressValid[0]) {
            return null;
        }

        return {
            type: 'solana',
            target: targetAddressValid,
            amount: validAmount,
        }
    }, [targetAddressValid, validAmount]);

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

    const doSend = useCallback(() => {
        // TODO
    }, []);

    return {
        addressDomainInputState,
        setAddressDomainInputState,
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