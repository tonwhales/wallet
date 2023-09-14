import React, { memo, useCallback, useEffect, useMemo, useState } from "react"
import { useEngine } from "../../engine/Engine";
import { ProductBanner } from "./ProductBanner";
import { t } from "../../i18n/t";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { extractDomain } from "../../engine/utils/extractDomain";
import { holdersUrl } from "../../engine/holders/HoldersProduct";
import { HoldersCardItem } from "./HoldersCardItem";
import BN from "bn.js";
import { Pressable, View, Text, Image } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { AnimatedChildrenCollapsible } from "../animated/AnimatedChildrenCollapsible";

import Chevron from '@assets/ic_chevron_down.svg'
import Hide from '@assets/ic-hide.svg';
import MCard from '@assets/ic-m-card.svg';

export const holdersCardImageMap: { [key: string]: any } = {
    'classic': require('@assets/classic.png'),
    'black-pro': require('@assets/black-pro.png'),
    'whales': require('@assets/whales.png'),
}

export const HoldersProductComponent = memo(() => {
    const { AppConfig, Theme } = useAppConfig();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const accounts = engine.products.holders.useCards();
    const hiddenCards = engine.products.holders.useHiddenCards();
    const visibleList = useMemo(() => {
        return accounts.filter((item) => {
            return !hiddenCards.includes(item.id);
        });
    }, [hiddenCards, accounts]);

    const staking = engine.products.whalesStakingPools.useStakingCurrent();
    const status = engine.products.holders.useStatus();

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
        try {
            let domain = extractDomain(holdersUrl);
            if (!domain) {
                return; // Shouldn't happen
            }
            let domainKey = engine.products.keys.getDomainKey(domain);
            if (!domainKey) {
                return true;
            }
            if (status.state === 'need-enrolment') {
                return true;
            }
        } catch (error) {
            return true;
        }
        return false;
    }, [status]);

    const collapsedBorderStyle = useAnimatedStyle(() => {
        return {
            borderBottomEndRadius: withTiming((collapsed ? 20 : 0), { duration: 250 }),
            borderBottomStartRadius: withTiming((collapsed ? 20 : 0), { duration: 250 }),
        }
    });

    const onPress = useCallback(
        () => {
            if (needsEnrolment) {
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
        },
        [needsEnrolment],
    );

    if (!AppConfig.isTestnet) {
        return null;
    }

    if (accounts.length === 0) {
        if (staking.total.gt(new BN(0))) {
            return null;
        }
        return (
            <View style={{ paddingHorizontal: 16 }}>
                <ProductBanner
                    title={t('products.zenPay.card.defaultTitle')}
                    subtitle={t('products.zenPay.card.defaultSubtitle')}
                    onPress={onPress}
                    illustration={require('@assets/banner-holders.png')}
                />
            </View>
        );
    }

    if (visibleList.length > 5) {
        return (
            <View>
                <Pressable
                    onPress={() => {
                        setCollapsed(!collapsed)
                    }}
                    style={{ marginHorizontal: 16 }}
                >
                    <Animated.View style={[
                        {
                            flexDirection: 'row',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            padding: 20,
                            backgroundColor: Theme.surfaceSecondary,
                            borderTopEndRadius: 20,
                            borderTopStartRadius: 20
                        },
                        collapsedBorderStyle
                    ]}>
                        <View style={{ width: 46, height: 46, borderRadius: 6, borderWidth: 0, justifyContent: 'center', marginRight: 12 }}>
                            <View style={{ width: 46, height: 30, borderRadius: 6, borderWidth: 0, overflow: 'hidden' }}>
                                <Image
                                    style={{ width: 46, height: 30, borderRadius: 6 }}
                                    source={holdersCardImageMap[visibleList[0]?.card.personalizationCode || 'classic'] || holdersCardImageMap['classic']}
                                />
                                {!!visibleList[0]?.card.lastFourDigits && (
                                    <Text style={{ color: Theme.white, fontSize: 7.5, position: 'absolute', bottom: 4.5, left: 5 }} numberOfLines={1}>
                                        {visibleList[0].card.lastFourDigits}
                                    </Text>
                                )}
                                {!visibleList[0] && (
                                    <Image source={require('@assets/ic_eu.png')} style={{ position: 'absolute', bottom: 4, right: 4 }} />
                                )}
                                {(visibleList[0] && visibleList[0].type === 'virtual') && (
                                    <MCard height={8} width={13} style={{ height: 8, width: 13, position: 'absolute', bottom: 5.25, right: 5.5 }} />
                                )}
                            </View>
                            <View style={{
                                position: 'absolute',
                                bottom: 3.5, right: -6,
                                height: 16, borderRadius: 8,
                                backgroundColor: Theme.accent,
                                justifyContent: 'center', alignItems: 'center',
                                borderWidth: 2, borderColor: Theme.white,
                                paddingHorizontal: visibleList.length > 9 ? 5 : 2.5
                            }}>
                                <Text style={{ fontSize: 10, fontWeight: '500', color: Theme.white }}>
                                    {visibleList.length}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontWeight: '600',
                                fontSize: 17,
                                lineHeight: 24,
                                color: Theme.textPrimary,
                            }}>
                                {t('products.zenPay.card.cards')}
                            </Text>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 15,
                                lineHeight: 20,
                                color: Theme.textSecondary
                            }}>
                                {t('products.zenPay.card.eurSubtitle')}
                            </Text>
                        </View>
                        <Animated.View style={[
                            {
                                height: 32, width: 32,
                                borderRadius: 16,
                                justifyContent: 'center', alignItems: 'center',
                                alignSelf: 'center',
                                backgroundColor: Theme.divider
                            },
                            animatedChevron
                        ]}>
                            <Chevron style={{ height: 12, width: 12 }} height={12} width={12} />
                        </Animated.View>
                    </Animated.View>
                </Pressable>
                <AnimatedChildrenCollapsible
                    collapsed={collapsed}
                    items={visibleList}
                    divider={<View style={{ backgroundColor: Theme.surfaceSecondary, marginHorizontal: 16, paddingHorizontal: 20 }}>
                        <View
                            style={[
                                {
                                    backgroundColor: Theme.style === 'dark' ? Theme.surfacePimary : Theme.divider,
                                    height: 1,
                                },
                            ]}
                        />
                    </View>}
                    renderItem={(item, index) => {
                        return (
                            <HoldersCardItem
                                key={`card-${index}`}
                                account={item}
                                last={index === visibleList.length - 1}
                                rightAction={() => engine.products.holders.hideCard(item.id)}
                                rightActionIcon={<Hide height={36} width={36} style={{ width: 36, height: 36 }} />}
                                single={visibleList.length === 1}
                            />
                        )
                    }}
                />
            </View>
        )
    }

    return (
        <View>
            {visibleList.map((item, index) => {
                return (
                    <HoldersCardItem
                        key={`card-${index}`}
                        account={item}
                        first={index === 0}
                        last={index === visibleList.length - 1}
                        rightAction={() => engine.products.holders.hideCard(item.id)}
                        rightActionIcon={<Hide height={36} width={36} style={{ width: 36, height: 36 }} />}
                        single={visibleList.length === 1}
                    />
                )
            })}
        </View>
    );
})