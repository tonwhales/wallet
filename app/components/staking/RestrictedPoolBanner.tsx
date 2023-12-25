import React, { memo, useCallback, useState } from "react";
import { View, Text, Pressable, useWindowDimensions, Image } from "react-native";
import { t } from "../../i18n/t";
import { openWithInApp } from "../../utils/openWithInApp";
import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { storage } from "../../storage/storage";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useNetwork, useTheme } from "../../engine/hooks";

import IcClose from '@assets/ic-close.svg';

const wasHiddenKey = 'pool-banner-hidden';

export const RestrictedPoolBanner = memo(({ type }: { type: 'club' | 'team' }) => {
    const theme = useTheme();
    const network = useNetwork();
    const dimentions = useWindowDimensions();

    const wasHisddenInit = storage.getBoolean(`${wasHiddenKey}-${type}`);
    const [wasHidden, setHidden] = useState(wasHisddenInit);

    const onLearMore = useCallback(() => {
        if (type === 'club') {
            openWithInApp(network.isTestnet ? 'https://test.tonwhales.com/club' : 'https://tonwhales.com/club');
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
        <Animated.View
            style={{ flex: 1 }}
            entering={FadeIn} exiting={FadeOut}
        >
            <Pressable
                style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center', borderRadius: 20,
                    marginBottom: 16,
                    paddingLeft: 20,
                    backgroundColor: theme.surfaceOnBg,
                    overflow: 'hidden',
                    opacity: pressed ? .5 : 1
                })}
                onPress={onLearMore}
            >
                <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
                    <Canvas style={{ flexGrow: 1 }}>
                        <Rect x={0} y={0} width={dimentions.width - 32} height={350}>
                            <LinearGradient
                                start={vec(-350, 0)}
                                end={vec(dimentions.width - 32, 0)}
                                colors={['#5B73FB', '#293EB3']}
                            />
                        </Rect>
                    </Canvas>
                </View>
                <View style={{ flexShrink: 1, marginRight: 8, paddingVertical: 20 }}>
                    <Text style={{
                        fontSize: 16,
                        color: theme.white,
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
                        color: theme.white,
                        fontWeight: '500',
                        marginTop: 12,
                        flexGrow: 1,
                        flexBasis: 0
                    }}>
                        {type === 'club' && t('products.staking.pools.clubBannerDescription')}
                        {type === 'team' && t('products.staking.pools.teamBannerDescription')}
                    </Text>
                </View>
                <Image
                    source={require('@assets/banners/staking-join-banner.webp')}
                    borderRadius={0}
                    style={{ backgroundColor: theme.transparent, height: 96, width: 121 }}
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