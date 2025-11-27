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
        transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 90])}deg` }]
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
        <View style={{ backgroundColor: theme.surfaceOnBg, borderRadius: 16, padding: 20, marginHorizontal: 20 }}>
            <Pressable
                onPress={() => setCollapsed(!collapsed)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
                <Text style={[Typography.semiBold15_20, { color: theme.textPrimary }]}>
                    {tokenInfo.data.name}
                </Text>
                <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: theme.surfaceOnBg,
                    paddingVertical: 8, paddingHorizontal: 6,
                    borderRadius: 100,
                    gap: 4
                }}>
                    <Text style={[{ color: theme.textSecondary, marginRight: 6 }, Typography.medium13_18]}>
                        {collapsed ? t('common.showMore') : t('common.hide')}
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
                        <Text style={[
                            { marginTop: 4, marginBottom: 8, color: theme.textSecondary },
                            Typography.regular15_20
                        ]}>
                            {tokenInfo.description.description}
                        </Text>
                        <View style={{ gap: 8 }}>
                            {tokenInfo.description.items.map((item) => item.type === 'link'
                                ? (
                                    <Pressable
                                        key={item.url}
                                        style={{ marginVertical: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                                        onPress={() => openWithInApp(item.url)}
                                    >
                                        <Text
                                            style={[{ color: theme.accent, textDecorationLine: 'underline' }, Typography.semiBold15_20]}
                                        >
                                            {item.title}
                                        </Text>
                                        <Image
                                            source={require('@assets/ic-chevron-right.png')}
                                            style={{ height: 16, width: 16, tintColor: theme.accent }}
                                        />
                                    </Pressable>
                                )
                                : (
                                    <View>
                                        <Text
                                            style={{ color: theme.textSecondary }}
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