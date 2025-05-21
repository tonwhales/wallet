import { memo, useMemo } from "react";
import { TypedNavigation, useTypedNavigation } from "../../utils/useTypedNavigation";
import { useKnownPools } from "../../utils/KnownPools";
import { t } from "../../i18n/t";
import { Pressable, View, Text, Alert, StyleProp, ViewStyle } from "react-native";
import { WImage } from "../WImage";
import { ValueComponent } from "../ValueComponent";
import { PriceComponent } from "../PriceComponent";
import { Address, fromNano, toNano } from "@ton/core";
import { useNetwork, usePoolApy, useStakingPool, useTheme } from "../../engine/hooks";
import { Typography } from "../styles";
import { StakingPoolCountdown } from "./StakingPoolCountdown";

import StakingIcon from '@assets/ic_staking.svg';

function clubAlert(navigation: TypedNavigation, pool: string) {
    Alert.alert(
        t('products.staking.pools.restrictedTitle'),
        t('products.staking.pools.restrictedMessage'),
        [
            {
                text: t('common.continue'),
                onPress: () => { navigation.navigate('Staking', { backToHome: true, pool }); }
            },
            {
                text: t('products.staking.pools.viewClub'),
                onPress: () => {
                    navigation.navigateDAppWebViewModal({
                        lockNativeBack: true,
                        safeMode: true,
                        url: 'https://tonwhales.com/club',
                        header: { title: { type: 'params', params: { domain: 'tonwhales.com', title: t('products.staking.pools.club') } } },
                        useStatusBar: true,
                        engine: 'ton-connect',
                        controlls: {
                            refresh: true,
                            share: true,
                            back: true,
                            forward: true
                        },
                    });
                },
            },
            { text: t('common.cancel'), onPress: () => { }, style: "cancel" }
        ]
    );
}

function restrictedAlert(navigation: TypedNavigation, pool: string) {
    Alert.alert(
        t('products.staking.transfer.restrictedTitle'),
        t('products.staking.transfer.restrictedMessage'),
        [
            {
                text: t('common.continue'),
                onPress: () => { navigation.navigate('Staking', { backToHome: true, pool }); }
            },
            {
                text: t('products.staking.moreInfo'),
                onPress: () => {
                    navigation.navigateDAppWebViewModal({
                        lockNativeBack: true,
                        safeMode: true,
                        url: 'https://tonwhales.com/staking',
                        header: { title: { type: 'params', params: { domain: 'tonwhales.com', title: t('products.staking.pools.club') } } },
                        useStatusBar: true,
                        engine: 'ton-connect',
                        controlls: {
                            refresh: true,
                            share: true,
                            back: true,
                            forward: true
                        },
                    });
                },
            },
            { text: t('common.cancel'), onPress: () => { }, style: "cancel" }
        ]
    );
}

export const StakingPool = memo((props: {
    member: Address,
    pool: Address,
    balance: bigint,
    restricted?: boolean,
    isLedger?: boolean,
    style?: StyleProp<ViewStyle>,
    hideCycle?: boolean,
    iconBackgroundColor?: string,
}) => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const poolAddressString = props.pool.toString({ testOnly: network.isTestnet });
    const pool = useStakingPool(props.pool, props.member);
    const poolFee = pool?.params.poolFee ? Number(toNano(fromNano(pool.params.poolFee))) / 100 : undefined;
    const knownPools = useKnownPools(network.isTestnet);

    const stakeUntil = pool?.status.proxyStakeUntil || 0;
    const name = knownPools[poolAddressString]?.name;
    const sub = poolFee ? `${t('products.staking.info.poolFeeTitle')}: ${poolFee}%` : poolAddressString.slice(0, 10) + '...' + poolAddressString.slice(poolAddressString.length - 6);

    const poolApy = usePoolApy(poolAddressString);
    const apyWithFee = useMemo(() => {
        if (!!poolApy && !!poolFee) {
            return `${t('common.apy')} ≈ ${(poolApy - poolApy * (poolFee / 100)).toFixed(2)}%`;
        }
    }, [poolApy, poolFee]);

    let requireSource = knownPools[poolAddressString]?.requireSource;
    let club: boolean | undefined;
    if (
        poolAddressString === 'EQDFvnxuyA2ogNPOoEj1lu968U4PP8_FzJfrOWUsi_o1CLUB'
        || poolAddressString === 'EQA_cc5tIQ4haNbMVFUD1d0bNRt17S7wgWEqfP_xEaTACLUB'
    ) {
        club = true;
    }

    return (
        <Pressable
            onPress={() => {
                if (club && props.restricted) {
                    clubAlert(navigation, poolAddressString);
                    return;
                } else if (props.restricted) {
                    restrictedAlert(navigation, poolAddressString);
                    return;
                }
                navigation.navigateStakingPool(
                    { pool: poolAddressString, backToHome: false },
                    { ledger: props.isLedger }
                );
            }}
            style={({ pressed }) => [{
                flex: 1,
                opacity: pressed ? 0.5 : 1,
                borderRadius: 16,
                backgroundColor: theme.backgroundPrimary,
                padding: 16,
                paddingTop: props.balance > 0n ? 20 : 0,
            }, props.style]}
        >
            {!props.hideCycle && (
                <View style={[
                    {
                        flexShrink: 1,
                        alignItems: 'center',
                        alignSelf: 'flex-end',
                        borderRadius: 16,
                        overflow: 'hidden',
                        backgroundColor: theme.border,
                        maxWidth: 74, justifyContent: 'center',
                    }, props.balance > 0n
                        ? { position: 'relative', top: -10, right: -6 }
                        : { position: 'relative', top: 10, right: -6 }
                ]}>
                    <Text style={[
                        {
                            paddingHorizontal: 8, paddingVertical: 1,
                            color: theme.textPrimary,
                            flexShrink: 1,
                        },
                        Typography.regular13_18
                    ]}>
                        <StakingPoolCountdown
                            theme={theme}
                            stakeUntil={stakeUntil}
                        />
                    </Text>
                </View>
            )}
            <View style={{
                alignSelf: 'stretch',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <View style={{
                    width: 46, height: 46,
                    borderRadius: 23,
                    borderWidth: 0,
                    marginRight: 12,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: props.iconBackgroundColor ?? theme.border,
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
                                style={{ backgroundColor: props.iconBackgroundColor }}
                            />
                        )}
                </View>
                <View style={{ flexDirection: 'row', flexGrow: 1, flexBasis: 0 }}>
                    <View style={{
                        flexGrow: 1, flexShrink: 1,
                        marginRight: 12,
                    }}>
                        <Text
                            style={[{ color: theme.textPrimary, flexShrink: 1, marginBottom: 2 }, Typography.semiBold17_24]}
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                        >
                            {name}
                        </Text>
                        <Text
                            style={[{ color: theme.textSecondary, flexShrink: 1 }, Typography.regular15_20]}
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                        >
                            <Text style={{ flexShrink: 1 }}>
                                {apyWithFee ?? sub}
                            </Text>
                        </Text>
                    </View>
                    <View>
                        {props.balance > 0n && (
                            <>
                                <Text style={[{ color: theme.textPrimary, alignSelf: 'flex-end' }, Typography.semiBold17_24]}>
                                    <ValueComponent
                                        precision={3}
                                        value={props.balance}
                                        centFontStyle={{ opacity: 0.5 }}
                                    />
                                    <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
                                        {' TON'}
                                    </Text>
                                </Text>
                                <PriceComponent
                                    amount={props.balance}
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0, paddingVertical: 0,
                                        alignSelf: 'flex-end',
                                        marginTop: 2, height: 20
                                    }}
                                    theme={theme}
                                    textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                />
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Pressable>
    );
});