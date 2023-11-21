import React, { memo, useCallback, useEffect, useMemo, useState } from "react"
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { extractDomain } from "../../engine/utils/extractDomain";
import { HoldersAccountItem } from "./HoldersAccountItem";
import { View } from "react-native";
import { interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useHoldersAccountStatus, useHoldersAccounts, useHoldersHiddenAccounts, useNetwork, useSelectedAccount, useStaking } from "../../engine/hooks";
import { HoldersAccountState, holdersUrl } from "../../engine/api/holders/fetchAccountState";
import { getDomainKey } from "../../engine/state/domainKeys";

import Hide from '@assets/ic-hide.svg';

export const HoldersProductComponent = memo(() => {
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const holdersAccStatus = useHoldersAccountStatus(selected!.address).data;
    const accounts = useHoldersAccounts(selected!.address).data?.accounts;
    const [hiddenCards, markCard] = useHoldersHiddenAccounts(selected!.address);
    const visibleList = useMemo(() => {
        return (accounts ?? []).filter((item) => {
            return !hiddenCards.includes(item.id);
        });
    }, [hiddenCards, accounts]);

    const staking = useStaking();

    const [collapsed, setCollapsed] = useState(true);

    const rotation = useSharedValue(0);

    const animatedChevron = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, -180])}deg` }],
        }
    }, []);

    useEffect(() => {
        rotation.value = withTiming(collapsed ? 0 : 1, { duration: 150 });
    }, [collapsed])

    const needsEnrolment = useMemo(() => {
        if (holdersAccStatus?.state === HoldersAccountState.NeedEnrollment) {
            return true;
        }
        return false;
    }, [holdersAccStatus]);

    const collapsedBorderStyle = useAnimatedStyle(() => {
        return {
            borderBottomEndRadius: withTiming((collapsed ? 20 : 0), { duration: 250 }),
            borderBottomStartRadius: withTiming((collapsed ? 20 : 0), { duration: 250 }),
        }
    });

    const onPress = useCallback(() => {
        const domain = extractDomain(holdersUrl);
        const domainKey = getDomainKey(domain);
        if (needsEnrolment || !domainKey) {
            navigation.navigate(
                'HoldersLanding',
                {
                    endpoint: holdersUrl,
                    onEnrollType: { type: 'account' }
                }
            );
            return;
        }
        navigation.navigateHolders({ type: 'account' });
    }, [needsEnrolment]);

    if (!network.isTestnet) {
        return null;
    }

    if (accounts?.length === 0) {
        return null;
    }

    return (
        <View style={{ marginTop: 16 }}>
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