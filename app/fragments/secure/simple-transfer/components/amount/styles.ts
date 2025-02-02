import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
  },
  container: {
    borderRadius: 20,
    justifyContent: "center",
    padding: 20,
  },
  rowSpaceBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowFlexShrink: {
    flexDirection: "row",
    flexShrink: 1,
    overflow: "visible",
  },
  iconWrapper: {
    height: 46,
    width: 46,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  icon: {
    height: 46,
    width: 46,
  },
  chevron: {
    height: 12,
    width: 12,
  },
  balanceContainer: {
    flexDirection: "row",
    marginBottom: 12,
    justifyContent: "space-between",
  },
  amountInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  errorContainer: {
    flexDirection: "row",
    marginTop: 8,
    gap: 4,
  },
});
