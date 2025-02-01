import React, { Dispatch, useMemo } from "react";
import { View, Text } from "react-native";
import Animated, {
  LinearTransition,
  FadeInUp,
  FadeOutDown,
  Easing,
} from "react-native-reanimated";
import { Typography } from "../../../../../components/styles";
import { ATextInput } from "../../../../../components/ATextInput";
import { t } from "../../../../../i18n/t";
import { SimpleTransferInputType } from "../../types/SimpleTransferInputType";
import { SimpleTransferParams } from "../../types/SimpleTransferParams";
import { SimpleTransferInputStyles } from "../../types/SimpleTransferInputStyles";
import {
  SimpleTransferAction,
  SimpleTransferActions,
} from "../../utils/hooks/state/useSimpleTransferState";
import { styles } from "./styles";
import { animatedLayout } from "../../styles";

interface Props {
  commentString: string;
  commentRef: any;
  theme: any;
  known: any;
  selected: SimpleTransferInputType;
  commentError?: string;
  params: SimpleTransferParams;
  onFocus: (index: number) => void;
  dispatch: Dispatch<SimpleTransferAction>;
  selectedInputStyles: SimpleTransferInputStyles;
}

export const SimpleTransferComment: React.FC<Props> = ({
  params,
  onFocus,
  selectedInputStyles,
  commentString,
  commentRef,
  theme,
  known,
  selected,
  commentError,
  dispatch,
}) => {
  const payload = params.payload ?? null;

  const onValueChange = (value: string) => {
    dispatch({ type: SimpleTransferActions.SET_COMMENT, payload: value });
  };

  const commentErrorMessage = useMemo(() => {
    if (!!commentError) {
      return (
        <Animated.View
          style={styles.commentErrorContainer}
          entering={FadeInUp}
          exiting={FadeOutDown}
          layout={LinearTransition.duration(200).easing(
            Easing.bezierFn(0.25, 0.1, 0.25, 1)
          )}
        >
          <Text style={[{ color: theme.accentRed }, Typography.regular13_18]}>
            {commentError}
          </Text>
        </Animated.View>
      );
    } else if (selected === "comment" && !known) {
      return (
        <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
          <Text
            style={[
              {
                color: theme.textSecondary,
              },
              styles.commentDescription,
              Typography.regular13_18,
            ]}
          >
            {t("transfer.commentDescription")}
          </Text>
        </Animated.View>
      );
    } else {
      return <></>;
    }
  }, [theme, commentError]);

  return (
    <View style={styles.wrapper}>
      <Animated.View
        layout={animatedLayout}
        style={[selectedInputStyles.comment, { flex: 1 }]}
      >
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.surfaceOnElevation,
              paddingHorizontal:
                commentString.length > 0 && selected !== "comment" ? 4 : 0,
            },
          ]}
        >
          {payload ? (
            <Text
              style={[
                { color: theme.textPrimary, marginHorizontal: 16 },
                Typography.regular17_24,
              ]}
            >
              {t("transfer.smartContract")}
            </Text>
          ) : (
            <ATextInput
              value={commentString}
              index={2}
              ref={commentRef}
              onFocus={onFocus}
              onValueChange={onValueChange}
              placeholder={
                !!known ? t("transfer.commentRequired") : t("transfer.comment")
              }
              keyboardType={"default"}
              autoCapitalize={"sentences"}
              label={
                !!known ? t("transfer.commentRequired") : t("transfer.comment")
              }
              style={styles.inputPadding}
              inputStyle={[
                {
                  color: theme.textPrimary,
                },
                styles.input,
                Typography.regular17_24,
              ]}
              multiline
              cursorColor={theme.accent}
            />
          )}
        </View>
        {commentErrorMessage}
      </Animated.View>
    </View>
  );
};
