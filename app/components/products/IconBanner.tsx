import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../engine/hooks";
import i18n from 'i18next';
import { Image } from 'expo-image';
import { HoldersBannerContent } from "../../engine/api/holders/fetchAddressInviteCheck";
import { Typography } from "../styles";

export const IconBanner = memo(({ onPress, content, noAction }: { onPress: () => void, content: HoldersBannerContent, noAction?: boolean }) => {
    const theme = useTheme();
    const lang = i18n.language === 'ru' ? 'ru' : 'en';
    const title = content.title[lang] || content.title.en;
    const subtitle = content.subtitle[lang] || content.subtitle.en;
    const action = content.action[lang] || content.action.en;

    const icStyle = noAction ? styles.iconNoAction : [styles.icon, { backgroundColor: theme.accent }];
    const ic = noAction ? require('@assets/ic-holders-card.png') : require('@assets/ic-banner-card.png');

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => {
                return [
                    styles.pressable,
                    { opacity: pressed ? 0.5 : 1, backgroundColor: theme.surfaceOnBg, minHeight: 0 }
                ]
            }}
        >
            <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center', padding: 20, gap: 12 }}>
                <View style={icStyle}>
                    <Image
                        style={icStyle}
                        placeholder={ic}
                        contentFit={'contain'}
                    />
                </View>
                <View style={{
                    justifyContent: 'space-between',
                    flexGrow: 1, flexShrink: 1,
                }}>
                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                        ellipsizeMode={'tail'}
                        numberOfLines={2}
                    >
                        {title}
                    </Text>
                    <Text
                        style={[{ flex: 1, flexShrink: 1, color: theme.textSecondary, opacity: 0.8, }, Typography.regular15_20]}
                        ellipsizeMode={'tail'}
                        numberOfLines={3}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.95}
                    >
                        {subtitle}
                    </Text>
                </View>
                {!noAction ? (
                    <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: theme.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                        <Text style={[{ color: theme.textUnchangeable }, Typography.medium15_20]}>
                            {action}
                        </Text>
                    </View>
                ) : (
                    <Image
                        source={require('@assets/ic-chevron-right.png')}
                        style={{ height: 16, width: 16, tintColor: theme.iconPrimary }}
                    />
                )}
            </View>
        </Pressable>
    );
});

const styles = StyleSheet.create({
    pressable: {
        minHeight: 106,
        borderRadius: 20,
        overflow: 'hidden',
    },
    icon: {
        width: 46, height: 46,
        borderRadius: 23,
        justifyContent: 'center', alignItems: 'center',
    },
    iconNoAction: {
        width: 24, height: 24,
        justifyContent: 'center', alignItems: 'center'
    }
});
