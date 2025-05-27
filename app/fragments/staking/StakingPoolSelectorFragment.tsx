import { Platform, Pressable, View, useWindowDimensions, Text, ScrollView } from "react-native";
import { fragment } from "../../fragment";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { memo, useCallback, useMemo } from "react";
import { t } from "../../i18n/t";
import { useKnownPools } from "../../utils/KnownPools";
import { WImage } from "../../components/WImage";
import { useParams } from "../../utils/useParams";
import { Address, fromNano, toNano } from "@ton/core";
import { useClient4, useIsLedgerRoute, useNetwork, usePoolApy, useSelectedAccount, useStakingPool, useStakingPoolMembers, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "../ledger/components/TransportContext";
import { StakingPoolMember } from "../../engine/types";
import { ScreenHeader } from "../../components/ScreenHeader";
import { StatusBar } from "expo-status-bar";

import StakingIcon from '@assets/ic_staking.svg';
import IcCheck from "@assets/ic-check.svg";

const PoolItem = memo(({ selected, pool, onSelect }: { selected?: boolean, pool: Address, onSelect: () => void }) => {
    const theme = useTheme();
    const network = useNetwork();
    const knownPools = useKnownPools(network.isTestnet);
    const selectedAcc = useSelectedAccount();
    const poolState = useStakingPool(pool, selectedAcc!.address);
    const apy = usePoolApy(pool.toString({ testOnly: network.isTestnet }));

    const poolFirendly = pool.toString({ testOnly: network.isTestnet });
    const name = knownPools[poolFirendly].name;
    const requireSource = knownPools[poolFirendly].requireSource;
    const poolFee = poolState?.params?.poolFee
        ? Number((toNano(fromNano(poolState.params.poolFee)) / toNano(100)))
        : undefined;

    const apyWithFee = useMemo(() => {
        if (!!apy && !!poolFee) {
            return `${t('common.apy')} ≈ ${(apy - apy * (poolFee / 100)).toFixed(2)}% • ${t('products.staking.info.poolFeeTitle')} ${poolFee}%`;
        }
    }, [apy, poolFee]);

    const sub = poolFee
        ? `${t('products.staking.info.poolFeeTitle')}: ${poolFee}%`
        : poolFirendly.slice(0, 10) + '...' + poolFirendly.slice(poolFirendly.length - 6);

    return (
        <Pressable
            style={{
                backgroundColor: theme.surfaceOnElevation,
                padding: 20,
                marginBottom: 16,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}
            onPress={onSelect}
        >
            <View style={{
                width: 46, height: 46,
                borderRadius: 23,
                borderWidth: 0,
                marginRight: 10,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: theme.border,
            }}>
                {!requireSource
                    ? (
                        <StakingIcon
                            width={44}
                            height={44}
                        />
                    )
                    : (
                        <WImage
                            requireSource={requireSource}
                            width={44}
                            height={44}
                            borderRadius={22}
                        />
                    )}
            </View>
            <View style={{ justifyContent: 'center', flexGrow: 1, flexShrink: 1 }}>
                <Text
                    style={{
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '600',
                        color: theme.textPrimary,
                        marginBottom: 2,
                        maxWidth: '90%',
                    }}
                    numberOfLines={1}
                >
                    {name}
                </Text>
                <Text style={{ fontSize: 15, lineHeight: 20, fontWeight: '400', color: '#838D99' }}>
                    {apyWithFee ?? sub}
                </Text>
            </View>
            <View style={{
                justifyContent: 'center', alignItems: 'center',
                height: 24, width: 24,
                backgroundColor: selected ? theme.accent : theme.divider,
                borderRadius: 12
            }}>
                {selected && (
                    <IcCheck color={theme.white} height={16} width={16} style={{ height: 16, width: 16 }} />
                )}
            </View>
        </Pressable>
    );
});

export const StakingPoolSelectorFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const client = useClient4(isTestnet);
    const dimentions = useWindowDimensions();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();
    const selected = useSelectedAccount();
    const params = useParams<{ current: Address, callback: (pool: Address) => void }>();
    const knownPools = useKnownPools(isTestnet);

    const isLedger = useIsLedgerRoute()

    const ledgerAddress = useMemo(() => {
        if (isLedger || !ledgerContext?.addr?.address) return;
        try {
            return Address.parse(ledgerContext?.addr?.address);
        } catch { }
    }, [ledgerContext?.addr?.address, isLedger]);

    const pools = Object.keys(knownPools).map((v) => Address.parse(v));

    const memberData = useStakingPoolMembers(
        client,
        isTestnet,
        pools.map((p) => ({
            pool: p,
            member: isLedger
                ? ledgerAddress!
                : selected!.address
        })),
    ).filter((v) => !!v) as (StakingPoolMember)[];

    const poolsWithStake = useMemo(() => {
        return memberData.filter((v) => v.balance > 0n);
    }, [memberData]);

    const activeLength = useMemo(() => {
        return poolsWithStake.length
    }, [poolsWithStake]);

    const heightMultiplier = useMemo(() => {
        let multiplier = 1;
        if (activeLength === 1) {
            multiplier = .5;
        } else if (activeLength === 2) {
            multiplier = .52;
        } else if (activeLength === 3) {
            multiplier = .7;
        } else if (activeLength === 4) {
            multiplier = .8;
        }
        return multiplier;
    }, [activeLength]);

    const onPoolSelect = useCallback((pool: Address) => {
        params.callback(pool);
        navigation.goBack();
    }, [params.callback]);

    return (
        <View style={{
            flexGrow: 1,
            justifyContent: 'flex-end',
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            paddingBottom: 0,
            backgroundColor: Platform.OS === 'android' ? theme.backgroundPrimary : undefined,
        }}>
            <StatusBar style={Platform.select({ ios: 'light', android: theme.style === 'dark' ? 'light' : 'dark' })} />
            {Platform.OS === 'android' && (
                <ScreenHeader onClosePressed={navigation.goBack} />
            )}
            {Platform.OS === 'ios' && (
                <Pressable
                    onPress={navigation.goBack}
                    style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                />
            )}
            {(activeLength > 3) ? (
                <View style={{
                    flex: 1,
                    backgroundColor: Platform.OS === 'ios' ? theme.surfaceOnElevation : theme.backgroundPrimary,
                    borderTopEndRadius: Platform.OS === 'android' ? 0 : 20,
                    borderTopStartRadius: Platform.OS === 'android' ? 0 : 20,
                    paddingBottom: safeArea.bottom + 16
                }}>
                    <Text style={{
                        marginHorizontal: 16,
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '600',
                        color: theme.textPrimary,
                        marginTop: Platform.OS === 'ios' ? 32 : 0,
                    }}>
                        {t('products.staking.activePools')}
                    </Text>
                    <ScrollView
                        style={{
                        }}
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                        }}
                        contentInset={{
                            bottom: safeArea.bottom + 16,
                            top: 16
                        }}
                    >
                        {poolsWithStake.map((memberData, index) => {
                            const addr = Address.parse(memberData.pool);
                            return (
                                <PoolItem
                                    key={`pool-${index}`}
                                    pool={addr}
                                    selected={addr.equals(params.current)}
                                    onSelect={() => onPoolSelect(addr)}
                                />
                            )
                        })}
                    </ScrollView>
                </View>
            ) : (
                <View style={{
                    height: Platform.OS === 'ios' ? (Math.floor(dimentions.height * heightMultiplier)) : undefined,
                    flexGrow: Platform.OS === 'ios' ? 0 : 1,
                    backgroundColor: Platform.OS === 'ios' ? theme.elevation : theme.backgroundPrimary,
                    borderTopEndRadius: Platform.OS === 'android' ? 0 : 20,
                    borderTopStartRadius: Platform.OS === 'android' ? 0 : 20,
                    padding: 16,
                    paddingBottom: safeArea.bottom + 16
                }}>
                    <Text style={{
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '600',
                        color: theme.textPrimary,
                        marginBottom: 16, marginTop: Platform.OS === 'ios' ? 16 : 0,
                    }}>
                        {t('products.staking.activePools')}
                    </Text>
                    {poolsWithStake.map((memberData, index) => {
                        const addr = Address.parse(memberData.pool);
                        return (
                            <PoolItem
                                key={`pool-${index}`}
                                pool={addr}
                                selected={addr.equals(params.current)}
                                onSelect={() => onPoolSelect(addr)}
                            />
                        )
                    })}
                </View>
            )}
        </View>
    );
});