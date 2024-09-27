import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import i18n from 'i18next';
import { Image } from 'expo-image';
import { HoldersCustomBanner } from "../../engine/api/holders/fetchAddressInviteCheck";
import { Typography } from "../styles";
import { useHiddenBanners, useMarkBannerHidden } from "../../engine/hooks/banners";
import { LinearGradient } from "expo-linear-gradient";
import { avatarHash } from "../../utils/avatarHash";
import { MixpanelEvent, trackEvent } from "../../analytics/mixpanel";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";

const gradients = [
    ['#5245E5', '#BA39E5'],
    ['#3131CC', '#459DF5'],
    ['#42B842', '#1DB884'],
]

export const HoldersBanner = memo((props: { onPress?: () => void, persist?: boolean } & HoldersCustomBanner) => {
    const { isTestnet } = useNetwork();
    const selectedAccount = useSelectedAccount();
    const theme = useTheme();
    const lang = i18n.language === 'ru' ? 'ru' : 'en';
    const title = props.title[lang] || props.title.en;
    const subtitle = props.subtitle[lang] || props.subtitle.en;
    const hiddenBanners = useHiddenBanners();
    const markBannerHidden = useMarkBannerHidden();

    const gradientHash = avatarHash(selectedAccount?.addressString || '', gradients.length);
    const gradient = gradients[gradientHash];

    const id = `${props.id}-${selectedAccount?.addressString}`;

    const onPress = () => {
        trackEvent(
            MixpanelEvent.HoldersBanner,
            { id, gradient: gradientHash, wallet: selectedAccount?.addressString, isTestnet, home: !props.persist }
        );
        props.onPress?.();
    }

    if (hiddenBanners.includes(id) && !props.persist && props.closeable) {
        return null;
    }

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
        >
            <Pressable
                onPress={onPress}
                style={({ pressed }) => {
                    return [
                        styles.pressable,
                        { opacity: pressed ? 0.5 : 1, backgroundColor: theme.surfaceOnBg, }
                    ]
                }}
            >
                <LinearGradient
                    style={styles.gradient}
                    colors={gradient}
                    start={[0, 1]}
                    end={[1, 0]}
                />
                <View style={{ flexDirection: 'row', flexGrow: 1, alignItems: 'center' }}>
                    <View style={{
                        justifyContent: 'space-between', padding: 20,
                        flexGrow: 1, flexShrink: 1,
                    }}>
                        <Text style={[{ color: theme.textUnchangeable }, Typography.semiBold17_24]}
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                        >
                            {title}
                        </Text>
                        <Text
                            style={[{ flex: 1, flexShrink: 1, color: theme.textUnchangeable, opacity: 0.8, }, Typography.regular15_20]}
                            ellipsizeMode={'tail'}
                            numberOfLines={2}
                            adjustsFontSizeToFit={true}
                            minimumFontScale={0.95}
                        >
                            {subtitle}
                        </Text>
                    </View>
                    <Image
                        style={styles.img}
                        source={{ uri: props.imageUrl }}
                    />
                </View>
                {(!props.persist && props.closeable) && (
                    <Pressable
                        style={({ pressed }) => ({
                            position: 'absolute',
                            top: 10, right: 10,
                            opacity: pressed ? 0.5 : 1
                        })}
                        onPress={() => markBannerHidden(id)}
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

const styles = StyleSheet.create({
    gradient: {
        position: 'absolute',
        borderRadius: 20,
        left: 0, right: 0,
        top: 0, bottom: 0
    },
    pressable: {
        height: 106,
        borderRadius: 20,
        overflow: 'hidden'
    },
    img: {
        height: 106, width: 120,
        justifyContent: 'center', alignItems: 'center',
    }
});