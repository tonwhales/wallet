import React, { memo, useEffect, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { AppData } from "../engine/api/fetchAppData";
import { AppManifest } from "../engine/api/fetchManifest";
import { extractDomain } from "../engine/utils/extractDomain";
import { WImage } from "./WImage";
import Animated from "react-native-reanimated";
import { isUrl } from "../utils/resolveUrl";
import { useAnimatedPressedInOut } from "../utils/useAnimatedPressedInOut";
import { Swipeable, TouchableHighlight } from "react-native-gesture-handler";
import { useAppData, useAppManifest, useTheme } from "../engine/hooks";
import { useExtensionStats } from "../engine/hooks/dapps/useExtensionStats";

import Delete from '@assets/ic-delete.svg';
import Star from '@assets/ic-rating-star.svg';

type AppInfo = (AppData & { type: 'app-data' }) | (AppManifest & { type: 'app-manifest' }) | null;

export const ConnectionButton = memo((
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
    const theme = useTheme();
    const appData = useAppData(url);
    const appManifest = useAppManifest(url);
    const stats = useExtensionStats(url);

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

    return (
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
                            backgroundColor: theme.accentRed,
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
            <TouchableHighlight
                onPressIn={(!!onPress || !!onLongPress) ? onPressIn : undefined}
                onPressOut={(!!onPress || !!onLongPress) ? onPressOut : undefined}
                onPress={onPress}
                onLongPress={onLongPress}
                underlayColor={theme.surfaceOnBg}
                style={{
                    padding: 20,
                    borderRadius: 20,
                    backgroundColor: theme.surfaceOnBg,
                }}
            >
                <Animated.View style={[
                    {
                        flex: 1, flexDirection: 'row',
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
                                color: theme.textPrimary,
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
                            color: theme.textSecondary,
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
                                    color: theme.textPrimary,
                                    marginLeft: 4
                                }}>
                                    {stats.rating}
                                </Text>
                                <Text style={{
                                    fontSize: 15, lineHeight: 20,
                                    fontWeight: '400',
                                    color: theme.textSecondary,
                                    marginLeft: 4
                                }}>
                                    {`(${stats.reviewsCount})`}
                                </Text>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </TouchableHighlight>
        </Swipeable>
    );
})