import { memo } from "react";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { Pressable, useWindowDimensions, View, Text } from "react-native";
import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { Image } from 'expo-image';
import { Typography } from "../styles";
import { t } from "../../i18n/t";
import { ThemeType } from "../../engine/state/theme";

interface ChangellyBannerProps {
    onPress: () => void;
    onClose?: () => void;
    theme: ThemeType;
}

export const ChangellyBanner = memo(({ onPress, onClose, theme }: ChangellyBannerProps) => {
    const dimentions = useWindowDimensions();

    return (
        <Animated.View
            entering={onClose ? FadeInUp : undefined}
            exiting={onClose ? FadeOutDown : undefined}
        >
            <Pressable
                onPress={onPress}
                style={({ pressed }) => ({
                    opacity: pressed ? 0.5 : 1,
                    height: 106,
                    backgroundColor: theme.surfaceOnBg,
                    borderRadius: 20,
                    overflow: 'hidden',
                    marginTop: 16
                })}
            >
                <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
                    <Canvas style={{ flexGrow: 1 }}>
                        <Rect
                            x={0} y={0}
                            width={dimentions.width - 32}
                            height={106}
                        >
                            <LinearGradient
                                start={vec(0, 0)}
                                end={vec(dimentions.width - 32, 0)}
                                colors={['#77818B', '#444647']}
                            />
                        </Rect>
                    </Canvas>
                </View>
                <View style={{
                    flexDirection: 'row', flexGrow: 1,
                    alignItems: 'center', justifyContent: 'space-between',
                    paddingLeft: 20
                }}>
                    <View style={{ flex: 1 }}>
                        <Text style={[{ color: theme.textUnchangeable }, Typography.semiBold15_20]}>
                            {t('changelly.bannerTitle')}
                        </Text>
                        <Text style={[{ color: theme.textUnchangeable, opacity: 0.8 }, Typography.regular15_20]}>
                            {t('changelly.bannerDescription')}
                        </Text>
                    </View>
                    <Image
                        style={{
                            height: 96, width: 120,
                            alignSelf: 'flex-end'
                        }}
                        source={require('@assets/holders-changelly-banner.png')}
                    />
                </View>
                {onClose && (
                    <Pressable
                        style={() => ({
                            position: 'absolute',
                            top: 10, right: 10,
                        })}
                        onPress={onClose}
                    >
                        <Image
                            style={{
                                tintColor: theme.iconUnchangeable,
                                height: 24, width: 24
                            }}
                            source={require('@assets/ic-close.png')}
                        />
                    </Pressable>
                )}
            </Pressable>
        </Animated.View>
    );
}); 