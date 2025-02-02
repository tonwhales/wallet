import React, { Dispatch, useCallback, useMemo, useState } from "react";
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  LinearTransition,
} from "react-native-reanimated";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useJetton, useNetwork, useTheme } from "../../../../../engine/hooks";
import { useTypedNavigation } from "../../../../../utils/useTypedNavigation";
import { Address } from "@ton/core";
import { AssetViewType } from "../../../../wallet/AssetsFragment";
import { JettonIcon } from "../../../../../components/products/JettonIcon";
import { mapJettonToMasterState } from "../../../../../utils/jettons/mapJettonToMasterState";
import { Typography } from "../../../../../components/styles";
import { ItemDivider } from "../../../../../components/ItemDivider";
import { ValueComponent } from "../../../../../components/ValueComponent";
import { t } from "../../../../../i18n/t";
import { formatInputAmount } from "../../../../../utils/formatCurrency";
import { AmountInput } from "../../../../../components/input/AmountInput";
import { PressableChip } from "../../../../../components/PressableChip";
import IcChevron from "@assets/ic_chevron_forward.svg";
import {
  SimpleTransferAction,
  SimpleTransferActions,
} from "../../utils/hooks/state/useSimpleTransferState";
import { styles } from "./styles";
import { animatedLayout } from "../../styles";

const changeJettonLayout = LinearTransition.duration(200).easing(
  Easing.bezierFn(0.25, 0.1, 0.25, 1)
);

type Props = {
  onFocus: (index: number) => void;
  onChangeJetton: () => void;
  holdersTarget?: { symbol: string };
  shouldChangeJetton?: boolean;
  priceText?: string;
  amountError?: string;
  amountRef: React.RefObject<any>;
  amount: string;
  onAddAll: () => void;
  balance: bigint;
  symbol: string;
  isSCAM?: boolean;
  address?: Address;
  selectedInputStyles: {
    amount?: any;
  };
  isLedger?: boolean;
  dispatch: Dispatch<SimpleTransferAction>;
};

export default function SimpleTransferAmount({
  onFocus,
  onChangeJetton,
  holdersTarget,
  shouldChangeJetton,
  priceText,
  amountError,
  amountRef,
  amount,
  onAddAll,
  balance,
  symbol,
  isSCAM,
  address,
  selectedInputStyles,
  isLedger,
  dispatch,
}: Props) {
  const theme = useTheme();
  const navigation = useTypedNavigation();
  const network = useNetwork();
  const [selectedJetton, setJetton] = useState<Address | null>();

  const jetton = useJetton({
    owner: address?.toString({ testOnly: network.isTestnet }) || "",
    wallet: selectedJetton?.toString({ testOnly: network.isTestnet }),
  });

  const ticket = jetton ? jetton.symbol : "TON";
  const decimals = jetton ? jetton.decimals : undefined;
  const suffix = jetton ? ` ${jetton.symbol}` : "";

  const onAssetSelected = useCallback(
    (selected?: { master: Address; wallet?: Address }) => {
      if (selected && selected.wallet) {
        setJetton(selected.wallet);
        return;
      }
      setJetton(null);
    },
    []
  );

  const onValueChange = useCallback(
    (newVal: string) => {
      const formatted = formatInputAmount(
        newVal,
        jetton?.decimals ?? 9,
        { skipFormattingDecimals: true },
        amount
      );
      dispatch({ type: SimpleTransferActions.SET_AMOUNT, payload: formatted });
    },
    [jetton, amount]
  );

  const assetIcon = useMemo(() => {
    if (!!jetton) {
      return (
        <JettonIcon
          isTestnet={network.isTestnet}
          theme={theme}
          size={46}
          jetton={mapJettonToMasterState(jetton, network.isTestnet)}
          backgroundColor={theme.elevation}
          isSCAM={isSCAM}
        />
      );
    } else {
      return (
        <Image source={require("@assets/ic-ton-acc.png")} style={styles.icon} />
      );
    }
  }, [jetton, network, isSCAM, theme]);

  const onAssetPressed = useCallback(() => {
    navigation.navigateAssets({
      jettonCallback: onAssetSelected,
      selectedAsset: jetton?.master,
      viewType: AssetViewType.Transfer,
      isLedger,
    });
  }, [jetton, isLedger, onAssetSelected]);

  return (
    <View style={styles.wrapper}>
      <Animated.View
        layout={animatedLayout}
        style={[selectedInputStyles.amount, { flex: 1 }]}
        onLayout={(e) =>
          dispatch({
            type: SimpleTransferActions.SET_AMOUNT_INPUT_HEIGHT,
            payload: e.nativeEvent.layout.height,
          })
        }
      >
        <View
          style={[
            styles.container,
            { backgroundColor: theme.surfaceOnElevation },
          ]}
        >
          <Pressable
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            onPress={onAssetPressed}
          >
            <View style={styles.rowSpaceBetween}>
              <View style={styles.rowFlexShrink}>
                <View style={styles.iconWrapper}>{assetIcon}</View>
                <View
                  style={{
                    justifyContent: isSCAM ? "space-between" : "center",
                    flexShrink: 1,
                  }}
                >
                  <Text
                    style={[
                      { color: theme.textPrimary },
                      Typography.semiBold17_24,
                    ]}
                    numberOfLines={2}
                    ellipsizeMode={"tail"}
                  >
                    {symbol}
                  </Text>
                  {isSCAM && (
                    <Text
                      style={{ flexShrink: 1 }}
                      numberOfLines={4}
                      ellipsizeMode={"tail"}
                    >
                      <Text
                        style={[
                          { color: theme.accentRed },
                          Typography.regular15_20,
                        ]}
                        selectable={false}
                      >
                        {"SCAM"}
                      </Text>
                    </Text>
                  )}
                </View>
              </View>
              <IcChevron style={styles.chevron} height={12} width={12} />
            </View>
          </Pressable>
          <ItemDivider marginHorizontal={0} />
          <View style={styles.balanceContainer}>
            <Text
              style={[{ color: theme.textSecondary }, Typography.regular15_20]}
            >
              {`${t("common.balance")}: `}
              <ValueComponent
                precision={4}
                value={balance}
                decimals={decimals}
                suffix={suffix}
              />
            </Text>
            <Pressable
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              onPress={onAddAll}
            >
              <Text style={[{ color: theme.accent }, Typography.medium15_20]}>
                {t("transfer.sendAll")}
              </Text>
            </Pressable>
          </View>
          <AmountInput
            index={1}
            ref={amountRef}
            onFocus={() => onFocus(1)}
            value={amount}
            onValueChange={onValueChange}
            style={[
              styles.amountInput,
              {
                backgroundColor: theme.elevation,
              },
            ]}
            inputStyle={[
              {
                color: amountError ? theme.accentRed : theme.textPrimary,
                flexGrow: 1,
              },
              Typography.regular17_24,
              { lineHeight: undefined },
            ]}
            suffix={priceText}
            ticker={ticket}
            cursorColor={theme.accent}
          />
          <View style={styles.errorContainer}>
            {amountError && (
              <Animated.View
                style={{ flexShrink: 1 }}
                entering={FadeIn}
                exiting={FadeOut.duration(100)}
              >
                <Text
                  style={[
                    { color: theme.accentRed, flexShrink: 1 },
                    Typography.regular13_18,
                  ]}
                >
                  {amountError}
                </Text>
              </Animated.View>
            )}
            {shouldChangeJetton && (
              <Animated.View
                entering={FadeInUp}
                exiting={FadeOutDown}
                layout={changeJettonLayout}
              >
                <PressableChip
                  text={t("transfer.changeJetton", {
                    symbol: holdersTarget?.symbol,
                  })}
                  style={{ backgroundColor: theme.accent }}
                  textStyle={{ color: theme.textUnchangeable }}
                  onPress={onChangeJetton}
                />
              </Animated.View>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
