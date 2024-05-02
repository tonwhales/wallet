import React, { memo, useMemo } from "react"
import { View } from "react-native";
import { useHoldersAccounts, useHoldersHiddenAccounts, useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { useHoldersHiddenPrepaidCards } from "../../engine/hooks/holders/useHoldersHiddenPrepaidCards";
import { HoldersAccounts } from "./HoldersAccounts";
import { HoldersCards } from "./HoldersCards";

export const HoldersProductComponent = memo(({ holdersAccStatus }: { holdersAccStatus?: HoldersAccountStatus }) => {
    const network = useNetwork();
    const theme = useTheme();
    const selected = useSelectedAccount();
    const accounts = useHoldersAccounts(selected!.address).data?.accounts;
    const prePaid = useHoldersAccounts(selected!.address).data?.prepaidCards;

    const [hiddenAccounts, markAccount] = useHoldersHiddenAccounts(selected!.address);
    const [hiddenPrepaidCards, markPrepaidCard] = useHoldersHiddenPrepaidCards(selected!.address);

    const visibleAccountsList = useMemo(() => {
        return (accounts ?? []).filter((item) => {
            return !hiddenAccounts.includes(item.id);
        });
    }, [hiddenAccounts, accounts]);

    const visiblePrepaidList = useMemo(() => {
        return (prePaid ?? []).filter((item) => {
            return !hiddenPrepaidCards.includes(item.id);
        });
    }, [hiddenPrepaidCards, prePaid]);

    if (visibleAccountsList?.length === 0 && visiblePrepaidList?.length === 0) {
        return null;
    }

    return (
        <View style={{ marginBottom: 16 }}>
            <HoldersAccounts theme={theme} isTestnet={network.isTestnet} markCard={markAccount} accs={visibleAccountsList} />
            <HoldersCards theme={theme} isTestnet={network.isTestnet} markPrepaidCard={markPrepaidCard} cards={visiblePrepaidList} />
        </View>
    );
});