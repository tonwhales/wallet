import { memo, useCallback } from "react";
import { useHiddenBanners, useMarkBannerHidden } from "../../engine/hooks/banners";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { Pressable } from "react-native-gesture-handler";
import { View, Text, useWindowDimensions } from "react-native";
import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { Image } from "expo-image";
import { useSolanaSelectedAccount, useSolanaTokens, useTheme } from "../../engine/hooks";
import { Typography } from "../styles";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { SolanaToken } from "../../engine/api/solana/fetchSolanaTokens";

const bannerId = 'solana-banner';

export const SolanaBanner = memo(() => {
    const hiddenBanners = useHiddenBanners();
    const markBannerHidden = useMarkBannerHidden();
    const dimentions = useWindowDimensions();
    const theme = useTheme();
    const solanaAddress = useSolanaSelectedAccount()!;
    const navigation = useTypedNavigation();
    const tokens = useSolanaTokens(solanaAddress, false);
    const solanaTokens: SolanaToken[] = tokens?.data ?? [];
    const token = solanaTokens[0];

    const isHidden = hiddenBanners.includes(`${bannerId}-${solanaAddress}`);

    const onPress = () => {
        if (token) {
            navigation.navigateSolanaReceive({
                addr: solanaAddress,
                asset: {
                    mint: token.address,
                    content: {
                        icon: token.logoURI,
                        name: token.name
                    }
                }
            });
        } else {
            navigation.navigateSolanaReceive({ addr: solanaAddress });
        }
    }

    if (isHidden) {
        return null;
    }

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
        >
            <Pressable
                onPress={onPress}
                style={({ pressed }) => ({
                    opacity: pressed ? 0.5 : 1,
                    backgroundColor: theme.surfaceOnBg,
                    borderRadius: 20,
                    overflow: 'hidden',
                    marginHorizontal: 16, marginTop: 16
                })}
            >
                <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
                    <Canvas style={{ flexGrow: 1 }}>
                        <Rect
                            x={0} y={0}
                            width={dimentions.width - 32}
                            height={106 + 20}
                        >
                            <LinearGradient
                                start={vec(0, 0)}
                                end={vec(dimentions.width - 32, 0)}
                                positions={[0.08, 0.3, 0.5, 0.6, 0.90, 0.96]}
                                colors={['#9945FF', '#8752F3', '#5497D5', '#43B4CA', '#28E0B9', '#19FB9B']}
                            />
                        </Rect>
                    </Canvas>
                </View>
                <View style={{
                    flexDirection: 'row', flexGrow: 1,
                    alignItems: 'center', justifyContent: 'space-between',
                    paddingLeft: 20
                }}>
                    <View style={{ flexShrink: 1 }}>
                        <Text style={[{ color: theme.textUnchangeable }, Typography.semiBold15_20]}>
                            {t('solana.banner.title')}
                        </Text>
                        <Text style={[{ color: theme.textUnchangeable, opacity: 0.8 }, Typography.regular15_20]}>
                            {t('solana.banner.description')}
                        </Text>
                    </View>
                    <Image
                        style={{
                            width: 106,
                            height: 106,
                            marginRight: 10
                        }}
                        source={require('@assets/banners/solana-banner.webp')}
                    />
                </View>
                <Pressable
                    style={{
                        position: 'absolute',
                        top: 10, right: 10
                    }}
                    onPress={() => markBannerHidden(`${bannerId}-${solanaAddress}`)}
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
})