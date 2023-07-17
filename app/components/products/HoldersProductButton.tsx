import React, { useCallback, useMemo, useState } from "react"
import { View, Pressable, Text } from "react-native";
import { useEngine } from "../../engine/Engine";
import { ProductBanner } from "./ProductBanner";
import { t } from "../../i18n/t";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { extractDomain } from "../../engine/utils/extractDomain";
import { holdersUrl } from "../../engine/corp/HoldersProduct";
import Animated, { FadeIn } from "react-native-reanimated";
import MCard from '../../../assets/ic-m-card.svg';
import { HoldersCardItem } from "./HoldersCardItem";
import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import BN from "bn.js";
import { AnimatedChildrenCollapsible } from "../animated/AnimatedChildrenCollapsible";

export const holdersCardColorsMap: { [key: string]: string[] } = {
    'minimal-1': ['#8689b5', '#9fa2d1'],
    'minimal-2': ['#000000', '#333333'],
    'minimal-3': ['#dca6c0', '#cda3b7'],
    'minimal-4': ['#93c1a6', '#8da998'],
    'default-1': ['#dec08e', '#b9a88b'],
    'default-2': ['#792AF6', "#954CF9"], // Default
}

export const HoldersProductButton = React.memo(() => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const accounts = engine.products.holders.useCards();
    const staking = engine.products.whalesStakingPools.useStaking();
    const status = engine.products.holders.useStatus();
    const [collapsed, setCollapsed] = useState(true);

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

    const onPress = useCallback(
        () => {
            if (needsEnrolment) {
                navigation.navigate(
                    'ZenPayLanding',
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
            <ProductBanner
                title={t('products.zenPay.card.defaultTitle')}
                subtitle={t('products.zenPay.card.defaultSubtitle')}
                onPress={onPress}
                illustration={require('../../../assets/banner-cards.png')}
            />
        );
    }

    if (accounts.length <= 3) {
        return (
            <View style={{
                borderRadius: 20,
                backgroundColor: '#F7F8F9',
            }}>
                {accounts.map((card, index) => {
                    return (
                        <HoldersCardItem
                            key={`card-${index}`}
                            account={card}
                            last={index === accounts.length - 1}
                        />
                    )
                })}
            </View>
        );
    }

    return (
        <View style={{
            borderRadius: 20,
            backgroundColor: '#F7F8F9',
        }}>
            <Pressable
                style={({ pressed }) => {
                    return {
                        opacity: pressed ? 0.5 : 1,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        padding: 20,
                    }
                }}
                onPress={() => {
                    setCollapsed(!collapsed)
                }}
            >
                <View style={{ height: 46, width: 46, marginRight: 12 }}>
                    <View style={{
                        width: 38, height: 25,
                        borderRadius: 5.7, borderWidth: 0,
                        overflow: 'hidden',
                        position: 'absolute', bottom: 18, left: 4, right: 4
                    }}>
                        <Canvas style={{ width: 38, height: 25, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                            <Rect x={0} y={0} width={38} height={25}>
                                <LinearGradient
                                    start={vec(0, 0)}
                                    end={vec(38, 25)}
                                    colors={holdersCardColorsMap[accounts[2].card.personalizationCode] ?? holdersCardColorsMap['default-2']}
                                />
                            </Rect>
                        </Canvas>
                    </View>
                    <View style={{ width: 42, height: 27, borderRadius: 7, borderWidth: 0, backgroundColor: '#F7F8F9', position: 'absolute', bottom: 13, left: 2, right: 2 }} />
                    <View style={{
                        width: 42, height: 27,
                        borderRadius: 7, borderWidth: 0,
                        overflow: 'hidden',
                        position: 'absolute', bottom: 11, left: 2, right: 2
                    }}>
                        <Canvas style={{ width: 42, height: 27, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                            <Rect x={0} y={0} width={42} height={27}>
                                <LinearGradient
                                    start={vec(0, 0)}
                                    end={vec(42, 27)}
                                    colors={holdersCardColorsMap[accounts[1].card.personalizationCode] ?? holdersCardColorsMap['default-2']}
                                />
                            </Rect>
                        </Canvas>
                    </View>
                    <View style={{ width: 46, height: 30, borderRadius: 7, borderWidth: 0, backgroundColor: '#F7F8F9', position: 'absolute', bottom: 2, left: 0, right: 0 }} />
                    <View style={{ width: 46, height: 30, borderRadius: 7, borderWidth: 0, overflow: 'hidden', position: 'absolute', bottom: 0 }}>
                        <Canvas style={{ width: 46, height: 30, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                            <Rect x={0} y={0} width={46} height={30}>
                                <LinearGradient
                                    start={vec(0, 0)}
                                    end={vec(46, 30)}
                                    colors={holdersCardColorsMap[accounts[0].card.personalizationCode] ?? holdersCardColorsMap['default-2']}
                                />
                            </Rect>
                        </Canvas>
                        {!!accounts[0].card.lastFourDigits && (
                            <Text style={{ color: 'white', fontSize: 7.5, position: 'absolute', bottom: 4.5, left: 5 }} numberOfLines={1}>
                                {accounts[0].card.lastFourDigits}
                            </Text>
                        )}
                        {(accounts[0] && accounts[0].type === 'virtual') && (
                            <MCard height={8} width={13} style={{ height: 8, width: 13, position: 'absolute', bottom: 5.25, right: 5.5 }} />
                        )}
                    </View>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontWeight: '600',
                        fontSize: 17,
                        lineHeight: 24,
                        color: Theme.textColor,
                    }}>
                        {t('products.zenPay.card.cards', { count: accounts.length })}
                    </Text>
                    <Text style={{
                        fontWeight: '400',
                        fontSize: 15,
                        lineHeight: 20,
                        color: '#838D99'
                    }}>
                        {t('products.zenPay.card.eurSubtitle')}
                    </Text>
                </View>
                <View style={{
                    backgroundColor: Theme.accent,
                    borderRadius: 16,
                    alignSelf: 'center',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                }}>
                    {collapsed && (
                        <Animated.Text
                            style={{
                                color: 'white',
                                fontWeight: '500',
                                fontSize: 15,
                                lineHeight: 20,
                            }}
                            entering={FadeIn}
                        >
                            {collapsed ? t('common.showAll') : t('common.hideAll')}
                        </Animated.Text>
                    )}
                    {!collapsed && (
                        <Animated.Text
                            style={{
                                color: 'white',
                                fontWeight: '500',
                                fontSize: 15,
                                lineHeight: 20,
                            }}
                            entering={FadeIn}
                        >
                            {t('common.hideAll')}
                        </Animated.Text>
                    )}
                </View>
            </Pressable>
            <AnimatedChildrenCollapsible
                collapsed={collapsed}
                items={accounts}
                renderItem={(item, index) => {
                    return (
                        <HoldersCardItem
                            key={`card-${index}`}
                            account={item}
                            last={index === accounts.length - 1}
                        />
                    )
                }}
            />
        </View>
    );
})