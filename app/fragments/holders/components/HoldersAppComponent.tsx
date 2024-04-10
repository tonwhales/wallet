import * as React from 'react';
import { Linking, View } from 'react-native';
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { extractDomain } from '../../../engine/utils/extractDomain';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import { MixpanelEvent, trackEvent, useTrackEvent } from '../../../analytics/mixpanel';
import { resolveUrl } from '../../../utils/resolveUrl';
import { protectNavigation } from '../../apps/components/protect/protectNavigation';
import { getLocales } from 'react-native-localize';
import { useLinkNavigator } from '../../../useLinkNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { HoldersAppParams } from '../HoldersAppFragment';
import Animated, { Easing, Extrapolation, FadeOut, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useDAppBridge, usePrimaryCurrency } from '../../../engine/hooks';
import { useTheme } from '../../../engine/hooks';
import { useNetwork } from '../../../engine/hooks';
import { useSelectedAccount } from '../../../engine/hooks';
import { getCurrentAddress } from '../../../storage/appState';
import { useHoldersAccountStatus } from '../../../engine/hooks';
import { HoldersAccountState, holdersUrl } from '../../../engine/api/holders/fetchAccountState';
import { useHoldersAccounts } from '../../../engine/hooks';
import { getHoldersToken } from '../../../engine/hooks/holders/useHoldersAccountStatus';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { onHoldersInvalidate } from '../../../engine/effects/onHoldersInvalidate';
import { DAppWebView, DAppWebViewProps } from '../../../components/webview/DAppWebView';
import { ThemeType } from '../../../engine/state/theme';

export function normalizePath(path: string) {
    return path.replaceAll('.', '_');
}

import IcHolders from '@assets/ic_holders.svg';

function PulsingAccountSkeleton(theme: ThemeType) {
    const safeArea = useSafeAreaInsets();
    const animation = useSharedValue(0);

    useEffect(() => {
        animation.value =
            withRepeat(
                withTiming(1, {
                    duration: 450,
                    easing: Easing.bezier(0.42, 0, 1, 1)
                }),
                -1,
                true,
            );
    }, []);

    const animatedStyles = useAnimatedStyle(() => {
        const scale = interpolate(
            animation.value,
            [0, 1],
            [1, 1.01],
            Extrapolation.CLAMP,
        )
        return {
            transform: [{ scale: scale }],
        };
    }, []);

    return (
        <View style={{ flexGrow: 1, width: '100%' }}>
            <View
                style={{
                    backgroundColor: theme.backgroundUnchangeable,
                    height: 324,
                    position: 'absolute',
                    top: -30 - 36 - safeArea.top,
                    left: -4,
                    right: -4,
                    borderRadius: 20,
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    borderBottomLeftRadius: 28,
                    borderBottomRightRadius: 28,
                }}
            />
            <View style={[
                {
                    height: 44,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    marginTop: -12
                },
            ]}>
                <View style={{
                    width: 32, height: 32,
                    backgroundColor: '#1c1c1e',
                    borderRadius: 16
                }} />
                <Animated.View
                    style={[
                        { height: 36, flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
                        animatedStyles
                    ]}
                >
                    <View style={{ backgroundColor: '#1c1c1e', height: 28, width: 132, borderRadius: 20 }} />
                </Animated.View>
                <View style={{
                    width: 32, height: 32,
                    backgroundColor: '#1c1c1e',
                    borderRadius: 16
                }} />
            </View>
            <Animated.View
                style={[
                    {
                        backgroundColor: '#1c1c1e',
                        height: 38,
                        width: 142,
                        borderRadius: 8,
                        marginTop: 24,
                        alignSelf: 'center'
                    },
                    animatedStyles
                ]}
            />
            <Animated.View
                style={[
                    {
                        backgroundColor: '#1c1c1e',
                        height: 26,
                        width: 78,
                        borderRadius: 20,
                        marginTop: 20,
                        alignSelf: 'center'
                    },
                    animatedStyles
                ]}
            />
            <Animated.View
                style={[
                    {
                        backgroundColor: theme.surfaceOnBg,
                        height: 96,
                        borderRadius: 20,
                        marginTop: 24,
                        marginHorizontal: 20
                    },
                    animatedStyles
                ]}
            />
        </View>
    );
}

export function HoldersPlaceholder() {
    const animation = useSharedValue(0);

    useEffect(() => {
        animation.value =
            withRepeat(
                withTiming(1, {
                    duration: 300,
                    easing: Easing.linear,
                }),
                -1,
                true,
            );
    }, []);

    const animatedStyles = useAnimatedStyle(() => {
        const opacity = interpolate(
            animation.value,
            [0, 1],
            [1, 0.9],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            animation.value,
            [0, 1],
            [1, 1.01],
            Extrapolation.CLAMP,
        )
        return {
            flex: 1,
            alignSelf: 'center',
            justifyContent: 'center',
            marginBottom: 56,
            opacity: opacity,
            transform: [{ scale: scale }],
        };
    }, []);

    return (
        <Animated.View style={animatedStyles}>
            <IcHolders color={'#eee'} />
        </Animated.View>
    );
}

export function HoldersLoader({ loaded, type }: { loaded: boolean, type: 'account' | 'create' }) {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();

    const [showClose, setShowClose] = useState(false);

    const opacity = useSharedValue(1);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            opacity: withTiming(
                opacity.value,
                { duration: 250, easing: Easing.bezier(0.42, 0, 1, 1) }
            )
        };
    });

    useEffect(() => {
        if (loaded) opacity.value = 0;
    }, [loaded]);

    useEffect(() => {
        setTimeout(() => {
            setShowClose(true);
        }, 3000);
    }, []);

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    paddingTop: type === 'account' ? 0 : safeArea.top,
                    backgroundColor: theme.backgroundPrimary,
                    alignItems: 'center'
                },
                animatedStyles
            ]}
            pointerEvents={loaded ? 'none' : 'auto'}
            exiting={FadeOut.duration(3050)}
        >
            <View style={{ marginTop: 58, width: '100%', flexGrow: 1 }}>
                {type === 'account' ? <PulsingAccountSkeleton {...theme} /> : <HoldersPlaceholder />}
            </View>
            <ScreenHeader
                onBackPressed={showClose ? navigation.goBack : undefined}
                style={{ position: 'absolute', top: 32, left: 16, right: 0 }}
            />
        </Animated.View>
    );
}

export const HoldersAppComponent = memo((
    props: {
        variant: HoldersAppParams,
        token: string,
        title: string,
        endpoint: string
    }
) => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const domain = useMemo(() => extractDomain(props.endpoint), []);
    const lang = getLocales()[0].languageCode;
    const acc = useMemo(() => getCurrentAddress(), []);
    const status = useHoldersAccountStatus(acc.address.toString({ testOnly: isTestnet })).data;
    const accountsStatus = useHoldersAccounts(acc.address.toString({ testOnly: isTestnet })).data;
    const [currency,] = usePrimaryCurrency();
    const selectedAccount = useSelectedAccount();

    const source = useMemo(() => {
        let route = '';
        if (props.variant.type === 'create') {
            route = '/create';
        } else if (props.variant.type === 'account') {
            route = `/account/${props.variant.id}`;
        }

        const queryParams = new URLSearchParams({
            lang: lang,
            currency: currency,
            theme: 'holders',
            'theme-style': theme.style === 'dark' ? 'dark' : 'light',
        });

        const url = `${props.endpoint}${route}?${queryParams.toString()}`;
        const initialRoute = `${route}?${queryParams.toString()}`;

        queryParams.append('initial-route', route);

        return { url, initialRoute, queryParams: queryParams.toString() };
    }, [props, lang, currency, status, theme]);

    // 
    // Track events
    // 
    const start = useMemo(() => {
        return Date.now();
    }, []);
    useTrackEvent(MixpanelEvent.Holders, { url: props.variant.type }, isTestnet);

    //
    // Navigation
    //
    const linkNavigator = useLinkNavigator(isTestnet);
    const loadWithRequest = useCallback((event: ShouldStartLoadRequest): boolean => {
        if (extractDomain(event.url) === extractDomain(props.endpoint)) {
            return true;
        }

        // Resolve internal url
        const resolved = resolveUrl(event.url, isTestnet);
        if (resolved) {
            linkNavigator(resolved);
            return false;
        }

        // Secondary protection
        let prt = protectNavigation(event.url, props.endpoint);
        if (prt) {
            return true;
        }

        // Resolve linking
        Linking.openURL(event.url);
        return false;
    }, []);

    //
    // Injection
    //
    const { ref: webViewRef, isConnected, disconnect, ...tonConnectWebViewProps } = useDAppBridge(holdersUrl, navigation);

    const injectSource = useMemo(() => {
        if (!selectedAccount) {
            throw new Error('No account selected');
        }

        // TODO: add accounts state
        const initialState = {
            ...status
                ? {
                    user: {
                        status: {
                            state: status.state,
                            kycStatus: status.state === 'need-kyc' ? status.kycStatus : null,
                            suspended: (status as { suspended: boolean | undefined }).suspended === true,
                        },
                        token: status.state === HoldersAccountState.Ok ? status.token : getHoldersToken(acc.address.toString({ testOnly: isTestnet })),
                    }
                }
                : {},
            ...accountsStatus?.type === 'private' ? { accountsList: accountsStatus.accounts, prepaidCards: accountsStatus.prepaidCards } : {},
        };

        return `
        ${tonConnectWebViewProps.injectedJavaScriptBeforeContentLoaded || ''}
        (() => {
            window.initialState = ${JSON.stringify(initialState)};
        })();
        `
    }, [status, accountsStatus, tonConnectWebViewProps]);

    const onClose = useCallback(() => {
        onHoldersInvalidate(acc.addressString, isTestnet);
        trackEvent(MixpanelEvent.HoldersClose, { type: props.variant.type, duration: Date.now() - start }, isTestnet);
    }, []);

    const onContentProcessDidTerminate = useCallback(() => {
        webViewRef.current?.reload();
        // TODO: add offline support check when offline will be ready
        // In case of blank WebView without offline
        // if (!stableOfflineV || Platform.OS === 'android') {
        //     webRef.current?.reload();
        //     return;
        // }
        // In case of iOS blank WebView with offline app
        // Re-render OfflineWebView to preserve folderPath navigation & inject last offlineRoute as initialRoute
        // if (Platform.OS === 'ios') {
        //     setOfflineRender(offlineRender + 1);
        // }
        // }, [offlineRender, stableOfflineV]);
    }, []);

    const webViewProps: DAppWebViewProps = useMemo(() => {
        return {
            ...tonConnectWebViewProps,
            injectedJavaScriptBeforeContentLoaded: injectSource,

            useStatusBar: true,
            useMainButton: true,
            useToaster: true,
            useQueryAPI: true,
            useEmitter: true,

            onShouldStartLoadWithRequest: loadWithRequest,
            onContentProcessDidTerminate,
            onClose,
        }
    }, [
        domain,
        isTestnet,
        tonConnectWebViewProps,
        loadWithRequest,
        onContentProcessDidTerminate,
        onClose,
        injectSource
    ]);

    return (
        <View style={{ backgroundColor: theme.backgroundPrimary, flex: 1 }}>
            <DAppWebView
                ref={webViewRef}
                source={{ uri: source.url }}
                {...webViewProps}
                defaultQueryParamsState={{
                    backPolicy: 'back',
                    showKeyboardAccessoryView: false,
                    lockScroll: true
                }}
                webviewDebuggingEnabled={isTestnet}
                loader={(p) => <HoldersLoader type={props.variant.type} {...p} />}
            />
        </View>
    );
});