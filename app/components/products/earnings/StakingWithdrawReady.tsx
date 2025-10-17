import { Address, fromNano, toNano } from "@ton/core";
import { memo, useMemo } from "react";
import { useNetwork, useStakingActive, useTheme } from "../../../engine/hooks";
import { StakingPoolMember } from "../../../engine/types";
import { Pressable, View, Text } from "react-native";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { TransferAction } from "../../../fragments/staking/StakingTransferFragment";
import { Typography } from "../../styles";
import { PriceComponent } from "../../PriceComponent";
import { t } from "../../../i18n/t";
import { useKnownPools } from "../../../utils/KnownPools";

export const StakingWithdrawReady = memo(({ address, isLedger }: { address: Address, isLedger?: boolean }) => {
    const { isTestnet } = useNetwork();
    const active = useStakingActive(address);
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const knownPools = useKnownPools(isTestnet);

    const readyArray: (StakingPoolMember & { name: string })[] = useMemo(() => {
        if (!active) {
            return [];
        }

        return Object.keys(active).filter((k) => {
            const state = active[k];
            return state.withdraw > 0n;
        }).map((k) => {
            const state = active[k];
            return {
                pool: Address.parse(k).toString({ testOnly: isTestnet }),
                pendingDeposit: state.pendingDeposit,
                pendingWithdraw: state.pendingWithdraw,
                withdraw: state.withdraw,
                balance: state.balance,
                name: knownPools[Address.parse(k).toString({ testOnly: isTestnet })]?.name || ''
            };
        });
    }, [active]);

    if (readyArray.length === 0) {
        return null;
    }

    return (
        <View style={{ paddingHorizontal: 16, gap: 16, marginTop: 16 }}>
            {readyArray.map((p) => (
                <Pressable
                    style={{ width: '100%', backgroundColor: theme.surfaceOnBg, padding: 16, borderRadius: 16 }}
                    onPress={() => {
                        navigation.navigateStakingTransfer(
                            {
                                target: Address.parse(p.pool).toString({ testOnly: isTestnet }),
                                amount: p.withdraw.toString(),
                                lockAmount: true,
                                lockAddress: true,
                                lockComment: true,
                                action: 'withdraw_ready' as TransferAction
                            },
                            { ledger: isLedger }
                        );
                    }}
                >
                    <View style={{
                        flexDirection: 'row', width: '100%',
                        justifyContent: 'space-between', alignItems: 'flex-end',
                    }}>
                        <View>
                            <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                {`${t('products.staking.earnings')}: ${p.name}`}
                            </Text>
                            <Text style={[{ color: theme.textSecondary }, Typography.medium17_24]}>
                                {t('products.staking.withdrawStatus.ready')}
                            </Text>
                            <Text style={[{ color: theme.accent }, Typography.medium15_20]}>
                                {t('products.staking.withdrawStatus.withdrawNow')}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[{ color: theme.accentGreen, marginBottom: 2 }, Typography.semiBold17_24]}>
                                {parseFloat(parseFloat(fromNano(p.withdraw)).toFixed(3)) + ' ' + 'TON'}
                            </Text>
                            <PriceComponent
                                amount={p.withdraw}
                                style={{
                                    backgroundColor: theme.transparent,
                                    paddingHorizontal: 0,
                                    paddingVertical: 0,
                                    height: 'auto',
                                    alignSelf: 'flex-end'
                                }}
                                textStyle={{ color: theme.textPrimary, fontSize: 15, fontWeight: '400' }}
                                theme={theme}
                            />
                        </View>
                    </View>
                </Pressable>
            ))}
        </View>
    );
});