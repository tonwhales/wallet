import React, { useEffect, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { AppData } from "../engine/api/fetchAppData";
import { useEngine } from "../engine/Engine";
import { AppManifest } from "../engine/api/fetchManifest";
import { extractDomain } from "../engine/utils/extractDomain";
import { WImage } from "./WImage";
import { useAppConfig } from "../utils/AppConfigContext";
import Animated from "react-native-reanimated";
import { isUrl } from "../utils/resolveUrl";
import { useAnimatedPressedInOut } from "../utils/useAnimatedPressedInOut";
import { Swipeable } from "react-native-gesture-handler";

import Delete from '@assets/ic-delete.svg';
import Star from '@assets/ic-rating-star.svg';

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

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    let app: AppInfo = useMemo(() => {
        if (appData) {
            return { ...appData, type: 'app-data' };
        } else if (appManifest && tonconnect) {
            return { ...appManifest, type: 'app-manifest' };
        } else {
            return null;
        }
    }, [appData, appManifest, tonconnect]);

    useEffect(() => {
        engine.products.extensions.requestExtensionStatsUpdate(url);
    }, []);

    return (
        <Pressable
            onPressIn={(!!onPress || !!onLongPress) ? onPressIn : undefined}
            onPressOut={(!!onPress || !!onLongPress) ? onPressOut : undefined}
            onPress={onPress}
            onLongPress={onLongPress}
        >
            <Swipeable
                containerStyle={{ flex: 1, paddingHorizontal: 16 }}
                renderRightActions={!!onRevoke ? () => {
                    return (
                        <Pressable style={({ pressed }) => {
                            return {
                                height: '100%',
                                paddingHorizontal: 24,
                                borderRadius: 20,
                                marginRight: 16,
                                backgroundColor: Theme.accentRed,
                                justifyContent: 'center', alignItems: 'center',
                                opacity: pressed ? 0.5 : 1
                            }
                        }}
                            onPress={onRevoke}
                        >
                            <Delete color={'white'} height={24} width={24} style={{ height: 24, width: 24 }} />
                        </Pressable>
                    )
                } : undefined}
            >
                <Animated.View style={[
                    {
                        flex: 1,
                        padding: 20,
                        borderRadius: 20,
                        backgroundColor: Theme.border, flexDirection: 'row',
                        alignItems: 'center', justifyContent: 'center',
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
                                color: Theme.textPrimary,
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
                            color: Theme.textSecondary,
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
                                    color: Theme.textPrimary,
                                    marginLeft: 4
                                }}>
                                    {stats.rating}
                                </Text>
                                <Text style={{
                                    fontSize: 15, lineHeight: 20,
                                    fontWeight: '400',
                                    color: Theme.textSecondary,
                                    marginLeft: 4
                                }}>
                                    {`(${stats.reviewsCount})`}
                                </Text>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </Swipeable>
        </Pressable>
    );
})