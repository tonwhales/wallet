import { memo, useCallback } from "react";
import { Jetton } from "../../engine/types";
import { ThemeType } from "../../engine/state/theme";
import { Address } from "@ton/core";
import { JettonProductItem } from "../products/JettonProductItem";

export const AssetsListItem = memo(({
    wallet,
    owner,
    onSelect,
    selected,
    hideSelection,
    isTestnet,
    theme
}: {
    wallet: Address,
    owner: Address,
    onSelect: (j: Jetton) => void,
    selected?: Address,
    hideSelection?: boolean,
    isTestnet: boolean,
    theme: ThemeType
}) => {

    const selectedFn = useCallback((j: Jetton) => {
        return j.master.toString({ testOnly: isTestnet }) === selected?.toString({ testOnly: isTestnet })
    }, [selected, isTestnet]);

    return (
        <JettonProductItem
            wallet={wallet}
            owner={owner}
            card
            selectParams={{
                onSelect,
                selectedFn,
                hideSelection
            }}
            hideIfEmpty
            itemStyle={{
                backgroundColor: theme.surfaceOnElevation
            }}
        />
    );
});