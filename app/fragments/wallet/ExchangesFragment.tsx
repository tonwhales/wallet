import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { View, Platform, Pressable, Text } from "react-native";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useLanguage, useNetwork, usePrimaryCurrency, useTheme } from "../../engine/hooks";
import { StatusBar } from "expo-status-bar";
import { GeneralHoldersAccount } from "../../engine/api/holders/fetchAccounts";
import { DAppWebView, DAppWebViewProps } from "../../components/webview/DAppWebView";
import { holdersUrl } from "../../engine/api/holders/fetchUserState";
import Animated, { Easing, Extrapolation, FadeInDown, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { MixpanelEvent, trackEvent } from "../../analytics/mixpanel";
import { ScreenHeader } from "../../components/ScreenHeader";
import { Image } from 'expo-image';
import { ThemeType } from "../../engine/state/theme";
import { t } from "../../i18n/t";
import { RoundButton } from "../../components/RoundButton";
import { Typography } from "../../components/styles";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { openWithInApp } from "../../utils/openWithInApp";
import { holdersSupportUrl, holdersSupportWebUrl, supportFormUrl } from "../holders/components/HoldersAppComponent";

export type ExchangesFragmentParams = {
    type: 'holders'
    holdersAccount: GeneralHoldersAccount
} | {
    type: 'wallet',
    address: string,
    ticker: string,
    tokenContract?: string
}

const Placeholder = memo(({
    theme,
    onReload,
    onSupport,
    showClose
}: {
    theme: ThemeType,
    onReload?: () => void,
    onSupport?: () => void,
    showClose?: boolean
}) => {
    const safeArea = useSafeAreaInsets();
    const animation = useSharedValue(0);

    useEffect(() => {
        animation.value = withRepeat(
            withTiming(1, {
                duration: 500,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1)
            }),
            14,
            true,
        );
    }, []);

    const animatedStyles = useAnimatedStyle(() => {
        const opacity = interpolate(
            animation.value,
            [0, 1],
            [1, theme.style === 'dark' ? 0.75 : 1],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            animation.value,
            [0, 1],
            [1, 1.01],
            Extrapolation.CLAMP
        )
        return {
            opacity: opacity,
            transform: [{ scale: scale }],
        };
    }, [theme.style]);

    return (
        <View style={[
            { flexGrow: 1, width: '100%', opacity: 0.8, gap: 16 },
            Platform.select({
                ios: { paddingTop: safeArea.top - 8 },
                android: { paddingTop: safeArea.top }
            })
        ]}>
            <Animated.View
                style={[{
                    backgroundColor: theme.surfaceOnBg,
                    height: 64,
                    borderRadius: 20,
                    marginHorizontal: 16,
                    marginTop: safeArea.top + 32
                }, animatedStyles]}
            />
            <Animated.View
                style={[{
                    backgroundColor: theme.surfaceOnBg,
                    height: 84,
                    borderRadius: 20,
                    marginHorizontal: 16
                }, animatedStyles]}
            />
            <Animated.View
                style={[{
                    backgroundColor: theme.surfaceOnBg,
                    height: 84,
                    borderRadius: 20,
                    marginHorizontal: 16
                }, animatedStyles]}
            />
            <Animated.View
                style={[{
                    backgroundColor: theme.surfaceOnBg,
                    height: 84,
                    borderRadius: 20,
                    marginHorizontal: 16
                }, animatedStyles]}
            />

            {(onReload || onSupport) && (
                <View style={{
                    flexGrow: 1,
                    paddingHorizontal: 16, paddingBottom: safeArea.bottom,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <Image
                        source={require('@assets/ic-bad-connection.png')}
                        style={{ width: 84, height: 84, marginBottom: 16 }}
                    />
                    <Text style={[{ color: theme.textPrimary, marginBottom: 8, textAlign: 'center' }, Typography.semiBold24_30]}>
                        {t('products.holders.loadingLongerTitle')}
                    </Text>
                    <Text style={[{ color: theme.textSecondary, textAlign: 'center', marginBottom: 24, marginHorizontal: 32 }, Typography.regular17_24]}>
                        {t('products.holders.loadingLonger')}
                    </Text>
                    <View style={{ gap: 16, width: '100%' }}>
                        {onReload && (
                            <Animated.View entering={FadeInDown}>
                                <RoundButton
                                    title={t('common.reload')}
                                    onPress={onReload}
                                    style={{ alignSelf: 'stretch' }}
                                />
                            </Animated.View>
                        )}
                        {onSupport && (
                            <Animated.View entering={FadeInDown}>
                                <RoundButton
                                    title={t('webView.contactSupport')}
                                    onPress={onSupport}
                                    display={'secondary'}
                                    style={[
                                        { alignSelf: 'stretch' },
                                        Platform.select({ android: { marginBottom: 16 + safeArea.bottom } })
                                    ]}
                                />
                            </Animated.View>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
});

const ExchangesLoader = memo(({
    loaded,
    onReload,
    onSupport
}: {
    loaded: boolean,
    onReload?: () => void,
    onSupport?: () => void
}) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const [showClose, setShowClose] = useState(false);

    const opacity = useSharedValue(1);
    const animatedStyles = useAnimatedStyle(() => {
        return { opacity: opacity.value };
    });

    const longLoadingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const start = useMemo(() => Date.now(), []);
    const trackLoadingTime = useCallback(() => {
        trackEvent(MixpanelEvent.HoldersLoadingTime, { duration: Date.now() - start });
    }, []);

    useEffect(() => {
        if (loaded) {
            longLoadingTimerRef.current && clearTimeout(longLoadingTimerRef.current);
            opacity.value = withTiming(0, { duration: 350, easing: Easing.inOut(Easing.ease) });
            trackLoadingTime();
        } else {
            setShowClose(false);
            opacity.value = 1;
        };
    }, [loaded]);

    useEffect(() => {
        const showCloseTimer = setTimeout(() => {
            setShowClose(true);
        }, 7000);

        if (longLoadingTimerRef.current) {
            clearTimeout(longLoadingTimerRef.current);
        }

        longLoadingTimerRef.current = setTimeout(() => {
            trackEvent(MixpanelEvent.holdersLongLoadingTime, { duration: 12000 });
        }, 10000);

        return () => {
            longLoadingTimerRef.current && clearTimeout(longLoadingTimerRef.current);
            clearTimeout(showCloseTimer);
        }
    }, []);

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: theme.backgroundPrimary,
                    opacity: 0.6,
                    alignItems: 'center'
                },
                animatedStyles,
                Platform.select({
                    ios: { paddingTop: 0 },
                    android: { paddingTop: 0 }
                }),
            ]}
            pointerEvents={loaded ? 'none' : 'auto'}
        >
            <Placeholder
                theme={theme}
                onReload={showClose ? onReload : undefined}
                onSupport={showClose ? onSupport : undefined}
                showClose={showClose}
            />
            {!loaded && (
                <ScreenHeader
                    onBackPressed={undefined}
                    leftButton={showClose ? <Pressable
                        style={({ pressed }) => [
                            {
                                opacity: pressed ? 0.5 : 1,
                                backgroundColor: '#1c1c1e',
                                borderRadius: 32,
                                height: 32, width: 32,
                                justifyContent: 'center', alignItems: 'center',
                            },
                        ]}
                        onPress={navigation.goBack}
                    >
                        <Image
                            style={{
                                tintColor: theme.iconNav,
                                height: 10, width: 6,
                                justifyContent: 'center', alignItems: 'center',
                                left: -1
                            }}
                            source={require('@assets/ic-nav-back.png')}
                        />
                    </Pressable> : undefined}
                    style={[
                        { position: 'absolute', top: 32, left: 16, right: 0 },
                        Platform.select({
                            ios: { top: safeArea.top - 16 },
                            android: { top: safeArea.top - 6 }
                        })
                    ]}
                />
            )}
        </Animated.View>
    );
});

export const ExchangesFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const safeArea = useSafeAreaInsets();
    const asset = useParams<ExchangesFragmentParams>();
    const { showActionSheetWithOptions } = useActionSheet();
    const [lang] = useLanguage();
    const [currency] = usePrimaryCurrency();

    const uri = `${holdersUrl(isTestnet)}/deposit-direct-exchanges`;

    const source = useMemo(() => {
        const url = new URL(uri);

        // add query params
        if (asset.type === 'wallet') {
            url.searchParams.append('address', asset.address);
            url.searchParams.append('ticker', asset.ticker);
            if (asset.tokenContract) {
                url.searchParams.append('tokenContract', asset.tokenContract);
            }
        } else {
            if (asset.holdersAccount.address) {
                url.searchParams.append('address', asset.holdersAccount.address);
            }
            if (asset.holdersAccount.cryptoCurrency.tokenContract) {
                url.searchParams.append('tokenContract', asset.holdersAccount.cryptoCurrency.tokenContract);
            }
            url.searchParams.append('ticker', asset.holdersAccount.cryptoCurrency.ticker);
        }

        url.searchParams.append('chain', 'ton');

        url.searchParams.append('lang', lang);
        url.searchParams.append('currency', currency);
        url.searchParams.append('theme', 'holders');
        url.searchParams.append('theme-style', theme.style === 'dark' ? 'dark' : 'light');

        return url;

    }, [uri, lang, currency, theme, asset]);


    const webViewProps: DAppWebViewProps = {
        useMainButton: true,
        useStatusBar: true,
        useEmitter: true,
        useQueryAPI: true
    };

    const [renderKey, setRenderKey] = useState(0);

    const onReload = useCallback(() => {
        trackEvent(MixpanelEvent.HoldersReload, { route: source.toString() }, isTestnet);
        setRenderKey(renderKey + 1);
    }, [renderKey, isTestnet]);

    const onSupport = useCallback(() => {
        const tonhubOptions = [
            t('common.cancel'),
            t('settings.support.telegram'),
            t('settings.support.form'),
            t('settings.support.holders')
        ];
        const cancelButtonIndex = 0;

        const tonhubSupportSheet = () => {
            showActionSheetWithOptions({
                options: tonhubOptions,
                title: t('settings.support.title'),
                cancelButtonIndex,
            }, (selectedIndex?: number) => {
                switch (selectedIndex) {
                    case 1:
                        openWithInApp(holdersSupportUrl);
                        break;
                    case 2:
                        openWithInApp(supportFormUrl);
                        break;
                    case 3:
                        openWithInApp(holdersSupportWebUrl);
                        break;
                    default:
                        break;
                }
            });
        }

        tonhubSupportSheet();
    }, []);

    return (
        <View
            style={[{
                flexGrow: 1,
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: 20,
                overflow: 'hidden'
            }, Platform.select({ android: { paddingTop: safeArea.top } })]}
            collapsable={false}
        >
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark', ios: 'light' })} />
            <View
                style={{
                    backgroundColor: theme.surfaceOnBg,
                    flexGrow: 1, flexBasis: 0, alignSelf: 'stretch',
                }}
                key={`content-${renderKey}`}
            >
                <DAppWebView
                    style={{ backgroundColor: theme.backgroundPrimary, flexGrow: 1 }}
                    defaultSafeArea={Platform.OS === 'ios' ? { bottom: safeArea.bottom, top: 16 } : { top: 16, bottom: 0 }}
                    source={{ uri: source.toString() }}
                    {...webViewProps}
                    webviewDebuggingEnabled={isTestnet}
                    allowsBackForwardNavigationGestures={true}
                    defaultQueryParamsState={{
                        backPolicy: 'back',
                        showKeyboardAccessoryView: false,
                        lockScroll: false,
                    }}
                    loader={(l) => (<ExchangesLoader
                        {...l}
                        onReload={onReload}
                        onSupport={onSupport}
                    />)}
                    originWhitelist={['http:\/\/*', 'https:\/\/*', 'tg:*']}
                />
            </View>
        </View>
    );
});