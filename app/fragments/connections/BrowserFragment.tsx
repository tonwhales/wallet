import * as React from 'react';
import { useCallback, useState } from 'react';
import { Pressable, View, Image } from 'react-native';
import { fragment } from '../../fragment';
import { t } from '../../i18n/t';
import { resolveUrl } from '../../utils/resolveUrl';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { useLinkNavigator } from '../../useLinkNavigator';
import { useFocusEffect } from '@react-navigation/native';
import { TabHeader } from '../../components/topbar/TabHeader';
import { useNetwork, useTheme } from '../../engine/hooks';
import { setStatusBarStyle } from 'expo-status-bar';
import { BrowserTabs } from '../../components/browser/BrowserTabs';
import { BrowserSearch } from '../../components/browser/BrowserSearch';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const BrowserFragment = fragment(() => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const linkNavigator = useLinkNavigator(network.isTestnet);
    const safeArea = useSafeAreaInsets();

    const searchTranslateY = useSharedValue(0);
    const tabsTranslateY = useSharedValue(0);

    const searchAnimStyle = useAnimatedStyle(() => ({
        transform: [{
            translateY: withTiming(-searchTranslateY.value, { duration: 250 })
        }]
    }));
    const tabsAnimStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: -tabsTranslateY.value }]
    }));

    const onQRCodeRead = (src: string) => {
        try {
            let res = resolveUrl(src, network.isTestnet);
            if (res) {
                linkNavigator(res);
            }
        } catch {
            // Ignore
        }
    };

    const openScanner = useCallback(() => navigation.navigateScanner({ callback: onQRCodeRead }), []);

    useFocusEffect(useCallback(() => {
        setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark');
    }, [theme.style]));

    return (
        <View style={{ flex: 1 }}>
            <View style={{ height: 44, marginBottom: 8 }} />
            <View style={{ marginTop: 44 + 8 }}>
                <Animated.View style={searchAnimStyle}>
                    <BrowserSearch
                        navigation={navigation}
                        theme={theme}
                        isTestnet
                    />
                </Animated.View>
                <Animated.View style={tabsAnimStyle}>
                    <BrowserTabs
                        onScroll={(e) => {
                            console.log(e.nativeEvent.contentOffset.y);
                            if (e.nativeEvent.contentOffset.y < 58 + 16 && e.nativeEvent.contentOffset.y >= 29) {
                                tabsTranslateY.value = e.nativeEvent.contentOffset.y;
                            } else if (e.nativeEvent.contentOffset.y < 0 && e.nativeEvent.contentOffset.y < 29) {
                                tabsTranslateY.value = 0;
                            } else {
                                tabsTranslateY.value = 58 + 16;
                            }
                            if (e.nativeEvent.contentOffset.y > 29) {
                                searchTranslateY.value = e.nativeEvent.contentOffset.y - 29;
                            } else {
                                searchTranslateY.value = 0;
                            }
                        }}
                    />
                </Animated.View>
            </View>
            <View style={{ height: 44, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1001 }}>
                <TabHeader
                    title={t('home.browser')}
                    style={{
                        height: 44 + safeArea.top,
                        marginTop: 0,
                        paddingTop: safeArea.top,
                    }}
                    rightAction={
                        <Pressable
                            style={({ pressed }) => ({
                                opacity: pressed ? 0.5 : 1,
                                backgroundColor: theme.surfaceOnBg,
                                height: 32, width: 32, justifyContent: 'center', alignItems: 'center',
                                borderRadius: 16
                            })}
                            onPress={openScanner}
                        >
                            <Image
                                source={require('@assets/ic-scan-main.png')}
                                style={{
                                    height: 22,
                                    width: 22,
                                    tintColor: theme.iconNav
                                }}
                            />
                        </Pressable>
                    }
                />
            </View>
        </View>
    );
});