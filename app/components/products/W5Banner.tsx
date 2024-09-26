import { memo } from "react";
import { Pressable, View, useWindowDimensions, Image, Text } from "react-native";
import { useTheme, useV5IsAdded } from "../../engine/hooks";
import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { Typography } from "../styles";
import { useHiddenBanners, useMarkBannerHidden } from "../../engine/hooks/banners";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";
import { WalletVersions } from "../../engine/types";
import { useWalletVersion } from "../../engine/hooks/useWalletVersion";

import W5LabelIcon from '@assets/ic-w5-label.svg';

const bannerId = 'w5r1';

export const W5Banner = memo(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const dimentions = useWindowDimensions();
    const hiddenBanners = useHiddenBanners();
    const markBannerHidden = useMarkBannerHidden();
    const version = useWalletVersion();
    const alreadyAdded = useV5IsAdded();

    if (hiddenBanners.includes(bannerId) || version === WalletVersions.v5R1 || alreadyAdded) {
        return null;
    }

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
        >
            <Pressable
                onPress={() => navigation.navigate('W5Update')}
                style={({ pressed }) => ({
                    opacity: pressed ? 0.5 : 1,
                    height: 80,
                    backgroundColor: theme.surfaceOnBg,
                    borderRadius: 20,
                    overflow: 'hidden',
                    marginHorizontal: 16, marginBottom: 10
                })}
            >
                <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
                    <Canvas style={{ flexGrow: 1 }}>
                        <Rect
                            x={0} y={0}
                            width={dimentions.width - 32}
                            height={80}
                        >
                            <LinearGradient
                                start={vec(0, 0)}
                                end={vec(dimentions.width - 32, 0)}
                                colors={['#F54927', '#FAA046']}
                            />
                        </Rect>
                    </Canvas>
                </View>
                <View style={{
                    flexDirection: 'row', flexGrow: 1,
                    alignItems: 'center', justifyContent: 'space-between',
                    paddingLeft: 20
                }}>
                    <View>
                        <Text style={[{ color: theme.textUnchangeable }, Typography.semiBold15_20]}>
                            {t('w5.banner.title')}
                        </Text>
                        <Text style={[{ color: theme.textUnchangeable, opacity: 0.8 }, Typography.regular15_20]}>
                            {t('w5.banner.description')}
                        </Text>
                    </View>
                    <W5LabelIcon color={'white'} height={80} width={128} style={{ height: 80, width: 128 }} />
                </View>
                <Pressable
                    style={({ pressed }) => ({
                        position: 'absolute',
                        top: 10, right: 10,
                    })}
                    onPress={() => markBannerHidden(bannerId)}
                >
                    <Image
                        style={{
                            tintColor: theme.iconUnchangeable,
                            height: 24, width: 24
                        }}
                        source={require('@assets/ic-close.png')}
                    />
                </Pressable>
            </Pressable>
        </Animated.View>
    );
});