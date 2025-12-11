import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { memo, useMemo } from "react";
import { useHoldersAccountStatus, useIsConnectAppReady, useNetwork, useTheme } from "../../engine/hooks";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { useHiddenBanners, useMarkBannerHidden } from "../../engine/hooks/banners";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Address } from "@ton/ton";
import { holdersUrl, HoldersUserState } from "../../engine/api/holders/fetchUserState";
import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { Typography } from "../styles";
import { t } from "../../i18n/t";
import { Image } from "expo-image";

const bannerId = 'ai-chat-banner';

export const AiChatBanner = memo(({ address, }: { address: Address }) => {
    const theme = useTheme();
    const dimentions = useWindowDimensions();
    const { isTestnet } = useNetwork();
    const hiddenBanners = useHiddenBanners();
    const markBannerHidden = useMarkBannerHidden();
    const navigation = useTypedNavigation();
    const holdersAccStatus = useHoldersAccountStatus(address).data;
    const url = holdersUrl(isTestnet);
    const isHoldersReady = useIsConnectAppReady(url, address?.toString({ testOnly: isTestnet }));

    const needsEnrollment = useMemo(() => {
        if (!isHoldersReady) {
            return true;
        }

        if (!holdersAccStatus) {
            return true;
        }

        if (holdersAccStatus.state === HoldersUserState.NeedEnrollment) {
            return true;
        }

        return false;
    }, [holdersAccStatus, isHoldersReady]);

    const isHidden = hiddenBanners.includes(`${bannerId}`);

    if (isHidden || needsEnrollment) {
        return null;
    }

    const onPress = () => {
        navigation.navigate('AIChatTab');
    }

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
            style={{ paddingHorizontal: 16 }}
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
                                colors={['#397DF4', '#5B21D0']}
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
                            {t('aiChat.banner.title')}
                        </Text>
                        <Text style={[{ color: theme.textUnchangeable, opacity: 0.8 }, Typography.regular15_20]}>
                            {t('aiChat.banner.description')}
                        </Text>
                    </View>
                    <Image
                        style={{
                            height: 96, width: 112,
                            alignSelf: 'flex-end'
                        }}
                        source={require('@assets/banners/ai_banner.png')}
                    />
                </View>
                <Pressable
                    style={() => ({
                        position: 'absolute',
                        top: 10, right: 10,
                    })}
                    onPress={() => markBannerHidden(`${bannerId}`)}
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