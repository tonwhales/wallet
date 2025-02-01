import { useReducer, useRef } from "react";
import { ATextInputRef } from "../../../../../../components/ATextInput";
import { Address, Cell, fromNano } from "@ton/core";
import { AddressInputState } from "../../../../../../components/address/TransferAddressInput";
import { SimpleTransferParams } from "../../../types/SimpleTransferParams";
import { ScrollView } from "react-native-gesture-handler";

export enum SimpleTransferActions {
  SET_ADDRESS_DOMAIN_INPUT = "SET_ADDRESS_DOMAIN_INPUT",
  SET_COMMENT = "SET_COMMENT",
  SET_AMOUNT = "SET_AMOUNT",
  SET_STATE_INIT = "SET_STATE_INIT",
  SET_SELECTED_JETTON = "SET_SELECTED_JETTON",
  SET_ADDRESS_INPUT_HEIGHT = "SET_ADDRESS_INPUT_HEIGHT",
  SET_AMOUNT_INPUT_HEIGHT = "SET_AMOUNT_INPUT_HEIGHT",
}

export interface SimpleTransferState {
  addressDomainInputState: AddressInputState;
  commentString: string;
  amount: string;
  stateInit: Cell | null;
  selectedJetton: Address | null;
  addressInputHeight: number;
  amountInputHeight: number;
}

export type SimpleTransferAction =
  | {
      type: SimpleTransferActions.SET_ADDRESS_DOMAIN_INPUT;
      payload: AddressInputState;
    }
  | { type: SimpleTransferActions.SET_COMMENT; payload: string }
  | { type: SimpleTransferActions.SET_AMOUNT; payload: string }
  | { type: SimpleTransferActions.SET_STATE_INIT; payload: Cell | null }
  | { type: SimpleTransferActions.SET_SELECTED_JETTON; payload: Address | null }
  | { type: SimpleTransferActions.SET_ADDRESS_INPUT_HEIGHT; payload: number }
  | { type: SimpleTransferActions.SET_AMOUNT_INPUT_HEIGHT; payload: number };

const transferReducer = (
  state: SimpleTransferState,
  action: SimpleTransferAction
): SimpleTransferState => {
  switch (action.type) {
    case SimpleTransferActions.SET_ADDRESS_DOMAIN_INPUT:
      return { ...state, addressDomainInputState: action.payload };
    case SimpleTransferActions.SET_COMMENT:
      return { ...state, commentString: action.payload };
    case SimpleTransferActions.SET_AMOUNT:
      return { ...state, amount: action.payload };
    case SimpleTransferActions.SET_STATE_INIT:
      return { ...state, stateInit: action.payload };
    case SimpleTransferActions.SET_SELECTED_JETTON:
      return { ...state, selectedJetton: action.payload };
    case SimpleTransferActions.SET_ADDRESS_INPUT_HEIGHT:
      return { ...state, addressInputHeight: action.payload };
    case SimpleTransferActions.SET_AMOUNT_INPUT_HEIGHT:
      return { ...state, amountInputHeight: action.payload };
    default:
      return state;
  }
};

export const useSimpleTransferState = (params?: SimpleTransferParams) => {
  const [state, dispatch] = useReducer(transferReducer, {
    addressDomainInputState: {
      input: params?.target || "",
      target: params?.target || "",
      domain: undefined,
      suffix: undefined,
    },
    commentString: params?.comment || "",
    amount: params?.amount ? fromNano(params.amount) : "",
    stateInit: params?.stateInit || null,
    selectedJetton: params?.jetton || null,
    addressInputHeight: 0,
    amountInputHeight: 0,
  });

  const amountRef = useRef<ATextInputRef>(null);
  const commentRef = useRef<ATextInputRef>(null);
  const estimationRef = useRef<bigint | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  return { state, dispatch, amountRef, commentRef, estimationRef, scrollRef };
};
