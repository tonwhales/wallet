import { StyleSheet } from "react-native";
import { ThemeType } from "../../../engine/state/theme";
import {Easing, LinearTransition} from "react-native-reanimated";

type Keyboard = {
  keyboardShown: boolean;
  keyboardHeight: number;
};

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  scrollView: {
    flexGrow: 1,
    flexBasis: 0,
    alignSelf: "stretch",
    marginTop: 16,
  },
  scrollViewContent: {
    marginHorizontal: 16,
    flexGrow: 1,
  },
  spacer: {
    height: 56,
  },
});

export const getStatusBarStyle = (theme: ThemeType) =>
  theme.style === "dark" ? "light" : "dark";
export const getContentInset = (keyboard: Keyboard) => ({
  bottom: keyboard.keyboardShown ? keyboard.keyboardHeight - 86 - 32 : 0.1, // Fix for iOS bug
  top: 0.1,
});
export const animatedLayout = LinearTransition.duration(300).easing(
    Easing.bezierFn(0.25, 0.1, 0.25, 1)
)
