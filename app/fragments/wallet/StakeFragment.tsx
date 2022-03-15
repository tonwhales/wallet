import React from "react";
import { useTranslation } from "react-i18next";
import { View, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddressComponent } from "../../components/AddressComponent";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { ValueComponent } from "../../components/ValueComponent";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

export const StakeFragment = fragment(() => {
    const { t } = useTranslation();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    const response = useStaking();
    const pool = useStakingPool();
    if (!response.data || !pool.data) {
        return <ActivityIndicator />;
    }
    const data = response.data;
    const pools = pool.data;

    let startValidation = data.startWorkTime;
    let endValidation = data.startWorkTime + data.validatorsElectedFor;
    let startElection = data.startWorkTime - data.electorsStartBefore;
    let endElection = data.startWorkTime - data.electorsEndBefore;
    let startNextElection = startElection + data.validatorsElectedFor;
    let minStake = new BN(data.validators[0].stake);
    let maxStake = new BN(data.validators[0].stake);
    let sum = new BN(0);
    for (let val of data.validators) {
        let stake = new BN(val.stake);
        minStake = BN.min(minStake, stake);
        maxStake = BN.max(maxStake, stake);
        sum = sum.add(stake);
    }
    let electionEntities = data.electionEntities;
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
                <Text>Pool Address: <AddressComponent address={p.address} /></Text>
                <Text>Worker Address: <AddressComponent address={p.proxy} /></Text>
                <Text>Status: {p.locked ? (p.readyToUnlock ? '💸 Recovering stake' : '🔨 Stake sent to elector') : '💨 Cooldown'}</Text>
                <Text>Accepting new stakes: {p.enabled ? '✅ Yes!' : '⚠️ Suspended'}</Text>
                <Text>Contract upgrades: {p.upgradesEnabled ? '⚠️ Enabled' : '✅ Disabled'}</Text>
                <Text>Pool fee: {p.poolFee + '%'}</Text>
                <Text>Min deposit: <ValueComponent value={p.minStake.add(p.receiptPrice).add(p.depositFee)} /> (including deposit fee)</Text>
                <Text>Deposit fee: <ValueComponent value={p.depositFee.add(p.receiptPrice)} /></Text>
                <Text>Withdraw fee: <ValueComponent value={p.withdrawFee.add(p.receiptPrice)} /></Text>
                <Text>Total balance: <ValueComponent value={p.balance} /></Text>
                <Text>Balance sent: <ValueComponent value={p.balanceSent} /></Text>
                <Text>Pending desposits: <ValueComponent value={p.balancePendingDeposits} /></Text>
                <Text>Pending withdrawals: <ValueComponent value={p.balancePendingWithdrawals} /></Text>
                <Text>Weight: {(p.validatorWeight * 100).toFixed(4) + '%'}</Text>
                <Text>Bonuses in current round: <ValueComponent value={p.validatorBonuses} /></Text>
                <Text>Balance drift: <ValueComponent value={p.balanceDrift} /></Text>
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

