import { memo } from "react";
import { ThemeType } from "../../../engine/state/theme";
import { TypedNavigation } from "../../../utils/useTypedNavigation";
import { HoldersTransaction } from "../../../engine/types";

export const HoldersTransactionView = memo(({ }: {
    tx: HoldersTransaction,
    theme: ThemeType,
    navigation: TypedNavigation,
}) => {

    return (
        null
    );
});