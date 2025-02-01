import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboard } from "@react-native-community/hooks";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { KnownWallets } from "../../../secure/KnownWallets";
import { fragment } from "../../../fragment";
import { useParams } from "../../../utils/useParams";
import { ScreenHeader } from "../../../components/ScreenHeader";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import {
  useAccountLite,
  useClient4,
  useJetton,
  useNetwork,
  usePrice,
  useSelectedAccount,
  useTheme,
  useVerifyJetton,
} from "../../../engine/hooks";
import { useLedgerTransport } from "../../ledger/components/TransportContext";
import { Address, Cell } from "@ton/core";
import { setStatusBarStyle, StatusBar } from "expo-status-bar";
import { ScrollView } from "react-native-gesture-handler";
import { useWalletVersion } from "../../../engine/hooks/useWalletVersion";
import { WalletVersions } from "../../../engine/types";
import { useGaslessConfig } from "../../../engine/hooks/jettons/useGaslessConfig";
import { useJettonPayload } from "../../../engine/hooks/jettons/useJettonPayload";
import { useAppFocusEffect } from "../../../utils/useAppFocusEffect";
import SimpleTransferRecipient from "./components/recipient";
import SimpleTransferAmount from "./components/amount";
import { TransferHeader } from "../../../components/transfer/TransferHeader";
import { SimpleTransferParams } from "./types/SimpleTransferParams";
import { SimpleTransferComment } from "./components/comment";
import { SimpleTransferFee } from "./components/fee";
import { getContentInset, getStatusBarStyle, styles } from "./styles";
import { useTransferValidation } from "./utils/hooks/useTransferValidation";
import { useSimpleTransferState } from "./utils/hooks/state/useSimpleTransferState";
import { resolveSelectedInputOptions } from "./utils/helpers/resolveSelectedInputOptions";
import { resolveSelectedInputStyles } from "./utils/helpers/resolveSelectedInputStyles";
import { useResolveOrder } from "./utils/hooks/transaction/useResolveOrder";
import { useFeeEstimation } from "./utils/hooks/useFeeEstimation";
import { useSendTransaction } from "./utils/hooks/transaction/useSendTransaction";
import { useRecipientHandlers } from "./utils/hooks/handlers/useRecipientHandlers";
import { useGeneralTransferHandlers } from "./utils/hooks/handlers/useGeneralTransferHandlers";
import { formatPrice } from "./utils/helpers/formatPrice";
import SimpleTransferButton from "./components/button";

const SimpleTransferComponent = () => {
  const theme = useTheme();
  const keyboard = useKeyboard();
  const network = useNetwork();
  const navigation = useTypedNavigation();
  const params: SimpleTransferParams | undefined = useParams();
  const route = useRoute();
  const knownWallets = KnownWallets(network.isTestnet);
  const safeArea = useSafeAreaInsets();
  const acc = useSelectedAccount();
  const client = useClient4(network.isTestnet);
  const [price, currency] = usePrice();
  const gaslessConfig = useGaslessConfig();
  const gaslessConfigLoading =
    gaslessConfig?.isFetching || gaslessConfig?.isLoading;

  // Ledger
  const isLedger = route.name === "LedgerSimpleTransfer";
  const ledgerContext = useLedgerTransport();
  const ledgerAddress = useMemo(() => {
    if (ledgerContext?.addr && isLedger) {
      try {
        return Address.parse(ledgerContext?.addr.address);
      } catch {}
    }
  }, [ledgerContext]);
  const address = isLedger ? ledgerAddress! : acc!.address;
  //

  const accountLite = useAccountLite(address);
  const { state, dispatch, amountRef, commentRef, scrollRef, estimationRef } =
    useSimpleTransferState(params);

  // jetton transfer params
  const jetton = useJetton({
    owner: address?.toString({ testOnly: network.isTestnet }),
    wallet: state.selectedJetton?.toString({ testOnly: network.isTestnet }),
  });
  const hasGaslessTransfer = gaslessConfig?.data?.gas_jettons
    .map((j) => {
      return Address.parse(j.master_id);
    })
    .some((j) => jetton?.master && j.equals(jetton.master));
  const symbol = jetton ? jetton.symbol : "TON";
  const { data: jettonPayload, loading: isJettonPayloadLoading } =
    useJettonPayload(
      address?.toString({ testOnly: network.isTestnet }),
      jetton?.master?.toString({ testOnly: network.isTestnet })
    );

  const balance = useMemo(() => {
    let value: bigint;
    if (jetton) {
      value = jetton.balance;
    } else {
      value = accountLite?.balance || 0n;
    }
    return value;
  }, [jetton, accountLite?.balance, isLedger]);

  const {
    targetAddressValid,
    validAmount,
    commentError,
    known,
    holdersTarget,
    amountError,
    shouldChangeJetton,
    onChangeJetton,
    shouldAddMemo,
  } = useTransferValidation({
    target: state.addressDomainInputState.target,
    amount: state.amount,
    jetton,
    commentString: state.commentString,
    address,
    balance,
    dispatch,
  });

  const priceText = useMemo(() => {
    return formatPrice(validAmount, price, currency);
  }, [validAmount, price, currency]);

  const { isSCAM } = useVerifyJetton({
    ticker: jetton?.symbol,
    master: jetton?.master?.toString({ testOnly: network.isTestnet }),
  });

  const callback: ((ok: boolean, result: Cell | null) => void) | null =
    params && params.callback ? params.callback : null;

  const order = useResolveOrder({
    estimationRef,
    validAmount,
    target: state.addressDomainInputState.target,
    domain: state.addressDomainInputState.domain,
    commentString: state.commentString,
    stateInit: state.stateInit,
    jetton,
    accountLite,
    ledgerAddress,
    isLedger,
    acc,
    known,
    jettonPayload,
    params,
    network,
  });

  const walletVersion = useWalletVersion();
  const isV5 = walletVersion === WalletVersions.v5R1;
  const supportsGaslessTransfer = hasGaslessTransfer && isV5;
  const estimation = useFeeEstimation({
    estimationRef,
    ledgerContext,
    stateInit: state.stateInit,
    order,
    client,
    commentString: state.commentString,
    ledgerAddress,
    walletVersion,
    supportsGaslessTransfer,
    jettonPayload,
    accountLite,
    network,
    isV5,
  });

  const estimationPrice = useMemo(() => {
    return formatPrice(estimation, price, currency);
  }, [price, currency, estimation]);

  const { handleQRCodeScan } = useRecipientHandlers({
    amount: state.amount,
    validAmount,
    addressDomainInputState: state.addressDomainInputState,
    stateInit: state.stateInit,
    commentString: state.commentString,
    selectedJetton: state.selectedJetton,
  });

  const hasParamsFilled = !!params.target && !!params.amount;
  const [selectedInput, setSelectedInput] = useState<number | null>(
    hasParamsFilled ? null : 0
  );

  const doSend = useSendTransaction({
    target: state.addressDomainInputState.target,
    order,
    validAmount,
    acc,
    walletVersion,
    network,
    isLedger,
    ledgerAddress,
    balance,
    commentString: state.commentString,
    supportsGaslessTransfer,
    callback,
    jetton,
  });

  const {
    onFocus,
    onSubmit,
    resetInput,
    onAddAll,
    onSearchItemSelected,
    handleClipboardData,
  } = useGeneralTransferHandlers({
    scrollRef,
    balance,
    jetton,
    dispatch,
    setSelectedInput,
    selectedInput,
    amountRef,
    commentRef,
  });

  const { selected, onNext, header } = useMemo(() => {
    const titleComponent = targetAddressValid && (
      <TransferHeader
        theme={theme}
        address={targetAddressValid.address}
        isTestnet={network.isTestnet}
        bounceable={targetAddressValid?.isBounceable}
        knownWallets={knownWallets}
      />
    );
    return resolveSelectedInputOptions({
      selectedInput,
      targetAddressValid,
      resetInput,
      titleComponent,
    });
  }, [selectedInput, targetAddressValid, validAmount, doSend, amountError]);

  const heightStyles = useMemo(() => {
    return {
      addressInputHeight: state.addressInputHeight,
      amountInputHeight: state.amountInputHeight,
    };
  }, [state]);

  const selectedInputStyles = useMemo(() => {
    return resolveSelectedInputStyles({
      selected,
      ...heightStyles,
    });
  }, [selected, heightStyles]);

  const continueDisabled =
    !order ||
    gaslessConfigLoading ||
    isJettonPayloadLoading ||
    shouldChangeJetton ||
    shouldAddMemo;
  const continueLoading = gaslessConfigLoading || isJettonPayloadLoading;

  const backHandler = useCallback(() => {
    if (selectedInput !== null) {
      setSelectedInput(null);
      return true;
    }
    return false;
  }, [selectedInput]);

  // Auto-cancel job
  useEffect(() => {
    return () => {
      if (params && params.callback) {
        params.callback(false, null);
      }
    };
  }, []);

  useEffect(() => {
    BackHandler.addEventListener("hardwareBackPress", backHandler);
    return () =>
      BackHandler.removeEventListener("hardwareBackPress", backHandler);
  }, [selectedInput, backHandler]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0 });
  }, [selectedInput]);

  useFocusEffect(() => {
    setStatusBarStyle(
      Platform.select({
        android: theme.style === "dark" ? "light" : "dark",
        ios: "light",
        default: "auto",
      })
    );
  });

  useAppFocusEffect(handleClipboardData);

  const scrollViewContentStyle = useMemo(
    () => ({
      ...styles.scrollViewContent,
      ...Platform.select({
        android: { minHeight: heightStyles.addressInputHeight },
      }),
    }),
    [heightStyles]
  );

  return (
    <View style={styles.container}>
      <StatusBar style={getStatusBarStyle(theme)} />
      <ScreenHeader
        title={header.title}
        onBackPressed={header?.onBackPressed}
        titleComponent={header.titleComponent}
        onClosePressed={navigation.goBack}
        style={Platform.select({
          android: { paddingTop: safeArea.top },
        })}
      />
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={scrollViewContentStyle}
        contentInset={getContentInset(keyboard)}
        contentInsetAdjustmentBehavior={"never"}
        keyboardShouldPersistTaps={"always"}
        automaticallyAdjustContentInsets={false}
        scrollEnabled={!selectedInput}
        nestedScrollEnabled={!selectedInput}
      >
        <SimpleTransferRecipient
          addressInputHeight={heightStyles.addressInputHeight}
          selectedInputStyles={selectedInputStyles}
          addressDomainInputState={state.addressDomainInputState}
          selected={selected}
          targetAddressValid={targetAddressValid}
          onFocus={onFocus}
          onSubmit={onSubmit}
          onQRCodeRead={handleQRCodeScan}
          onSearchItemSelected={onSearchItemSelected}
          selectedInput={selectedInput}
          dispatch={dispatch}
        />
        <SimpleTransferAmount
          onFocus={onFocus}
          amountError={amountError}
          holdersTarget={holdersTarget}
          shouldChangeJetton={shouldChangeJetton}
          onChangeJetton={onChangeJetton}
          priceText={priceText}
          amountRef={amountRef}
          amount={state.amount}
          onAddAll={onAddAll}
          balance={balance}
          symbol={symbol}
          address={address}
          selectedInputStyles={selectedInputStyles}
          isLedger={isLedger}
          isSCAM={isSCAM}
          dispatch={dispatch}
        />
        <SimpleTransferComment
          onFocus={onFocus}
          params={params}
          selectedInputStyles={selectedInputStyles}
          commentString={state.commentString}
          commentRef={commentRef}
          theme={theme}
          known={known}
          selected={selected}
          commentError={commentError}
          dispatch={dispatch}
        />
        <SimpleTransferFee
          selectedInputStyles={selectedInputStyles}
          estimation={estimation}
          estimationPrice={estimationPrice}
        />
        <View style={styles.spacer} />
      </ScrollView>
      <SimpleTransferButton
        continueDisabled={continueDisabled}
        continueLoading={continueLoading}
        doSend={doSend}
        selected={selected}
        onNext={onNext}
      />
    </View>
  );
};

export const SimpleTransferFragment = fragment(SimpleTransferComponent);
