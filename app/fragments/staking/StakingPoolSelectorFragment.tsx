import { Platform, Pressable, View, useWindowDimensions, Text, ScrollView } from "react-native";
import { fragment } from "../../fragment";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useLedgerTransport } from "../ledger/components/LedgerTransportProvider";
import { memo, useCallback, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { t } from "../../i18n/t";
import { useEngine } from "../../engine/Engine";
import BN from "bn.js";
import { Address, fromNano, toNano } from "ton";
import { KnownPools } from "../../utils/KnownPools";
import { WImage } from "../../components/WImage";
import { useParams } from "../../utils/useParams";

import StakingIcon from '@assets/ic_staking.svg';
import IcCheck from "@assets/ic-check.svg";

const PoolItem = memo(({ selected, pool, onSelect }: { selected?: boolean, pool: Address, onSelect: () => void }) => {
    const { Theme, AppConfig } = useAppConfig();
    const knownPools = KnownPools(AppConfig.isTestnet);
    const engine = useEngine();

    const poolFirendly = pool.toFriendly({ testOnly: AppConfig.isTestnet });
    const name = knownPools[poolFirendly].name;
    const requireSource = knownPools[poolFirendly].requireSource;
    const poolState = engine.products.whalesStakingPools.usePool(pool);
    const poolFee = poolState?.params.poolFee ? toNano(fromNano(poolState.params.poolFee)).divn(100).toNumber() : undefined;
    const apy = engine.products.whalesStakingPools.useStakingApy()?.apy;
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
                backgroundColor: Theme.surfaceSecondary,
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
                backgroundColor: Theme.border,
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
                            heigh={44}
                            borderRadius={22}
                        />
                    )}
            </View>
            <View style={{ justifyContent: 'center', flexGrow: 1, flexShrink: 1 }}>
                <Text
                    style={{
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '600',
                        color: Theme.textPrimary,
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
                backgroundColor: selected ? Theme.accent : Theme.divider,
                borderRadius: 12
            }}>
                {selected && (
                    <IcCheck color={Theme.white} height={16} width={16} style={{ height: 16, width: 16 }} />
                )}
            </View>
        </Pressable>
    );
});

export const StakingPoolSelectorFragment = fragment(() => {
    const { Theme } = useAppConfig();
    const dimentions = useWindowDimensions();
    const params = useParams<{ current: Address, callback: (pool: Address) => void, ledger?: boolean }>();
    const engine = useEngine();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    const ledgerContext = useLedgerTransport();
    const ledgerAddress = useMemo(() => {
        if (!params.ledger || !ledgerContext?.addr?.address) return;
        try {
            return Address.parse(ledgerContext?.addr?.address);
        } catch {
            return;
        }
    }, [ledgerContext?.addr?.address]);
    const ledgerStaking = engine.products.whalesStakingPools.useStaking(ledgerAddress);
    const pools = engine.products.whalesStakingPools.useFull().pools;

    const activePools = useMemo(() => {
        if (ledgerAddress) {
            return ledgerStaking?.pools.filter(pool => pool.balance.gt(new BN(0))) ?? [];
        }
        return pools.filter(pool => pool.balance.gt(new BN(0)));
    }, [pools, ledgerAddress, ledgerStaking]);

    const activeLength = useMemo(() => {
        return activePools.length
    }, [activePools]);

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
            backgroundColor: Platform.OS === 'android' ? Theme.background : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar />
            {Platform.OS === 'ios' && (
                <Pressable
                    onPress={navigation.goBack}
                    style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                />
            )}
            {(activeLength > 3) ? (
                <View style={{
                    flex: 1, backgroundColor: Theme.background,
                    borderTopEndRadius: Platform.OS === 'android' ? 0 : 20,
                    borderTopStartRadius: Platform.OS === 'android' ? 0 : 20,
                    paddingBottom: safeArea.bottom + 16
                }}>
                    <Text style={{
                        marginHorizontal: 16,
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '600',
                        color: Theme.textPrimary,
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
                        {activePools.map((pool, index) => (
                            <PoolItem
                                key={`pool-${index}`}
                                pool={pool.address}
                                selected={pool.address.equals(params.current)}
                                onSelect={() => onPoolSelect(pool.address)}
                            />
                        ))}
                    </ScrollView>
                </View>
            ) : (
                <View style={{
                    height: Platform.OS === 'ios' ? (Math.floor(dimentions.height * heightMultiplier)) : undefined,
                    flexGrow: Platform.OS === 'ios' ? 0 : 1,
                    backgroundColor: Theme.background,
                    borderTopEndRadius: Platform.OS === 'android' ? 0 : 20,
                    borderTopStartRadius: Platform.OS === 'android' ? 0 : 20,
                    padding: 16,
                    paddingBottom: safeArea.bottom + 16
                }}>
                    <Text style={{
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '600',
                        color: Theme.textPrimary,
                        marginBottom: 16, marginTop: Platform.OS === 'ios' ? 16 : 0,
                    }}>
                        {t('products.staking.activePools')}
                    </Text>
                    {activePools.map((pool, index) => (
                        <PoolItem
                            key={`pool-${index}`}
                            pool={pool.address}
                            selected={pool.address.equals(params.current)}
                            onSelect={() => onPoolSelect(pool.address)}
                        />
                    ))}
                </View>
            )}
        </View>
    );
});