import { SimpleTransferInputStyles } from "../../types/SimpleTransferInputStyles";

type InputStylesProps = {
  selected: string | null;
  addressInputHeight: number;
  amountInputHeight: number;
};

export const resolveSelectedInputStyles = (
  props: InputStylesProps
): SimpleTransferInputStyles => {
  const { selected, addressInputHeight, amountInputHeight } = props;

  switch (selected) {
    case "address":
      return {
        address: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          opacity: 1,
          zIndex: 1,
        },
        amount: { opacity: 0, pointerEvents: "none", height: 0 },
        comment: { opacity: 0, pointerEvents: "none", height: 0 },
        fees: { opacity: 0, height: 0 },
      };
    case "amount":
      return {
        address: { opacity: 0, pointerEvents: "none" },
        amount: {
          position: "relative",
          top: -addressInputHeight - 16,
          left: 0,
          right: 0,
          opacity: 1,
          zIndex: 1,
        },
        comment: { opacity: 0, pointerEvents: "none" },
        fees: { opacity: 0, pointerEvents: "none" },
      };
    case "comment":
      return {
        address: { opacity: 0, pointerEvents: "none" },
        amount: { opacity: 0, pointerEvents: "none" },
        comment: {
          position: "absolute",
          top: -addressInputHeight - amountInputHeight - 32,
          left: 0,
          right: 0,
          opacity: 1,
          zIndex: 1,
        },
        fees: { opacity: 0 },
      };
    default:
      return {
        address: { opacity: 1 },
        amount: { opacity: 1 },
        comment: { opacity: 1 },
        fees: { opacity: 1 },
      };
  }
};
