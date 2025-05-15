import { memo } from "react";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Pressable } from "react-native-gesture-handler";
import { View, Text } from "react-native";
import { Typography } from "../styles";
import { Image } from "expo-image";
import { useStakingApy, useTheme } from "../../engine/hooks";
import { t } from "../../i18n/t";

export const StakingProductBanner = memo(({ isLedger }: { isLedger?: boolean }) => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const apy = useStakingApy()?.apy;
    const apyWithFee = apy ? (apy - apy * (5 / 100)).toFixed(2) : undefined;

    const onClick = () => {
        navigation.navigateStakingPools(isLedger);
    }

    return (
        <Pressable
            onPress={onClick}
            style={({ pressed }) => ({
                minHeight: 106,
                borderRadius: 20,
                overflow: 'hidden',
                backgroundColor: theme.surfaceOnBg,
                opacity: pressed ? 0.5 : 1
            })}
        >
            <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center' }}>
                <View style={{
                    flex: 1,
                    flexGrow: 1, flexShrink: 1,
                    gap: 7,
                    paddingVertical: 20, paddingLeft: 20
                }}>
                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                        ellipsizeMode={'tail'}
                        numberOfLines={2}
                    >
                        {t('products.staking.title')}
                    </Text>
                    <Text
                        style={[{ flex: 1, flexShrink: 1, color: theme.textSecondary, opacity: 0.8, marginBottom: 8 }, Typography.regular15_20]}
                        ellipsizeMode={'tail'}
                        numberOfLines={2}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.75}
                    >
                        {t("products.staking.subtitle.join", { apy: apyWithFee ?? '8' })}
                    </Text>
                    <View style={{ flexDirection: 'row', flexShrink: 1 }}>
                        <View style={{
                            flexDirection: 'row', flexShrink: 1,
                            alignItems: 'center',
                            backgroundColor: theme.accent,
                            paddingLeft: 16, paddingVertical: 6, paddingRight: 14,
                            borderRadius: 50,
                            minHeight: 32,
                            gap: 6
                        }}>
                            <Text
                                style={[
                                    { color: theme.textUnchangeable, flexShrink: 1 },
                                    Typography.medium15_20,
                                    { lineHeight: undefined }
                                ]}
                                adjustsFontSizeToFit
                                minimumFontScale={0.85}
                                numberOfLines={2}
                                lineBreakMode="tail"
                            >
                                {t('products.staking.join.buttonTitle')}
                            </Text>
                            <Image
                                source={require('@assets/ic-chevron-right.png')}
                                style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                            />
                        </View>
                    </View>
                </View>
                <Image
                    style={{
                        width: 140,
                        height: 152
                    }}
                    contentFit="contain"
                    source={require('@assets/staking-banner.png')}
                />
            </View>
        </Pressable>
    );
});