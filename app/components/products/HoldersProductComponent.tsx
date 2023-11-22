import React, { memo, useMemo } from "react"
import { HoldersAccountItem } from "./HoldersAccountItem";
import { View } from "react-native";
import { useHoldersAccountStatus, useHoldersAccounts, useHoldersHiddenAccounts, useNetwork, useSelectedAccount } from "../../engine/hooks";
import { HoldersAccountState } from "../../engine/api/holders/fetchAccountState";

import Hide from '@assets/ic-hide.svg';

export const HoldersProductComponent = memo(() => {
    const network = useNetwork();
    const selected = useSelectedAccount();
    const holdersAccStatus = useHoldersAccountStatus(selected!.address).data;
    const accounts = useHoldersAccounts(selected!.address).data?.accounts;
    const [hiddenCards, markCard] = useHoldersHiddenAccounts(selected!.address);
    const visibleList = useMemo(() => {
        return (accounts ?? []).filter((item) => {
            return !hiddenCards.includes(item.id);
        });
    }, [hiddenCards, accounts]);

    const needsEnrolment = useMemo(() => {
        if (holdersAccStatus?.state === HoldersAccountState.NeedEnrollment) {
            return true;
        }
        return false;
    }, [holdersAccStatus]);

    if (!network.isTestnet) {
        return null;
    }

    if (accounts?.length === 0) {
        return null;
    }

    return (
        <View style={{ marginVertical: 16 }}>
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