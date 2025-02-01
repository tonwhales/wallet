import { useCallback } from "react";
import { toNano } from "@ton/core";
import { useNetwork } from "../../../../../../engine/hooks";
import { useRoute } from "@react-navigation/native";
import { useTypedNavigation } from "../../../../../../utils/useTypedNavigation";
import { useLinkNavigator } from "../../../../../../useLinkNavigator";
import { resolveUrl } from "../../../../../../utils/resolveUrl";

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
      const resolvedData = resolveUrl(src, network.isTestnet);
      if (
        !resolvedData ||
        (resolvedData.type !== "transaction" &&
          resolvedData.type !== "jetton-transaction")
      ) {
        return;
      }

      if (resolvedData.payload) {
        navigation.goBack();
        linkNavigator(resolvedData);
        return;
      }

      const newAmount = resolvedData.amount ?? convertToNano(amount);
      const newComment = resolvedData.comment ?? commentString;
      const newTarget = resolvedData.address
        ? resolvedData.address.toString({
            testOnly: network.isTestnet,
            bounceable: resolvedData.isBounceable ?? true,
          })
        : addressDomainInputState.target;
      const newStateInit =
        resolvedData.type === "transaction"
          ? resolvedData.stateInit ?? null
          : stateInit;
      const newJetton =
        resolvedData.type === "jetton-transaction" && resolvedData.jettonMaster
          ? resolvedData.jettonMaster
          : selectedJetton;

      const transactionParams = {
        target: newTarget,
        comment: newComment,
        amount: newAmount,
        stateInit: newStateInit,
        jetton: newJetton,
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
