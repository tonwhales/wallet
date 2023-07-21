import React, { useCallback, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { AppData } from "../engine/api/fetchAppData";
import { useEngine } from "../engine/Engine";
import { AppManifest } from "../engine/api/fetchManifest";
import { extractDomain } from "../engine/utils/extractDomain";
import { t } from "../i18n/t";
import { WImage } from "./WImage";
import { useAppConfig } from "../utils/AppConfigContext";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Star from '../../assets/ic-rating-star.svg';
import { isUrl } from "../utils/resolveUrl";

type AppInfo = (AppData & { type: 'app-data' }) | (AppManifest & { type: 'app-manifest' }) | null;

export const ConnectionButton = React.memo((
    {
        name,
        url,
        tonconnect,
        onRevoke,
        onPress,
        onLongPress
    }: {
        name: string,
        url: string,
        tonconnect?: boolean,
        onRevoke?: () => void,
        onPress?: () => void,
        onLongPress?: () => void
    }
) => {
    const { Theme } = useAppConfig();
    const engine = useEngine();
    const appData = engine.products.extensions.useAppData(url);
    const appManifest = engine.products.tonConnect.useAppManifest(url);
    const stats = engine.products.extensions.useExtensionStats(url);

    const description = useMemo(() => {
        if (!!appData?.description) {
            return appData.description;
        }
        if (!!stats?.metadata?.description) {
            return stats.metadata.description;
        }

        return isUrl(appManifest?.url || url)
            ? extractDomain(appManifest?.url || url)
            : (appManifest?.url || url);

    }, [appData, appManifest, stats, url]);

    const animatedValue = useSharedValue(1);

    const onPressIn = useCallback(() => {
        animatedValue.value = withTiming(0.98, { duration: 100 });
    }, [animatedValue]);

    const onPressOut = useCallback(() => {
        animatedValue.value = withTiming(1, { duration: 100 });
    }, [animatedValue]);

    const animatedStyle = useAnimatedStyle(() => {
        return { transform: [{ scale: animatedValue.value }], };
    });

    let app: AppInfo = useMemo(() => {
        if (appData) {
            return { ...appData, type: 'app-data' };
        } else if (appManifest && tonconnect) {
            return { ...appManifest, type: 'app-manifest' };
        } else {
            return null;
        }
    }, [appData, appManifest, tonconnect]);

    return (
        <Pressable
            onPressIn={(!!onPress || !!onLongPress) ? onPressIn : undefined}
            onPressOut={(!!onPress || !!onLongPress) ? onPressOut : undefined}
            onPress={onPress}
            onLongPress={onLongPress}
        >
            <Animated.View style={[
                {
                    borderRadius: 14,
                    backgroundColor: Theme.lightGrey, flexDirection: 'row',
                    alignItems: 'center', justifyContent: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 20, flex: 1
                },
                animatedStyle
            ]}>
                <WImage
                    heigh={56}
                    width={56}
                    src={app?.type === 'app-data' ? app?.image?.preview256 : app?.iconUrl}
                    blurhash={app?.type === 'app-data' ? app?.image?.blurhash : undefined}
                    borderRadius={12}
                    style={{ marginRight: 12 }}
                />
                <View
                    style={{
                        flexDirection: 'column',
                        flexGrow: 1, flexShrink: 1,
                        justifyContent: 'center'
                    }}
                >
                    {!!name && (
                        <Text style={{
                            fontSize: 17, lineHeight: 24,
                            color: Theme.textColor,
                            fontWeight: '600'
                        }}
                            numberOfLines={1}
                            ellipsizeMode={'tail'}
                        >
                            {name}
                        </Text>
                    )}
                    <Text style={{
                        fontSize: 15, lineHeight: 20,
                        fontWeight: '400',
                        color: Theme.darkGrey,
                        flexShrink: 1
                    }}
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                    >
                        {description}
                    </Text>
                    {!!stats && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Star
                                height={13}
                                width={13}
                                style={{ height: 13, width: 13 }}
                            />
                            <Text style={{
                                fontSize: 15, lineHeight: 20,
                                fontWeight: '400',
                                color: Theme.textColor,
                                marginLeft: 4
                            }}>
                                {stats.rating}
                            </Text>
                        </View>
                    )}
                </View>
                {!!onRevoke && (
                    <Pressable
                        style={({ pressed }) => {
                            return {
                                marginLeft: 10,
                                opacity: pressed ? 0.3 : 1,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }
                        }}
                        onPress={onRevoke}
                    >
                        <Text
                            style={{
                                fontWeight: '500',
                                color: Theme.red,
                                fontSize: 16
                            }}
                        >
                            {t('common.delete')}
                        </Text>
                    </Pressable>
                )}
            </Animated.View>
        </Pressable>
    );
})