import { useNavigation } from "@react-navigation/native";
import BN from "bn.js";
import React from "react";
import { useTranslation } from "react-i18next";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppConfig } from "../../AppConfig";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { StakingJoinComponent } from "../../components/Staking/StakingJoinComponent";
import { StakingMemberComponent } from "../../components/Staking/StakingMemberComponent";
import { fragment } from "../../fragment";
import { getCurrentAddress } from "../../storage/appState";
import { useAccount } from "../../sync/Engine";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

export const StakeFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const baseNavigation = useNavigation();
    const [account, engine] = useAccount();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const staking = engine.products.stake.useState();
    const pool = engine.products.stakingPool.useState();

    if (!staking || !pool) {
        return (
            <View style={{ flexGrow: 1, flexBasis: 0, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
                <LoadingIndicator />
                <Text style={{ marginTop: 16, fontSize: 24, marginHorizontal: 16 }}>{t('stake.sync')}</Text>
            </View>
        );
    }

    const member = pool
        .members
        .find((m) => {
            return m.address
                .toFriendly({ testOnly: AppConfig.isTestnet }) === address
                    .toFriendly({ testOnly: AppConfig.isTestnet })
        });

    console.log({ staking, pool, joined: member });

    let minStake = new BN(staking.validators[0].stake);
    let maxStake = new BN(staking.validators[0].stake);

    return (
        <View style={{
            flex: 1
        }}>
            <AndroidToolbar style={{ marginTop: safeArea.top }} />
            {!member && (
                <StakingJoinComponent pool={pool} />
            )}
            {member && (
                <StakingMemberComponent pool={pool} member={member} />
            )}
        </View>
    );
});

