import React, { memo, useCallback, useState } from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { t } from "../../i18n/t";
import { openWithInApp } from "../../utils/openWithInApp";
import { WImage } from "../WImage";
import { useAppConfig } from "../../utils/AppConfigContext";
import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { storage } from "../../storage/storage";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import IcClose from '@assets/ic-close.svg';

const wasHiddenKey = 'pool-banner-hidden';

export const RestrictedPoolBanner = memo(({ type }: { type: 'club' | 'team' }) => {
    const wasHisddenInit = storage.getBoolean(`${wasHiddenKey}-${type}`);
    const [wasHidden, setHidden] = useState(wasHisddenInit);
    const { Theme, AppConfig } = useAppConfig();
    const dimentions = useWindowDimensions();
    const onLearMore = useCallback(() => {
        if (type === 'club') {
            openWithInApp(AppConfig.isTestnet ? 'https://test.tonwhales.com/club' : 'https://tonwhales.com/club');
            return;
        }
        openWithInApp('https://whalescorp.notion.site/TonWhales-job-offers-235c45dc85af44718b28e79fb334eff1');
    }, [type]);

    const onDismiss = useCallback(() => {
        storage.set(`${wasHiddenKey}-${type}`, true);
        setHidden(true);
    }, []);

    if (wasHidden) {
        return null;
    }

    return (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Pressable
                style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center', borderRadius: 20,
                    marginBottom: 16, padding: 20,
                    backgroundColor: Theme.surfacePimary,
                    overflow: 'hidden',
                    opacity: pressed ? .5 : 1
                })}
                onPress={onLearMore}
            >
                <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
                    <Canvas style={{ flexGrow: 1 }}>
                        <Rect x={0} y={0} width={dimentions.width - 32} height={164}>
                            <LinearGradient
                                start={vec(-350, 0)}
                                end={vec(dimentions.width - 32, 0)}
                                colors={['#039DF500', '#029BF2']}
                            />
                        </Rect>
                    </Canvas>
                </View>
                <View style={{ flexShrink: 1, marginRight: 8 }}>
                    <Text style={{
                        fontSize: 16,
                        color: Theme.white,
                        fontWeight: '600',
                        flexGrow: 1,
                        flexBasis: 0
                    }}>
                        {type === 'club' && t('products.staking.pools.clubBanner')}
                        {type === 'team' && t('products.staking.pools.teamBanner')}
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        opacity: 0.8,
                        color: Theme.white,
                        fontWeight: '500',
                        marginTop: 12,
                        flexGrow: 1,
                        flexBasis: 0
                    }}>
                        {type === 'club' && t('products.staking.pools.clubBannerDescription')}
                        {type === 'team' && t('products.staking.pools.teamBannerDescription')}
                    </Text>
                </View>
                <WImage
                    requireSource={require('@assets/staking-join-banner.png')}
                    width={64}
                    heigh={64}
                    borderRadius={0}
                    style={{ backgroundColor: Theme.transparent }}
                />
                <Pressable
                    style={({ pressed }) => ({ opacity: pressed ? .25 : .5, position: 'absolute', top: 12, right: 12 })}
                    hitSlop={16}
                    onPress={onDismiss}
                >
                    <IcClose style={{ height: 24, width: 24 }} />
                </Pressable>
            </Pressable>
        </Animated.View>
    );
});