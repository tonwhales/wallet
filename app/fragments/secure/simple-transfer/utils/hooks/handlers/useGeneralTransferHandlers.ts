import { Dispatch, RefObject, useCallback } from "react";
import { Keyboard, ScrollView } from "react-native";
import { formatInputAmount } from "../../../../../../utils/formatCurrency";
import {
  fromBnWithDecimals,
  toBnWithDecimals,
} from "../../../../../../utils/withDecimals";
import { fromNano, toNano } from "@ton/core";
import Clipboard from "@react-native-clipboard/clipboard";
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
  selectedInput: number | null;
  amountRef: {
    current: {
      setText: (text: string) => void;
    } | null;
  };
  commentRef: {
    current: {
      setText: (text: string) => void;
    } | null;
  };
};

export const useGeneralTransferHandlers = ({
  scrollRef,
  balance,
  jetton,
  dispatch,
  setSelectedInput,
  selectedInput,
  amountRef,
  commentRef,
}: Props) => {
  const onFocus = useCallback((index: number) => setSelectedInput(index), []);
  const onSubmit = useCallback(() => setSelectedInput(null), []);
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
    dispatch({
      type: SimpleTransferActions.SET_COMMENT,
      payload: item.memo || "",
    });
  }, []);

  const handleClipboardData = useCallback(async () => {
    const clipboardText = (await Clipboard.getString()).trim();
    if (!clipboardText) {
      return;
    }

    switch (selectedInput) {
      case 1:
        try {
          const valid = clipboardText.replace(",", ".").replaceAll(" ", "");
          const decimals = jetton?.decimals ?? 9;
          const value = jetton
            ? toBnWithDecimals(valid, decimals)
            : toNano(valid);
          if (value) {
            const formattedAmount = formatInputAmount(
              fromBnWithDecimals(value, decimals),
              decimals
            );
            amountRef.current?.setText(formattedAmount);
          }
        } catch {}
        break;

      case 2:
        commentRef.current?.setText(clipboardText);
        break;

      default:
        break;
    }
  }, [selectedInput, jetton]);

  return {
    onFocus,
    onSubmit,
    resetInput,
    onAddAll,
    onSearchItemSelected,
    handleClipboardData,
  };
};
