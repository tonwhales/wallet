import { Address, Cell, toNano } from "@ton/core";
import {
  createJettonOrder,
  createLedgerJettonOrder,
  createSimpleLedgerOrder,
  createSimpleOrder,
} from "../../../../ops/Order";
import { RefObject, useMemo } from "react";
import { Jetton } from "../../../../../../engine/types";
import { AccountLite } from "../../../../../../engine/hooks/accounts/useAccountLite";
import { KnownWallet } from "../../../../../../secure/KnownWallets";
import { SimpleTransferParams } from "../../../types/SimpleTransferParams";

type Props = {
  estimationRef: RefObject<bigint | null>;
  validAmount: bigint | null;
  target: string;
  domain?: string;
  commentString: string;
  stateInit: Cell | null;
  jetton: Jetton | null;
  accountLite: AccountLite | null;
  ledgerAddress?: Address;
  isLedger: boolean;
  acc?: {
    address: Address;
  } | null;
  known: KnownWallet;
  jettonPayload?:
    | {
        customPayload?: string | null | undefined;
        stateInit?: string | null | undefined;
      }
    | null
    | undefined;
  params: SimpleTransferParams;
  network: {
    isTestnet: boolean;
  };
};

export const useResolveOrder = ({
  estimationRef,
  validAmount,
  target,
  domain,
  commentString,
  stateInit,
  jetton,
  accountLite,
  ledgerAddress,
  isLedger,
  acc,
  known,
  jettonPayload,
  params,
  network,
}: Props) => {
  const forwardAmount = params.forwardAmount ?? null;
  const feeAmount = params.feeAmount ?? null;
  const payload = params.payload ?? null;

  return useMemo(() => {
    if (validAmount === null) {
      return null;
    }

    try {
      Address.parseFriendly(target);
    } catch (e) {
      return null;
    }

    if (
      !!known &&
      known.requireMemo &&
      (!commentString || commentString.length === 0)
    ) {
      return null;
    }

    const estim = estimationRef.current ?? toNano("0.1");

    if (isLedger && ledgerAddress) {
      // Resolve jetton order
      if (jetton) {
        const txForwardAmount = toNano("0.05") + estim;
        return createLedgerJettonOrder(
          {
            wallet: jetton.wallet,
            target: target,
            domain: domain,
            responseTarget: ledgerAddress,
            text: commentString,
            amount: validAmount,
            tonAmount: 1n,
            txAmount: txForwardAmount,
            payload: null,
          },
          network.isTestnet
        );
      }

      // Resolve order
      return createSimpleLedgerOrder({
        target: target,
        domain: domain,
        text: commentString,
        payload: null,
        amount:
          accountLite?.balance === validAmount ? toNano("0") : validAmount,
        amountAll: accountLite?.balance === validAmount ? true : false,
        stateInit,
      });
    }

    // Resolve jetton order
    if (jetton) {
      const customPayload = jettonPayload?.customPayload ?? null;
      const customPayloadCell = customPayload
        ? Cell.fromBoc(Buffer.from(customPayload, "base64"))[0]
        : null;
      const stateInit = jettonPayload?.stateInit ?? null;
      const stateInitCell = stateInit
        ? Cell.fromBoc(Buffer.from(stateInit, "base64"))[0]
        : null;

      let txAmount = feeAmount ?? toNano("0.05") + estim;

      if (!!stateInit || !!customPayload) {
        txAmount = feeAmount ?? toNano("0.1") + estim;
      }

      const tonAmount = forwardAmount ?? 1n;

      return createJettonOrder(
        {
          wallet: jetton.wallet,
          target: target,
          domain: domain,
          responseTarget: acc!.address,
          text: commentString,
          amount: validAmount,
          tonAmount,
          txAmount,
          customPayload: customPayloadCell,
          payload: payload,
          stateInit: stateInitCell,
        },
        network.isTestnet
      );
    }

    // Resolve order
    return createSimpleOrder({
      target: target,
      domain: domain,
      text: commentString,
      payload: payload,
      amount: validAmount === accountLite?.balance ? toNano("0") : validAmount,
      amountAll: validAmount === accountLite?.balance,
      stateInit,
      app: params?.app,
    });
  }, [
    validAmount,
    target,
    domain,
    commentString,
    stateInit,
    jetton,
    params?.app,
    acc,
    ledgerAddress,
    known,
    jettonPayload,
  ]);
};
