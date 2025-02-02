import { useCallback } from "react";
import { toNano } from "@ton/core";
import { useNetwork } from "../../../../../../engine/hooks";
import { useRoute } from "@react-navigation/native";
import { useTypedNavigation } from "../../../../../../utils/useTypedNavigation";
import { useLinkNavigator } from "../../../../../../useLinkNavigator";
import { ResolvedTxUrl, resolveUrl } from "../../../../../../utils/resolveUrl";

type Props = {
  addressDomainInputState: {
    target: string;
    input: string;
    domain?: string;
  };
  commentString: string;
  validAmount: bigint | null;
  stateInit: any;
  amount: string;
  selectedJetton: any;
};

export const useRecipientHandlers = ({
  addressDomainInputState,
  commentString,
  validAmount,
  stateInit,
  amount,
  selectedJetton,
}: Props) => {
  const network = useNetwork();
  const navigation = useTypedNavigation();
  const linkNavigator = useLinkNavigator(network.isTestnet);
  const route = useRoute();
  const isLedger = route.name === "LedgerSimpleTransfer";

  const convertToNano = (inputAmount: string): bigint | null => {
    try {
      return toNano(inputAmount);
    } catch {
      return null;
    }
  };

  const handleQRCodeScan = useCallback(
    (src: string) => {
      const tx = resolveUrl(src, network.isTestnet) as ResolvedTxUrl;
      const isTransferInvalid =
        !tx || (tx.type !== "transaction" && tx.type !== "jetton-transaction");

      if (isTransferInvalid) {
        return;
      }

      if (tx.payload) {
        navigation.goBack();
        linkNavigator(tx);
        return;
      }

      const mAmount = tx.amount ?? convertToNano(amount);
      const mComment = tx.comment ?? commentString;
      const mTarget = tx.address
        ? tx.address.toString({
            testOnly: network.isTestnet,
            bounceable: tx.isBounceable ?? true,
          })
        : addressDomainInputState.target;
      const mStateInit =
        tx.type === "transaction" ? tx.stateInit ?? null : stateInit;
      const mJetton =
        tx.type === "jetton-transaction" && tx.jettonMaster
          ? tx.jettonMaster
          : selectedJetton;

      const transactionParams = {
        target: mTarget,
        comment: mComment,
        amount: mAmount,
        stateInit: mStateInit,
        jetton: mJetton,
      };

      isLedger
        ? navigation.navigateLedgerTransfer(transactionParams)
        : navigation.navigateSimpleTransfer(transactionParams);
    },
    [
      commentString,
      addressDomainInputState,
      validAmount,
      stateInit,
      selectedJetton,
      network.isTestnet,
      isLedger,
      navigation,
      linkNavigator,
    ]
  );

  return { handleQRCodeScan };
};
