import { Address } from "@ton/core";
import { ReactNode } from "react";
import { t } from "../../../../../i18n/t";

type SelectedInputOptionsResponse = {
  selected: "amount" | "address" | "comment" | null;
  onNext: (() => void) | null;
  header: HeaderOptions;
};

type SelectedInputOptionsProps = {
  selectedInput: number | null;
  targetAddressValid: {
    address: Address;
  } | null;
  titleComponent: ReactNode;
  resetInput: () => void;
};

type HeaderOptions = {
  onBackPressed?: () => void;
  title?: string;
  rightButton?: ReactNode;
  titleComponent?: ReactNode;
};

const DEFAULT_HEADER: HeaderOptions = {
  title: t("transfer.title"),
};

const getHeaderTitle = (
  targetAddressValid: {
    address: Address;
  } | null,
  titleComponent: ReactNode
): HeaderOptions =>
  targetAddressValid ? { titleComponent } : { ...DEFAULT_HEADER };

export const resolveSelectedInputOptions = (
  props: SelectedInputOptionsProps
): SelectedInputOptionsResponse => {
  const { selectedInput, targetAddressValid, resetInput, titleComponent } =
    props;
  const header = getHeaderTitle(targetAddressValid, titleComponent);

  if (selectedInput === null) {
    return { selected: null, onNext: null, header: DEFAULT_HEADER };
  }

  switch (selectedInput) {
    case 0:
      return {
        selected: "address",
        onNext: targetAddressValid ? resetInput : null,
        header: { title: t("common.recipient") },
      };
    case 1:
      return { selected: "amount", onNext: resetInput, header };
    case 2:
      return { selected: "comment", onNext: resetInput, header };
    default:
      return { selected: null, onNext: null, header };
  }
};
