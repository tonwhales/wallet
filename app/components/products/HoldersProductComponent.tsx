import React, { memo, useMemo } from "react"
import { HoldersAccountItem } from "./HoldersAccountItem";
import { View } from "react-native";
import { useHoldersAccounts, useHoldersHiddenAccounts, useNetwork, useSelectedAccount } from "../../engine/hooks";

import Hide from '@assets/ic-hide.svg';

export const HoldersProductComponent = memo(() => {
    const network = useNetwork();
    const selected = useSelectedAccount();
    const accounts = useHoldersAccounts(selected!.address).data?.accounts;
    const [hiddenCards, markCard] = useHoldersHiddenAccounts(selected!.address);
    const visibleList = useMemo(() => {
        return (accounts ?? []).filter((item) => {
            return !hiddenCards.includes(item.id);
        });
    }, [hiddenCards, accounts]);

    if (!network.isTestnet) {
        return null;
    }

    if (!accounts || accounts?.length === 0) {
        return null;
    }

    return (
        <View style={{ marginBottom: visibleList.length > 0 ? 16 : 0 }}>
            {visibleList.map((item, index) => {
                return (
                    <HoldersAccountItem
                        key={`card-${index}`}
                        account={item}
                        first={index === 0}
                        last={index === visibleList.length - 1}
                        rightAction={() => markCard(item.id, true)}
                        rightActionIcon={<Hide height={36} width={36} style={{ width: 36, height: 36 }} />}
                        single={visibleList.length === 1}
                    />
                )
            })}
        </View>
    );
})