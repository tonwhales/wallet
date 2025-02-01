import { Dispatch, useCallback, useMemo } from "react";
import { Address, toNano } from "@ton/core";
import { t } from "../../../../../i18n/t";
import { useHoldersAccountTrargets } from "../../../../../engine/hooks/holders/useHoldersAccountTrargets";
import { useNetwork } from "../../../../../engine/hooks";
import { KnownWallets } from "../../../../../secure/KnownWallets";
import { queryClient } from "../../../../../engine/clients";
import { Queries } from "../../../../../engine/queries";
import { getQueryData } from "../../../../../engine/utils/getQueryData";
import { HintsFull } from "../../../../../engine/hooks/jettons/useHintsFull";
import {
  SimpleTransferAction,
  SimpleTransferActions,
} from "./state/useSimpleTransferState";

type Props = {
  jetton: { master?: Address; wallet?: Address } | null;
  address: Address;
  target: string;
  commentString: string;
  amount: string;
  balance: bigint;
  dispatch: Dispatch<SimpleTransferAction>;
};

export const useTransferValidation = ({
  target,
  amount,
  jetton,
  commentString,
  address,
  balance,
  dispatch,
}: Props) => {
  const network = useNetwork();
  const holdersAccounts = useHoldersAccountTrargets(address!);
  const knownWallets = KnownWallets(network.isTestnet);

  const targetAddressValid = useMemo(() => {
    if (target.length > 48) return null;
    try {
      return Address.parseFriendly(target);
    } catch {
      return null;
    }
  }, [target]);

  const holdersTarget = holdersAccounts?.find(
    (a) => targetAddressValid && targetAddressValid?.address.equals(a.address)
  );

  const shouldAddMemo = holdersTarget?.memo
    ? holdersTarget.memo !== commentString
    : false;

  // Resolve known wallets params
  const known = useMemo(
    () =>
      knownWallets[
        targetAddressValid?.address.toString({ testOnly: network.isTestnet }) ??
          ""
      ],
    [knownWallets]
  );

  const validAmount = useMemo(() => {
    if (!amount) return null;
    try {
      const valid = amount.replace(",", ".").replaceAll(" ", "");
      return jetton ? toNano(valid) : toNano(valid);
    } catch {
      return null;
    }
  }, [amount, jetton]);

  const commentError = useMemo(() => {
    const isEmpty = !commentString || commentString.length === 0;
    const isKnownWithMemo = !!known && known.requireMemo;

    if (isEmpty && isKnownWithMemo) {
      return t("transfer.error.memoRequired");
    }

    const validMemo = commentString === holdersTarget?.memo;

    if (shouldAddMemo && (isEmpty || !validMemo)) {
      return t("transfer.error.memoChange", { memo: holdersTarget?.memo });
    }

    return undefined;
  }, [commentString, known, shouldAddMemo, holdersTarget?.memo]);

  const holdersTargetJetton = holdersTarget?.jettonMaster
    ? Address.parse(holdersTarget.jettonMaster)
    : null;

  const jettonMaster = jetton?.master;

  const shouldChangeJetton = holdersTargetJetton
    ? !jettonMaster?.equals(holdersTargetJetton)
    : holdersTarget && !!jetton && holdersTarget.symbol === "TON";

  const amountError = useMemo(() => {
    if (shouldChangeJetton) {
      return t("transfer.error.jettonChange", {
        symbol: holdersTarget?.symbol,
      });
    }
    if (amount.length === 0) return undefined;
    if (validAmount === null || validAmount < 0n) {
      return t("transfer.error.invalidAmount");
    }
    if (validAmount > balance) {
      return t("transfer.error.notEnoughCoins");
    }
    if (validAmount === 0n && !!jetton) {
      return t("transfer.error.zeroCoins");
    }
    return undefined;
  }, [validAmount, balance, amount, shouldChangeJetton, holdersTarget?.symbol]);

  const onChangeJetton = useCallback(() => {
    if (!holdersTarget) return;
    if (holdersTarget.symbol === "TON") {
      dispatch({
        type: SimpleTransferActions.SET_SELECTED_JETTON,
        payload: null,
      });
      return;
    }

    const jettonMasterAddress = holdersTarget?.jettonMaster;
    if (!jettonMasterAddress) return;

    const queryCache = queryClient.getQueryCache();
    const key = Queries.HintsFull(
      address.toString({ testOnly: network.isTestnet })
    );
    const hintsFull = getQueryData<HintsFull>(queryCache, key);

    if (!hintsFull) return;

    const index = hintsFull.addressesIndex?.[jettonMasterAddress];
    const hint = hintsFull.hints?.[index];

    if (!hint) return;

    try {
      const wallet = Address.parse(hint.walletAddress.address);
      dispatch({
        type: SimpleTransferActions.SET_SELECTED_JETTON,
        payload: wallet,
      });
    } catch {}
  }, [holdersTarget, address, network.isTestnet]);

  return {
    targetAddressValid,
    validAmount,
    commentError,
    known,
    onChangeJetton,
    amountError,
    shouldAddMemo,
    shouldChangeJetton,
    holdersTarget,
  };
};
