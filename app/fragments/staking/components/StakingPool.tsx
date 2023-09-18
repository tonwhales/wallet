import BN from "bn.js";
import { memo, useEffect, useMemo, useState } from "react";
import { Address, fromNano, toNano } from "ton";
import { Engine } from "../../../engine/Engine";
import { useAppConfig } from "../../../utils/AppConfigContext";
import { TypedNavigation, useTypedNavigation } from "../../../utils/useTypedNavigation";
import { KnownPools } from "../../../utils/KnownPools";
import { t } from "../../../i18n/t";
import { Pressable, View, Text, Alert } from "react-native";
import { WImage } from "../../../components/WImage";
import { openWithInApp } from "../../../utils/openWithInApp";
import { ValueComponent } from "../../../components/ValueComponent";
import { PriceComponent } from "../../../components/PriceComponent";
import { Countdown } from "../../../components/Countdown";

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
                onPress: () => { openWithInApp('https://tonwhales.com/club'); },
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
                onPress: () => { openWithInApp('https://tonwhales.com/staking'); },
            },
            { text: t('common.cancel'), onPress: () => { }, style: "cancel" }
        ]
    );
}

export const StakingPool = memo((props: {
    address: Address,
    balance: BN,
    restricted?: boolean,
    engine: Engine,
    isLedger?: boolean
}) => {
    const { AppConfig, Theme } = useAppConfig();
    const navigation = useTypedNavigation();
    const addr = props.address.toFriendly({ testOnly: AppConfig.isTestnet });
    const pool = props.engine.products.whalesStakingPools.usePool(props.address);
    const poolFee = pool?.params.poolFee ? toNano(fromNano(pool.params.poolFee)).divn(100).toNumber() : undefined;
    const knownPools = KnownPools(AppConfig.isTestnet);

    const stakeUntil = pool?.params.stakeUntil || 0;
    const name = knownPools[addr].name;
    const sub = poolFee ? `${t('products.staking.info.poolFeeTitle')}: ${poolFee}%` : addr.slice(0, 10) + '...' + addr.slice(addr.length - 6);

    const apy = props.engine.products.whalesStakingPools.useStakingApy()?.apy;
    const apyWithFee = useMemo(() => {
        if (!!apy && !!poolFee) {
            return `${t('common.apy')} ≈ ${(apy - apy * (poolFee / 100)).toFixed(2)}% • ${t('products.staking.info.poolFeeTitle')} ${poolFee}%`;
        }
    }, [apy, poolFee]);

    let requireSource = knownPools[addr].requireSource;
    let club: boolean | undefined;
    if (
        addr === 'EQDFvnxuyA2ogNPOoEj1lu968U4PP8_FzJfrOWUsi_o1CLUB'
        || addr === 'EQA_cc5tIQ4haNbMVFUD1d0bNRt17S7wgWEqfP_xEaTACLUB'
    ) {
        club = true;
    }

    const [left, setLeft] = useState(Math.floor(stakeUntil - (Date.now() / 1000)));

    useEffect(() => {
        const timerId = setInterval(() => {
            setLeft(Math.floor((stakeUntil) - (Date.now() / 1000)));
        }, 1000);
        return () => {
            clearInterval(timerId);
        };
    }, [stakeUntil]);

    return (
        <Pressable
            onPress={() => {
                if (club && props.restricted) {
                    clubAlert(navigation, addr);
                    return;
                } else if (props.restricted) {
                    restrictedAlert(navigation, addr);
                    return;
                }
                navigation.navigate(props.isLedger ? 'LedgerStaking' : 'Staking', { backToHome: false, pool: addr })
            }}
            style={({ pressed }) => {
                return {
                    flex: 1,
                    opacity: pressed ? 0.5 : 1,
                    borderRadius: 20,
                    backgroundColor: Theme.style === 'dark' ? Theme.surfaceSecondary : Theme.surfacePimary,
                    padding: 16
                }
            }}
        >
            <View style={{
                flexShrink: 1,
                alignItems: 'center',
                alignSelf: 'flex-end',
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: Theme.border,
                maxWidth: 74, justifyContent: 'center',
                position: 'relative', top: -6, right: -6
            }}>
                <Text style={{
                    paddingHorizontal: 8, paddingVertical: 1,
                    color: Theme.textPrimary,
                    fontWeight: '400',
                    fontSize: 13, lineHeight: 18,
                    flexShrink: 1,
                }}>
                    <Countdown
                        hidePrefix
                        left={left}
                        textStyle={{
                            color: Theme.textPrimary,
                            fontWeight: '400',
                            fontSize: 13, lineHeight: 18,
                            flex: 1,
                            flexShrink: 1,
                        }}
                    />
                </Text>
            </View>
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
                <View style={{ flexDirection: 'row', flexGrow: 1, flexBasis: 0 }}>
                    <View style={{
                        flexGrow: 1, flexShrink: 1,
                        marginRight: 12,
                    }}>
                        <Text
                            style={{
                                color: Theme.textPrimary,
                                fontSize: 17, lineHeight: 24,
                                fontWeight: '600',
                                flexShrink: 1, marginBottom: 2
                            }}
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                        >
                            {name}
                        </Text>
                        <Text
                            style={{
                                color: Theme.textSecondary,
                                fontSize: 15, lineHeight: 20,
                                flexShrink: 1
                            }}
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                        >
                            <Text style={{ flexShrink: 1 }}>
                                {apyWithFee ?? sub}
                            </Text>
                        </Text>
                    </View>
                    <View style={{}}>
                        {props.balance.gt(new BN(0)) && (
                            <>
                                <Text style={{
                                    color: Theme.textPrimary,
                                    fontWeight: '600',
                                    lineHeight: 24,
                                    fontSize: 17,
                                    alignSelf: 'flex-start'
                                }}>
                                    <ValueComponent
                                        precision={3}
                                        value={props.balance}
                                    /> {' TON'}
                                </Text>
                                <PriceComponent
                                    amount={props.balance}
                                    style={{
                                        backgroundColor: Theme.transparent,
                                        paddingHorizontal: 0, paddingVertical: 0,
                                        alignSelf: 'flex-end',
                                        marginTop: 2, height: 20
                                    }}
                                    textStyle={{
                                        color: Theme.textSecondary,
                                        fontWeight: '400',
                                        fontSize: 15, lineHeight: 20
                                    }}
                                />
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Pressable>
    );
});