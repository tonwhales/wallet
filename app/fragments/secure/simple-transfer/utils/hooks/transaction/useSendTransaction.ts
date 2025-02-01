import { useCallback } from "react";
import { Alert, Keyboard, Platform } from "react-native";
import { useTypedNavigation } from "../../../../../../utils/useTypedNavigation";
import { contractFromPublicKey } from "../../../../../../engine/contractFromPublicKey";
import { Address, Cell } from "@ton/core";
import { t } from "../../../../../../i18n/t";
import { Jetton, WalletVersions } from "../../../../../../engine/types";

type Props = {
  target: string;
  order: any;
  validAmount: bigint | null;
  acc: {
    publicKey: Buffer;
  } | null;
  walletVersion: WalletVersions;
  network: {
    isTestnet: boolean;
  };
  isLedger: boolean;
  ledgerAddress?: Address | null;
  balance: bigint;
  commentString: string;
  supportsGaslessTransfer?: boolean;
  callback: ((ok: boolean, result: Cell | null) => void) | null;
  jetton: Jetton | null;
};

export const useSendTransaction = ({
  target,
  order,
  validAmount,
  acc,
  walletVersion,
  network,
  isLedger,
  ledgerAddress,
  balance,
  commentString,
  supportsGaslessTransfer,
  callback,
  jetton,
}: Props) => {
  const navigation = useTypedNavigation();

  return useCallback(async () => {
    let address: Address;
    try {
      address = Address.parseFriendly(target).address;
    } catch (e) {
      Alert.alert(t("transfer.error.invalidAddress"));
      return;
    }

    if (!validAmount || validAmount < 0n) {
      Alert.alert(t("transfer.error.invalidAmount"));
      return;
    }

    if (!order) return;

    const contract = contractFromPublicKey(
      acc!.publicKey,
      walletVersion,
      network.isTestnet
    );

    if (address.equals(isLedger ? ledgerAddress! : contract.address)) {
      let allowSendingToYourself = await new Promise((resolve) => {
        Alert.alert(t("transfer.error.sendingToYourself"), undefined, [
          { text: t("common.continueAnyway"), onPress: () => resolve(true) },
          {
            text: t("common.cancel"),
            onPress: () => resolve(false),
            isPreferred: true,
          },
        ]);
      });
      if (!allowSendingToYourself) return;
    }

    if (balance < validAmount) {
      Alert.alert(t("common.error"), t("transfer.error.notEnoughCoins"));
      return;
    }

    if (Platform.OS === "ios") Keyboard.dismiss();

    if (isLedger) {
      navigation.replace("LedgerSignTransfer", { order });
      return;
    }

    navigation.navigateTransfer({
      text: commentString,
      order,
      callback,
      useGasless: supportsGaslessTransfer,
    });
  }, [
    order,
    validAmount,
    acc,
    walletVersion,
    network,
    isLedger,
    ledgerAddress,
    balance,
    commentString,
    supportsGaslessTransfer,
    callback,
    jetton,
  ]);
};
