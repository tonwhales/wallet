import React, { Dispatch, useMemo, useRef } from "react";
import Animated from "react-native-reanimated";
import { TransferAddressInput } from "../../../../../components/address/TransferAddressInput";
import { StyleProp, View, ViewStyle } from "react-native";
import { useNetwork, useSelectedAccount } from "../../../../../engine/hooks";
import { useTypedNavigation } from "../../../../../utils/useTypedNavigation";
import { useRoute } from "@react-navigation/native";
import { KnownWallets } from "../../../../../secure/KnownWallets";
import { useLedgerTransport } from "../../../../ledger/components/TransportContext";
import { Address } from "@ton/core";
import {
  SimpleTransferAction,
  SimpleTransferActions,
} from "../../utils/hooks/state/useSimpleTransferState";
import { SimpleTransferInputType } from "../../types/SimpleTransferInputType";
import { animatedLayout } from "../../styles";
import {
  AddressDomainInputRef,
  AddressInputState,
} from "../../../../../components/address/AddressDomainInput";
import { SimpleTransferParams } from "../../types/SimpleTransferParams";

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
  onFocus: (index: number) => void;
  onSubmit: () => void;
  onQRCodeRead: (data: string) => void;
  onSearchItemSelected: (item: any) => void;
  selectedInput: number | null;
  dispatch: Dispatch<SimpleTransferAction>;
  params: SimpleTransferParams;
};

export default function SimpleTransferRecipient({
  addressInputHeight,
  selectedInputStyles,
  addressDomainInputState,
  selected,
  onFocus,
  onSubmit,
  onQRCodeRead,
  onSearchItemSelected,
  selectedInput,
  dispatch,
  params,
}: Props) {
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

  const { domain } = addressDomainInputState;
  const addressRef = useRef<AddressDomainInputRef>(null);

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
          index={0}
          ref={addressRef}
          acc={ledgerAddress ?? acc!.address}
          initTarget={params?.target || ""}
          domain={domain}
          isTestnet={network.isTestnet}
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
