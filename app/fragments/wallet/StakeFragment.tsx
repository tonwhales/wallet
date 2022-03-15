import { useNavigation } from "@react-navigation/native";
import BN from "bn.js";
import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppConfig } from "../../AppConfig";
import { AddressComponent } from "../../components/AddressComponent";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { StakingMemberComponent } from "../../components/StakingMemberComponent";
import { ValueComponent } from "../../components/ValueComponent";
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

    let startValidation = staking.startWorkTime;
    let endValidation = staking.startWorkTime + staking.validatorsElectedFor;
    let startElection = staking.startWorkTime - staking.electorsStartBefore;
    let endElection = staking.startWorkTime - staking.electorsEndBefore;
    let startNextElection = startElection + staking.validatorsElectedFor;
    let minStake = new BN(staking.validators[0].stake);
    let maxStake = new BN(staking.validators[0].stake);
    let sum = new BN(0);
    for (let val of staking.validators) {
        let stake = new BN(val.stake);
        minStake = BN.min(minStake, stake);
        maxStake = BN.max(maxStake, stake);
        sum = sum.add(stake);
    }
    let electionEntities = staking.electionEntities;
    electionEntities.sort((a, b) => new BN(b.amount).cmp(new BN(a.amount)));

    return (
        <View style={{
            flex: 1
        }}>
            {/* <AndroidToolbar style={{ marginTop: safeArea.top }} /> */}
            {member && (
                <StakingMemberComponent pool={pool} member={member} />
            )}
        </View>
    );
});

