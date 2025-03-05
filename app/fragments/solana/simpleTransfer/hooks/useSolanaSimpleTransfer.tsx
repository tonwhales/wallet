import { useMemo, useState } from "react";
import { SelectedInput } from "../../../secure/simpleTransfer/hooks/useSimpleTransfer";
import { ParamListBase } from "@react-navigation/native";
import { RouteProp } from "@react-navigation/native";
import { SolanaSimpleTransferParams } from "../SolanaSimpleTransferFragment";
import { TypedNavigation } from "../../../../utils/useTypedNavigation";
import { SolanaAddressInputState } from "../../../../components/address/SolanaAddressInput";
import { fromNano } from "@ton/core";
import { solanaAddressFromPublicKey, isSolanaAddress } from "../../../../utils/solana/core";
import { useSelectedAccount } from "../../../../engine/hooks";

type Options = {
    params: SolanaSimpleTransferParams;
    route: RouteProp<ParamListBase>;
    navigation: TypedNavigation;
}

export const useSolanaSimpleTransfer = ({ params, route, navigation }: Options) => {
    const acc = useSelectedAccount();
    const accSolanaAddress = solanaAddressFromPublicKey(acc!.publicKey);

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
    }
}