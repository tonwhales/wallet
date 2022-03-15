import BN from "bn.js";
import React from "react";
import { useTranslation } from "react-i18next";
import { View, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddressComponent } from "../../components/AddressComponent";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { ValueComponent } from "../../components/ValueComponent";
import { fragment } from "../../fragment";
import { useAccount } from "../../sync/Engine";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

export const StakeFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const [account, engine] = useAccount();
    const staking = engine.products.stake.useState();
    const pool = engine.products.stakingPool.useState();

    console.log({ staking, pool });

    if (!staking || !pool) {
        return <></>
    }

    // const response = useStaking();
    // const pool = useStakingPool();
    // const pools = pool.data;

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
            <AndroidToolbar style={{ marginTop: safeArea.top }} />
            {Platform.OS === 'ios' && (
                <View style={{
                    paddingTop: 12,
                    paddingBottom: 17
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        marginLeft: 17,
                        fontSize: 17
                    }, { textAlign: 'center' }]}>{t('stake.title')}</Text>
                </View>
            )}
            <Text style={{ alignSelf: 'center', marginTop: 5, marginHorizontal: 16, fontWeight: '800', fontSize: 26 }}>
                {'[TESTNET] Whales Nominator Pool #2'}
            </Text>
            <View>
                <Text>Pool Address: <AddressComponent address={pool.address} /></Text>
                <Text>Worker Address: <AddressComponent address={pool.proxy} /></Text>
                <Text>Status: {pool.locked ? (pool.readyToUnlock ? '💸 Recovering stake' : '🔨 Stake sent to elector') : '💨 Cooldown'}</Text>
                <Text>Accepting new stakes: {pool.enabled ? '✅ Yes!' : '⚠️ Suspended'}</Text>
                <Text>Contract upgrades: {pool.upgradesEnabled ? '⚠️ Enabled' : '✅ Disabled'}</Text>
                <Text>Pool fee: {pool.poolFee + '%'}</Text>
                <Text>Min deposit: <ValueComponent value={pool.minStake.add(pool.receiptPrice).add(pool.depositFee)} /> (including deposit fee)</Text>
                <Text>Deposit fee: <ValueComponent value={pool.depositFee.add(pool.receiptPrice)} /></Text>
                <Text>Withdraw fee: <ValueComponent value={pool.withdrawFee.add(pool.receiptPrice)} /></Text>
                <Text>Total balance: <ValueComponent value={pool.balance} /></Text>
                <Text>Balance sent: <ValueComponent value={pool.balanceSent} /></Text>
                <Text>Pending desposits: <ValueComponent value={pool.balancePendingDeposits} /></Text>
                <Text>Pending withdrawals: <ValueComponent value={pool.balancePendingWithdrawals} /></Text>
                <Text>Weight: {(pool.validatorWeight * 100).toFixed(4) + '%'}</Text>
                <Text>Bonuses in current round: <ValueComponent value={pool.validatorBonuses} /></Text>
                <Text>Balance drift: <ValueComponent value={pool.balanceDrift} /></Text>
            </View>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    );
});

