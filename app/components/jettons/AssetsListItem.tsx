import { memo, useCallback } from "react";
import { ThemeType } from "../../engine/state/theme";
import { Address } from "@ton/core";
import { JettonProductItem } from "../products/JettonProductItem";
import { JettonFull } from "../../engine/api/fetchHintsFull";

export const AssetsListItem = memo(({
    hint,
    owner,
    onSelect,
    selected,
    hideSelection,
    isTestnet,
    theme
}: {
    hint: JettonFull,
    owner: Address,
    onSelect: (j: JettonFull) => void,
    selected?: Address,
    hideSelection?: boolean,
    isTestnet: boolean,
    theme: ThemeType
}) => {

    const selectedFn = useCallback((h: JettonFull) => {
        return h.jetton.address === selected?.toString({ testOnly: isTestnet })
    }, [selected, isTestnet]);

    return (
        <JettonProductItem
            hint={hint}
            owner={owner}
            card
            selectParams={{
                onSelect,
                selectedFn,
                hideSelection
            }}
            itemStyle={{
                backgroundColor: theme.surfaceOnElevation
            }}
        />
    );
});