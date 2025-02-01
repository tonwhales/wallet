import React, { useMemo } from "react";
import { View, Text } from "react-native";
import Animated from "react-native-reanimated";
import { AboutIconButton } from "../../../../../components/AboutIconButton";
import { t } from "../../../../../i18n/t";
import { Typography } from "../../../../../components/styles";
import { formatAmount } from "../../../../../utils/formatCurrency";
import { fromNano } from "@ton/core";
import { useTheme } from "../../../../../engine/hooks";
import { SimpleTransferInputStyles } from "../../types/SimpleTransferInputStyles";
import { styles } from "./styles";
import { animatedLayout } from "../../styles";

interface Props {
  estimation: bigint | null;
  estimationPrice?: string;
  selectedInputStyles: SimpleTransferInputStyles;
}

export const SimpleTransferFee: React.FC<Props> = ({
  selectedInputStyles,
  estimation,
  estimationPrice,
}) => {
  const theme = useTheme();

  const estimationText = useMemo(() => {
    if (estimation) {
      return <>{`${formatAmount(fromNano(estimation))} TON`}</>;
    } else {
      return "...";
    }
  }, [estimation]);

  const estimationPriceText = useMemo(() => {
    if (!!estimationPrice) {
      return (
        <Text style={[{ color: theme.textSecondary }, Typography.regular17_24]}>
          {` (${estimationPrice})`}
        </Text>
      );
    } else {
      return <></>;
    }
  }, [estimationPrice, theme]);

  if (!!estimation) {
    return (
      <View style={styles.wrapper}>
        <Animated.View
          layout={animatedLayout}
          style={[selectedInputStyles.fees, { flex: 1 }]}
        >
          <View
            style={[
              styles.container,
              {
                backgroundColor: theme.surfaceOnElevation,
              },
            ]}
          >
            <View>
              <Text
                style={[
                  styles.feeText,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                {t("txPreview.blockchainFee")}
              </Text>
              <Text
                style={[{ color: theme.textPrimary }, Typography.regular17_24]}
              >
                {estimationText}
                {estimationPriceText}
              </Text>
            </View>
            <AboutIconButton
              title={t("txPreview.blockchainFee")}
              description={t("txPreview.blockchainFeeDescription")}
              style={styles.icon}
              size={24}
            />
          </View>
        </Animated.View>
      </View>
    );
  } else {
    return null;
  }
};
