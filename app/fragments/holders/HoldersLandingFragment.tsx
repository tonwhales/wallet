import * as React from 'react';
import { ActivityIndicator, Platform, Text, View, Alert, Pressable } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { t } from '../../i18n/t';
import { useEngine } from '../../engine/Engine';
import { warn } from '../../utils/log';
import { AndroidToolbar } from '../../components/topbar/AndroidToolbar';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useParams } from '../../utils/useParams';
import { HoldersAppParams } from './HoldersAppFragment';
import { HoldersParams, extractHoldersQueryParams } from './utils';
import { getLocales } from 'react-native-localize';
import { fragment } from '../../fragment';
import { useAppConfig } from '../../utils/AppConfigContext';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { OfflineWebView } from './components/OfflineWebView';
import * as FileSystem from 'expo-file-system';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { normalizePath } from '../../engine/holders/HoldersProduct';
import { WebViewErrorComponent } from './components/WebViewErrorComponent';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenHeader } from '../../components/ScreenHeader';

export const HoldersLandingFragment = fragment(() => {
    const { Theme } = useAppConfig();
    const webRef = useRef<WebView>(null);
    const authContext = useKeysAuth();
    const engine = useEngine();
    const navigation = useTypedNavigation();
    const [holdersParams, setHoldersParams] = useState<Omit<HoldersParams, 'openEnrollment' | 'openUrl' | 'closeApp'>>({
        backPolicy: 'back',
        showKeyboardAccessoryView: false,
        lockScroll: true
    });
    const { endpoint, onEnrollType } = useParams<{ endpoint: string, onEnrollType: HoldersAppParams }>();
    const lang = getLocales()[0].languageCode;
    const currency = engine.products.price.usePrimaryCurrency();
    const stableOfflineV = engine.products.holders.stableOfflineVersion;
    const useOfflineApp = engine.products.holders.devUseOffline && !!stableOfflineV;

    //
    // View
    //
    const safeArea = useSafeAreaInsets();
    let [loaded, setLoaded] = React.useState(false);
    const opacity = useSharedValue(1);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Theme.surfacePimary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: withTiming(opacity.value, { duration: 300 }),
        };
    });

    let [auth, setAuth] = React.useState(false);
    const authOpacity = useSharedValue(0);
    const animatedAuthStyles = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Theme.surfacePimary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: withTiming(opacity.value, { duration: 300, easing: Easing.bezier(0.42, 0, 1, 1) }),
        };
    });

    const onEnroll = useCallback(async () => {
        if (auth) {
            return;
        }
        // Show loader
        authOpacity.value = 1;
        setAuth(true);

        try {
            const data = await engine.products.extensions.getAppData(endpoint);
            if (!data) {
                Alert.alert(t('auth.failed'));
                authOpacity.value = 0;
                setAuth(false);
                return;
            }

            const domain = extractDomain(endpoint);
            const res = await engine.products.holders.enroll(domain, authContext, { paddingTop: safeArea.top });
            if (!res) {
                Alert.alert(t('auth.failed'));
                authOpacity.value = 0;
                setAuth(false)
                return;
            }

            // Navigate to continue
            navigation.replace('Holders', onEnrollType);

            authOpacity.value = 0;
            setAuth(false);
        } catch (error: any) {
            authOpacity.value = 0;
            setAuth(false);
            Alert.alert(t('auth.failed'), error?.message);
            warn(error);
        }
    }, [auth]);

    //
    // Navigation
    //
    const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
        const nativeEvent = event.nativeEvent;

        // Resolve parameters
        let data: any;
        let id: number;
        try {
            let parsed = JSON.parse(nativeEvent.data);
            if (typeof parsed.id !== 'number') {
                warn('Invalid operation id');
                return;
            }
            id = parsed.id;
            data = parsed.data;
        } catch (e) {
            warn(e);
            return;
        }

        if (data.name === 'openEnrollment') {
            onEnroll();
            return;
        }
        if (data.name === 'closeApp') {
            navigation.goBack();
            return;
        }
    }, [onEnroll]);

    const onNavigation = useCallback((url: string) => {
        const params = extractHoldersQueryParams(url);
        if (params.closeApp) {
            navigation.goBack();
            return;
        }
        setHoldersParams(params);
        if (params.openEnrollment) {
            onEnroll();
            return;
        }
    }, [onEnroll]);

    const folderPath = `${FileSystem.cacheDirectory}holders`;
    const [offlineRender, setOfflineRender] = useState(0);

    const source = useMemo(() => {
        const queryParams = new URLSearchParams({
            lang: lang,
            currency: currency,
            theme: 'holders',
            'theme-style': Theme.style === 'dark' ? 'dark' : 'light',
        });

        const url = `${endpoint}/about?${queryParams.toString()}`;
        const initialRoute = `/about?${queryParams.toString()}`;

        queryParams.append('initial-route', 'about');

        return { url, initialRoute, queryParams: queryParams.toString() };
    }, [Theme]);

    const onLoadEnd = useCallback(() => {
        setLoaded(true);
        opacity.value = 0;
    }, []);

    const onContentProcessDidTerminate = useCallback(() => {
        // In case of blank WebView without offline
        if (!useOfflineApp) {
            webRef.current?.reload();
            return;
        }
        // In case of iOS blank WebView with offline app
        // Re-render OfflineWebView to preserve folderPath navigation & inject last offlineRoute as initialRoute
        if (Platform.OS === 'ios') {
            setOfflineRender(offlineRender + 1);
        }
    }, [useOfflineApp, offlineRender]);

    const injectSource = useMemo(() => {
        return `
        window['tonhub'] = (() => {
            const obj = {};
            Object.freeze(obj);
            return obj;
        })();
        true;
        `
    }, []);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false
        })
    }, [navigation]);

    useFocusEffect(() => {
        setTimeout(() => {
            setStatusBarStyle(Theme.style === 'dark' ? 'light' : 'dark');
        }, 10);
    });

    return (
        <View style={{
            flex: 1,
            paddingTop: 36,
            backgroundColor: Theme.surfacePimary
        }}>
            <View style={{ backgroundColor: Theme.surfacePimary, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}>
                {useOfflineApp ? (
                    <OfflineWebView
                        ref={webRef}
                        key={`offline-rendered-${offlineRender}`}
                        uri={`${folderPath}${normalizePath(stableOfflineV)}/index.html`}
                        baseUrl={`${folderPath}${normalizePath(stableOfflineV)}/`}
                        initialRoute={source.initialRoute}
                        queryParams={source.queryParams}
                        style={{
                            backgroundColor: Theme.surfacePimary,
                            flexGrow: 1, flexBasis: 0, height: '100%',
                            alignSelf: 'stretch',
                            marginTop: Platform.OS === 'ios' ? 0 : 8,
                        }}
                        onLoadEnd={onLoadEnd}
                        onLoadProgress={(event) => {
                            if (Platform.OS === 'android' && event.nativeEvent.progress === 1) {
                                // Searching for supported query
                                onNavigation(event.nativeEvent.url);
                            }
                        }}
                        onNavigationStateChange={(event: WebViewNavigation) => {
                            // Searching for supported query
                            onNavigation(event.url);
                        }}
                        // Locking scroll, it's handled within the Web App
                        scrollEnabled={!holdersParams.lockScroll}
                        contentInset={{ top: 0, bottom: 0 }}
                        autoManageStatusBarEnabled={false}
                        decelerationRate="normal"
                        allowsInlineMediaPlayback={true}
                        injectedJavaScriptBeforeContentLoaded={injectSource}
                        onMessage={handleWebViewMessage}
                        keyboardDisplayRequiresUserAction={false}
                        hideKeyboardAccessoryView={!holdersParams.showKeyboardAccessoryView}
                        bounces={false}
                        startInLoadingState={true}
                        renderError={(errorDomain, errorCode, errorDesc) => {
                            return (
                                <WebViewErrorComponent
                                    onReload={onContentProcessDidTerminate}
                                    errorDomain={errorDomain}
                                    errorCode={errorCode}
                                    errorDesc={errorDesc}
                                />
                            )
                        }}
                    />
                )
                    : (
                        <Animated.View style={{ flexGrow: 1, flexBasis: 0, height: '100%', }} entering={FadeIn}>
                            <WebView
                                ref={webRef}
                                source={{ uri: source.url }}
                                startInLoadingState={true}
                                style={{
                                    backgroundColor: Theme.surfacePimary,
                                    flexGrow: 1, flexBasis: 0, height: '100%',
                                    alignSelf: 'stretch',
                                    marginTop: Platform.OS === 'ios' ? 0 : 8,
                                }}
                                onLoadEnd={() => {
                                    setLoaded(true);
                                    opacity.value = 0;
                                }}
                                onLoadProgress={(event) => {
                                    if (Platform.OS === 'android' && event.nativeEvent.progress === 1) {
                                        // Searching for supported query
                                        onNavigation(event.nativeEvent.url);
                                    }
                                }}
                                onNavigationStateChange={(event: WebViewNavigation) => {
                                    // Searching for supported query
                                    onNavigation(event.url);
                                }}
                                // Locking scroll, it's handled within the Web App
                                scrollEnabled={!holdersParams.lockScroll}
                                contentInset={{ top: 0, bottom: 0 }}
                                autoManageStatusBarEnabled={false}
                                allowFileAccessFromFileURLs={false}
                                allowUniversalAccessFromFileURLs={false}
                                decelerationRate="normal"
                                allowsInlineMediaPlayback={true}
                                onMessage={handleWebViewMessage}
                                injectedJavaScriptBeforeContentLoaded={injectSource}
                                keyboardDisplayRequiresUserAction={false}
                                hideKeyboardAccessoryView={!holdersParams.showKeyboardAccessoryView}
                                bounces={false}
                                renderError={(errorDomain, errorCode, errorDesc) => {
                                    return (
                                        <WebViewErrorComponent
                                            onReload={onContentProcessDidTerminate}
                                            errorDomain={errorDomain}
                                            errorCode={errorCode}
                                            errorDesc={errorDesc}
                                        />
                                    )
                                }}
                            />
                        </Animated.View>
                    )
                }
                {!useOfflineApp && (
                    <Animated.View
                        style={animatedStyles}
                        pointerEvents={loaded ? 'none' : 'box-none'}
                    >
                        <View style={{ position: 'absolute', top: -4, left: 16, right: 0 }}>
                            <ScreenHeader onBackPressed={navigation.goBack} />
                        </View>
                        <ActivityIndicator size="small" color={'#564CE2'} />
                    </Animated.View>
                )}
                <Animated.View
                    style={animatedAuthStyles}
                    pointerEvents={!auth ? 'none' : 'box-none'}
                >
                    <View style={{ position: 'absolute', top: -4, left: 16, right: 0 }}>
                        <ScreenHeader onBackPressed={navigation.goBack} />
                    </View>
                    <ActivityIndicator size="small" color={'#564CE2'} />
                </Animated.View>
            </View>
        </View>
    );
});