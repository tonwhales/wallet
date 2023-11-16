import React, { memo, useCallback, useEffect, useMemo, useState } from "react"
import { ProductBanner } from "./ProductBanner";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { extractDomain } from "../../engine/utils/extractDomain";
import { HoldersCardItem } from "./HoldersCardItem";
import { Pressable, View, Text, Image } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { AnimatedChildrenCollapsible } from "../animated/AnimatedChildrenCollapsible";
import { useHoldersAccountStatus, useHoldersCards, useHoldersHiddenCards, useNetwork, useSelectedAccount, useStaking, useTheme } from "../../engine/hooks";
import { HoldersAccountState, holdersUrl } from "../../engine/api/holders/fetchAccountState";
import { holdersCardImageMap } from "./HoldersHiddenCards";

import Chevron from '@assets/ic_chevron_down.svg'
import Hide from '@assets/ic-hide.svg';
import MCard from '@assets/ic-m-card.svg';
import { getDomainKey } from "../../engine/state/domainKeys";

export const HoldersProductComponent = memo(() => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const holdersAccStatus = useHoldersAccountStatus(selected!.address).data;
    const accounts = useHoldersCards(selected!.address).data;
    const [hiddenCards, markCard] = useHoldersHiddenCards(selected!.address);
    const visibleList = useMemo(() => {
        return (accounts ?? []).filter((item) => {
            return !hiddenCards.includes(item.id);
        });
    }, [hiddenCards, accounts]);

    const staking = useStaking();

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
        if (holdersAccStatus?.state === HoldersAccountState.NeedEnrollment) {
            return true;
        }
        return false;
    }, [holdersAccStatus]);

    const collapsedBorderStyle = useAnimatedStyle(() => {
        return {
            borderBottomEndRadius: withTiming((collapsed ? 20 : 0), { duration: 250 }),
            borderBottomStartRadius: withTiming((collapsed ? 20 : 0), { duration: 250 }),
        }
    });

    const onPress = useCallback(() => {
        const domain = extractDomain(holdersUrl);
        const domainKey = getDomainKey(domain);
        if (needsEnrolment || !domainKey) {
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
    }, [needsEnrolment]);

    if (!network.isTestnet) {
        return null;
    }

    if (accounts?.length === 0) {
        if (staking.total > 0n) {
            return null;
        }
        return (
            <View style={{ paddingHorizontal: 16 }}>
                <ProductBanner
                    title={t('products.holders.card.defaultTitle')}
                    subtitle={t('products.holders.card.defaultSubtitle')}
                    onPress={onPress}
                    illustration={require('@assets/banners/banner-holders.png')}
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
                            backgroundColor: theme.surfaceOnElevation,
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
                                    <Text style={{ color: theme.white, fontSize: 7.5, position: 'absolute', bottom: 4.5, left: 5 }} numberOfLines={1}>
                                        {visibleList[0].card.lastFourDigits}
                                    </Text>
                                )}
                                {!visibleList[0] && (
                                    <Image source={require('@assets/ic_eu.png')} style={{ position: 'absolute', bottom: 4, right: 4 }} />
                                )}
                                {(visibleList[0] && visibleList[0].card.kind === 'virtual') && (
                                    <MCard height={8} width={13} style={{ height: 8, width: 13, position: 'absolute', bottom: 5.25, right: 5.5 }} />
                                )}
                            </View>
                            <View style={{
                                position: 'absolute',
                                bottom: 3.5, right: -6,
                                height: 16, borderRadius: 8,
                                backgroundColor: theme.accent,
                                justifyContent: 'center', alignItems: 'center',
                                borderWidth: 2, borderColor: theme.white,
                                paddingHorizontal: visibleList.length > 9 ? 5 : 2.5
                            }}>
                                <Text style={{ fontSize: 10, fontWeight: '500', color: theme.white }}>
                                    {visibleList.length}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontWeight: '600',
                                fontSize: 17,
                                lineHeight: 24,
                                color: theme.textPrimary,
                            }}>
                                {t('products.holders.card.cards')}
                            </Text>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 15,
                                lineHeight: 20,
                                color: theme.textSecondary
                            }}>
                                {t('products.holders.card.eurSubtitle')}
                            </Text>
                        </View>
                        <Animated.View style={[
                            {
                                height: 32, width: 32,
                                borderRadius: 16,
                                justifyContent: 'center', alignItems: 'center',
                                alignSelf: 'center',
                                backgroundColor: theme.divider
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
                    divider={<View style={{ backgroundColor: theme.surfaceOnElevation, marginHorizontal: 16, paddingHorizontal: 20 }}>
                        <View style={{ backgroundColor: theme.divider, height: 1 }}
                        />
                    </View>}
                    renderItem={(item, index) => {
                        return (
                            <HoldersCardItem
                                key={`card-${index}`}
                                account={item}
                                last={index === visibleList.length - 1}
                                rightAction={() => markCard(item.id, true)}
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
                        rightAction={() => markCard(item.id, true)}
                        rightActionIcon={<Hide height={36} width={36} style={{ width: 36, height: 36 }} />}
                        single={visibleList.length === 1}
                    />
                )
            })}
        </View>
    );
})