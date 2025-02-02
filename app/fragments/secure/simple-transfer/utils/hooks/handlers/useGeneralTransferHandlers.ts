import { Dispatch, RefObject, useCallback } from "react";
import { Keyboard, ScrollView } from "react-native";
import { formatInputAmount } from "../../../../../../utils/formatCurrency";
import { fromBnWithDecimals } from "../../../../../../utils/withDecimals";
import { fromNano } from "@ton/core";
import {
  SimpleTransferAction,
  SimpleTransferActions,
} from "../state/useSimpleTransferState";
import { Jetton } from "../../../../../../engine/types";

type Props = {
  scrollRef: RefObject<ScrollView>;
  balance: bigint;
  jetton: Jetton | null;
  dispatch: Dispatch<SimpleTransferAction>;
  setSelectedInput: (value: number | null) => void;
};

export const useGeneralTransferHandlers = ({
  scrollRef,
  balance,
  jetton,
  dispatch,
  setSelectedInput,
}: Props) => {
  const onInputFocus = useCallback(
    (index: number) => setSelectedInput(index),
    []
  );
  const onInputSubmit = useCallback(() => setSelectedInput(null), []);
  const resetInput = useCallback(() => {
    Keyboard.dismiss();
    setSelectedInput(null);
  }, []);

  const onAddAll = useCallback(() => {
    const amount = jetton
      ? fromBnWithDecimals(balance, jetton.decimals)
      : fromNano(balance);

    dispatch({
      type: SimpleTransferActions.SET_AMOUNT,
      payload: formatInputAmount(
        amount.replace(".", ","),
        jetton?.decimals ?? 9,
        {
          skipFormattingDecimals: true,
        }
      ),
    });
  }, [balance, jetton]);

  const onSearchItemSelected = useCallback((item: any) => {
    scrollRef.current?.scrollTo({ y: 0 });
    if (item.memo) {
      dispatch({
        type: SimpleTransferActions.SET_COMMENT,
        payload: item.memo,
      });
    }
  }, []);

  return {
    onFocus: onInputFocus,
    onSubmit: onInputSubmit,
    resetInput,
    onAddAll,
    onSearchItemSelected,
  };
};
