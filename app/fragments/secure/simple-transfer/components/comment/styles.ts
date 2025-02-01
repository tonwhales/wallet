import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  wrapper: { marginTop: 16 },
  commentDescription: { paddingHorizontal: 16, marginTop: 2 },
  input: { flexShrink: 1, textAlignVertical: "center" },
  inputPadding: { paddingHorizontal: 16 },
  inputContainer: {
    paddingVertical: 20,
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
  },
  commentErrorContainer: { marginTop: 2, marginLeft: 16 },
});
