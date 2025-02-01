import React from "react";
import { KeyboardAvoidingView, Platform, ViewStyle } from "react-native";
import { RoundButton } from "../../../../../components/RoundButton";
import { t } from "../../../../../i18n/t";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SimpleTransferInputType } from "../../types/SimpleTransferInputType";
import { styles } from "./styles";

type Props = {
  continueDisabled: boolean;
  continueLoading: boolean;
  doSend: () => Promise<any>;
  selected: SimpleTransferInputType;
  onNext: (() => void) | null;
};

export default function SimpleTransferButton({
  continueDisabled,
  continueLoading,
  doSend,
  selected,
  onNext,
}: Props) {
  const safeArea = useSafeAreaInsets();
  const keyboardVerticalOffset = Platform.OS === "ios" ? safeArea.top + 32 : 0;
  const marginBottom: ViewStyle = {
    marginBottom:
      Platform.OS === "ios" ? safeArea.bottom + 32 : safeArea.bottom + 16,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "position" : undefined}
      style={[styles.container, marginBottom]}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {!!selected ? (
        <RoundButton
          title={t("common.save")}
          disabled={!onNext}
          onPress={onNext ? onNext : undefined}
        />
      ) : (
        <RoundButton
          disabled={continueDisabled}
          loading={continueLoading}
          title={t("common.continue")}
          action={doSend}
        />
      )}
    </KeyboardAvoidingView>
  );
}
