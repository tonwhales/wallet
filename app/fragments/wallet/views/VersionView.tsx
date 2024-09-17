import { memo } from "react";
import { useAppVersionsConfig } from "../../../engine/hooks/useAppVersionsConfig";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { Pressable, View, Text, Platform, Linking } from "react-native";
import { useTheme } from "../../../engine/hooks";
import { t } from "../../../i18n/t";
import { Image } from "expo-image";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { newVersionUrl } from "../../../utils/newVersionUrl";
import { useHiddenBanners, useMarkBannerHidden } from "../../../engine/hooks/banners";

export const VersionView = memo(() => {
    const theme = useTheme();
    const versions = useAppVersionsConfig();
    const bottomBarHeight = useBottomTabBarHeight();
    const hiddenBanners = useHiddenBanners();
    const markBannerHidden = useMarkBannerHidden();

    if (!versions.data) {
        return null;
    }

    const info: { url: string, isCiritical: boolean } | null = newVersionUrl(versions.data);

    if (!info) {
        return null;
    }

    const platform = Platform.OS === 'android' ? 'android' : 'ios';
    const bannerKey = `update-${platform}-${versions.data[platform]?.latest}`;

    if (hiddenBanners.includes(bannerKey) && !info.isCiritical) {
        return null;
    }

    return (
        <Animated.View
            style={{
                position: 'absolute',
                justifyContent: 'center', alignItems: 'center',
                bottom: bottomBarHeight + 16,
                left: 0, right: 0
            }}
            entering={FadeInDown}
            exiting={FadeOutDown}
        >
            <View style={{
                flexDirection: 'row', flexGrow: 0, flexShrink: 1,
                minHeight: 44,
                paddingVertical: 2, paddingHorizontal: 16,
                justifyContent: 'center', alignItems: 'center',
                backgroundColor: info.isCiritical ? theme.warning : theme.accent,
                borderRadius: 16
            }}>
                <Pressable
                    style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, flexDirection: 'row', alignItems: 'center' })}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    onPress={() => Linking.openURL(info.url)}
                >
                    {info.isCiritical && (
                        <Image
                            style={{ width: 24, height: 24, tintColor: theme.textUnchangeable, marginRight: 6 }}
                            source={require('@assets/ic-spam.png')}
                        />
                    )}
                    <Text style={[{ color: theme.textUnchangeable }]}>
                        {t('update.callToAction')}
                    </Text>
                    {info.isCiritical && (
                        <Image
                            source={require('@assets/ic-chevron-right.png')}
                            style={{ height: 16, width: 16, tintColor: theme.textPrimaryInverted }}
                        />
                    )}
                </Pressable>
                {!info.isCiritical && (
                    <>
                        <View style={{ width: 1, height: 28, backgroundColor: theme.textUnchangeable, marginHorizontal: 12 }} />
                        <Pressable
                            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                            onPress={() => markBannerHidden(bannerKey)}
                            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                        >
                            <Image
                                style={{ width: 14, height: 14, tintColor: theme.textUnchangeable }}
                                source={require('@assets/ic-xmark.png')}
                            />
                        </Pressable>
                    </>
                )}
            </View>
        </Animated.View>
    );
});