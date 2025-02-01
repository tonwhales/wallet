import React, { Dispatch, useMemo, useRef } from "react";
import Animated from "react-native-reanimated";
import {
  AddressInputState,
  TransferAddressInput,
} from "../../../../../components/address/TransferAddressInput";
import { StyleProp, View, ViewStyle } from "react-native";
import {
  useNetwork,
  useSelectedAccount,
  useTheme,
} from "../../../../../engine/hooks";
import { useTypedNavigation } from "../../../../../utils/useTypedNavigation";
import { useRoute } from "@react-navigation/native";
import { KnownWallets } from "../../../../../secure/KnownWallets";
import { useLedgerTransport } from "../../../../ledger/components/TransportContext";
import { Address } from "@ton/core";
import { ATextInputRef } from "../../../../../components/ATextInput";
import {
  SimpleTransferAction,
  SimpleTransferActions,
} from "../../utils/hooks/state/useSimpleTransferState";
import { SimpleTransferInputType } from "../../types/SimpleTransferInputType";
import { animatedLayout } from "../../styles";

type Props = {
  addressInputHeight: number;
  selectedInputStyles: {
    address: StyleProp<ViewStyle>;
  };
  addressDomainInputState: {
    target: string;
    input: string;
    domain?: string;
  };
  selected: SimpleTransferInputType;
  targetAddressValid: {
    address: Address;
  } | null;
  onFocus: (index: number) => void;
  onSubmit: () => void;
  onQRCodeRead: (data: string) => void;
  onSearchItemSelected: (item: any) => void;
  selectedInput: number | null;
  dispatch: Dispatch<SimpleTransferAction>;
};

export default function SimpleTransferRecipient({
  addressInputHeight,
  selectedInputStyles,
  addressDomainInputState,
  selected,
  targetAddressValid,
  onFocus,
  onSubmit,
  onQRCodeRead,
  onSearchItemSelected,
  selectedInput,
  dispatch,
}: Props) {
  const theme = useTheme();
  const network = useNetwork();
  const navigation = useTypedNavigation();

  const route = useRoute();
  const knownWallets = KnownWallets(network.isTestnet);
  const isLedger = route.name === "LedgerSimpleTransfer";
  const acc = useSelectedAccount();

  // Ledger
  const ledgerContext = useLedgerTransport();
  const addr = ledgerContext?.addr;
  const ledgerAddress = useMemo(() => {
    if (addr && isLedger) {
      try {
        return Address.parse(addr.address);
      } catch {}
    }
  }, [addr]);

  const { target, input: addressDomainInput, domain } = addressDomainInputState;
  const addressRef = useRef<ATextInputRef>(null);

  const setAddressDomainInputState = (value: AddressInputState) => {
    dispatch({
      type: SimpleTransferActions.SET_ADDRESS_DOMAIN_INPUT,
      payload: value,
    });
  };

  return (
    <>
      <Animated.View
        layout={animatedLayout}
        style={selectedInputStyles.address}
        onLayout={(e) => {
          dispatch({
            type: SimpleTransferActions.SET_ADDRESS_INPUT_HEIGHT,
            payload: e.nativeEvent.layout.height,
          });
        }}
      >
        <TransferAddressInput
          ref={addressRef}
          acc={ledgerAddress ?? acc!.address}
          theme={theme}
          target={target}
          input={addressDomainInput}
          domain={domain}
          validAddress={targetAddressValid?.address}
          isTestnet={network.isTestnet}
          index={0}
          onFocus={onFocus}
          setAddressDomainInputState={setAddressDomainInputState}
          onSubmit={onSubmit}
          onQRCodeRead={onQRCodeRead}
          isSelected={selected === "address"}
          onSearchItemSelected={onSearchItemSelected}
          knownWallets={knownWallets}
          navigation={navigation}
          autoFocus={selectedInput === 0}
        />
      </Animated.View>
      {selected === "address" && (
        <View style={{ height: addressInputHeight }} />
      )}
    </>
  );
}
