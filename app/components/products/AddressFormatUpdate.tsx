import { memo } from "react";
import { Pressable, View, useWindowDimensions, Image, Text } from "react-native";
import { useBounceableWalletFormat, useTheme } from "../../engine/hooks";
import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { Typography } from "../styles";
import { useHiddenBanners, useMarkBannerHidden } from "../../engine/hooks/banners";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";
import { useWalletVersion } from "../../engine/hooks/useWalletVersion";
import { WalletVersions } from "../../engine/types";

const bannerId = 'bounceable-format-update';

export const AddressFormatUpdate = memo(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const dimentions = useWindowDimensions();
    const hiddenBanners = useHiddenBanners();
    const [bounceableFormat,] = useBounceableWalletFormat();
    const markBannerHidden = useMarkBannerHidden();
    const walletVersion = useWalletVersion();
    
    if (hiddenBanners.includes(bannerId) || !bounceableFormat || walletVersion === WalletVersions.v5R1) {
        return null;
    }

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
        >
            <Pressable
                onPress={() => navigation.navigate('NewAddressFormat')}
                style={({ pressed }) => ({
                    opacity: pressed ? 0.5 : 1,
                    height: 80,
                    backgroundColor: theme.surfaceOnBg,
                    borderRadius: 20,
                    overflow: 'hidden',
                    marginHorizontal: 16, marginBottom: 10, marginTop: 16
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
                                colors={['#77818B', '#444647']}
                            />
                        </Rect>
                    </Canvas>
                </View>
                <View style={{
                    flexDirection: 'row', flexGrow: 1,
                    alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 20
                }}>
                    <View>
                        <Text style={[{ color: theme.textUnchangeable }, Typography.semiBold15_20]}>
                            {t('newAddressFormat.bannerTitle')}
                        </Text>
                        <Text style={[{ color: theme.textUnchangeable, opacity: 0.8 }, Typography.regular15_20]}>
                            {t('newAddressFormat.bannerDescription')}
                        </Text>
                    </View>
                    <Image
                        style={{
                            height: 68, width: 93,
                            justifyContent: 'center', alignItems: 'center',
                        }}
                        source={require('@assets/ic-address-update.png')}
                    />
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