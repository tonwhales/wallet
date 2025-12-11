import { memo, useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../../../engine/hooks";
import { usdyMintAddress } from "../../../../secure/KnownWallets";
import { useTokenInfo } from "../../../../engine/hooks/useTokenInfo";
import { openWithInApp } from "../../../../utils/openWithInApp";
import Collapsible from "react-native-collapsible";
import { Typography } from "../../../../components/styles";
import { t } from "../../../../i18n/t";
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Image } from "expo-image";

export const SolanaTokenInfoView = memo(({ mint }: { mint: string }) => {
    const theme = useTheme();
    const tokenId = mint === usdyMintAddress ? '29256' : undefined;
    const tokenInfo = useTokenInfo(tokenId).data;
    const [collapsed, setCollapsed] = useState(true);
    const progress = useSharedValue(0);

    const chevronStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${interpolate(progress.value, [0, 1], [90, 270])}deg` }]
    }));

    useEffect(() => {
        progress.value = withTiming(collapsed ? 0 : 1, {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
        });
    }, [collapsed]);

    if (!tokenInfo) {
        return null;
    }

    return (
        <View style={{ backgroundColor: theme.surfaceOnBg, borderRadius: 16, padding: 20, paddingBottom: 0, marginHorizontal: 20 }}>
            <Pressable
                onPress={() => setCollapsed(!collapsed)}
                style={{}}
            >
                {!!tokenInfo?.description?.description && (
                    <Text style={[Typography.medium15_20, { color: theme.textSecondary }]}>
                        {tokenInfo.description.description}
                    </Text>
                )}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: theme.surfaceOnBg,
                    borderRadius: 100,
                    gap: 4,
                    marginBottom: 20, marginTop: 10,
                    height: 36
                }}>
                    <Text style={[Typography.semiBold17_24, { color: theme.textPrimary }]}>
                        {t('common.moreAbout', { name: tokenInfo.data.symbol })}
                    </Text>
                    <Animated.View style={chevronStyle}>
                        <Image
                            source={require('@assets/ic-chevron-right.png')}
                            style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                        />
                    </Animated.View>
                </View>
            </Pressable>
            <Collapsible collapsed={collapsed}>
                {!!tokenInfo.description && (
                    <>
                        <View style={{ gap: 16, marginBottom: 20 }}>
                            {tokenInfo.description.items.map((item) => item.type === 'link'
                                ? (
                                    <Pressable
                                        key={item.url}
                                        style={{ marginVertical: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                                        onPress={() => openWithInApp(item.url)}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Image
                                                source={require('@assets/ic-browser-link.png')}
                                                style={{ height: 24, width: 24, tintColor: theme.iconPrimary, marginRight: 12 }}
                                            />
                                            <Text
                                                style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                                            >
                                                {item.title}
                                            </Text>
                                        </View>
                                        <Image
                                            source={require('@assets/ic-chevron-right.png')}
                                            style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                                        />

                                    </Pressable>
                                )
                                : (
                                    <View>
                                        <Text
                                            style={[{ color: theme.textSecondary }, Typography.regular15_20]}
                                            key={item.title}
                                        >
                                            {item.title}
                                        </Text>
                                        <Text
                                            style={[{ color: theme.textPrimary, marginTop: 2 }, Typography.medium15_20]}
                                            key={item.value}
                                        >
                                            {item.value}
                                        </Text>
                                    </View>
                                )
                            )}
                        </View>
                    </>
                )}
            </Collapsible>
        </View>
    );
});