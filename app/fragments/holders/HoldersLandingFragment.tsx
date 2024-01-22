import * as React from 'react';
import { ActivityIndicator, Platform, View, Alert } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { t } from '../../i18n/t';
import { warn } from '../../utils/log';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useParams } from '../../utils/useParams';
import { HoldersAppParams } from './HoldersAppFragment';
import { HoldersParams, extractHoldersQueryParams } from './utils';
import { getLocales } from 'react-native-localize';
import { fragment } from '../../fragment';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { OfflineWebView } from '../../components/webview/OfflineWebView';
import * as FileSystem from 'expo-file-system';
import { useCallback, useMemo, useRef, useState } from 'react';
import { WebViewErrorComponent } from '../../components/webview/WebViewErrorComponent';
import { useNetwork, useOfflineApp, usePrimaryCurrency } from '../../engine/hooks';
import { useTheme } from '../../engine/hooks';
import { useHoldersEnroll } from '../../engine/hooks';
import { getCurrentAddress } from '../../storage/appState';
import { getAppData } from '../../engine/getters/getAppData';
import { ScreenHeader } from '../../components/ScreenHeader';
import { WebViewLoader, normalizePath } from './components/HoldersAppComponent';
import { StatusBar } from 'expo-status-bar';
import { openWithInApp } from '../../utils/openWithInApp';
import { HoldersEnrollErrorType } from '../../engine/hooks/holders/useHoldersEnroll';
import DeviceInfo from 'react-native-device-info';


export const HoldersLandingFragment = fragment(() => {
    const acc = useMemo(() => getCurrentAddress(), []);
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const webRef = useRef<WebView>(null);
    const authContext = useKeysAuth();
    const navigation = useTypedNavigation();
    const [currency,] = usePrimaryCurrency();
    const [holdersParams, setHoldersParams] = useState<Omit<HoldersParams, 'openEnrollment' | 'openUrl' | 'closeApp'>>({
        backPolicy: 'back',
        showKeyboardAccessoryView: false,
        lockScroll: true
    });

    const { endpoint, onEnrollType } = useParams<{ endpoint: string, onEnrollType: HoldersAppParams }>();

    const domain = extractDomain(endpoint);
    const enroll = useHoldersEnroll({ acc, domain, authContext, authStyle: { paddingTop: 32 } });
    const lang = getLocales()[0].languageCode;

    // TODO
    const stableOfflineV = useOfflineApp().stableOfflineV;

    // Anim
    let [loaded, setLoaded] = useState(false);
    let [auth, setAuth] = useState(false);
    const authOpacity = useSharedValue(0);
    const animatedAuthStyles = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.surfaceOnBg,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: withTiming(authOpacity.value, { duration: 300, easing: Easing.bezier(0.42, 0, 1, 1) }),
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
            const data = await getAppData(endpoint);
            if (!data) {
                Alert.alert(
                    t('products.holders.enroll.failed.title'),
                    t('products.holders.enroll.failed.noAppData'),
                    [
                        { text: t('common.cancel') },
                        {
                            text: t('webView.contactSupport'),
                            onPress: () => openWithInApp('https://t.me/WhalesSupportBot')
                        }
                    ]
                );
                authOpacity.value = 0;
                setAuth(false);
                return;
            }

            const res = await enroll();

            if (res.type === 'success') {
                // Navigate to continue
                navigation.replace('Holders', onEnrollType);

                authOpacity.value = 0;
                setAuth(false)
                return;
            }

            let message = ''

            switch (res.error) {
                case HoldersEnrollErrorType.NoDomainKey:
                    message = t('products.holders.enroll.failed.noDomainKey');
                    break;
                case HoldersEnrollErrorType.CreateSignatureFailed:
                    message = t('products.holders.enroll.failed.createSignature');
                    break;
                case HoldersEnrollErrorType.DomainKeyFailed:
                    message = t('products.holders.enroll.failed.createDomainKey');
                    break;
                case HoldersEnrollErrorType.FetchTokenFailed:
                    message = t('products.holders.enroll.failed.fetchToken');
                    break;
            }

            Alert.alert(
                t('products.holders.enroll.failed.title'),
                message,
                [
                    { text: t('common.cancel') },
                    {
                        text: t('webView.contactSupport'),
                        onPress: () => openWithInApp('https://t.me/WhalesSupportBot')
                    }
                ]
            );
            authOpacity.value = 0;
            setAuth(false)
            return;
        } catch {
            authOpacity.value = 0;
            setAuth(false);

            Alert.alert(
                t('products.holders.enroll.failed.title'),
                undefined,
                [
                    { text: t('common.cancel') },
                    {
                        text: t('webView.contactSupport'),
                        onPress: () => openWithInApp('https://t.me/WhalesSupportBot')
                    }
                ]
            );
        }
    }, [auth, enroll]);

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
            'theme-style': theme.style === 'dark' ? 'dark' : 'light',
        });

        const url = `${endpoint}/about?${queryParams.toString()}`;
        const initialRoute = `/about?${queryParams.toString()}`;

        queryParams.append('initial-route', 'about');

        return { url, initialRoute, queryParams: queryParams.toString() };
    }, [theme]);

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

    const onLoadEnd = useCallback(() => {
        try {
            const powerState = DeviceInfo.getPowerStateSync();
            const biggerDelay = powerState.lowPowerMode || (powerState.batteryLevel ?? 0) <= 0.2;
            setTimeout(() => setLoaded(true), biggerDelay ? 180 : 100);
        } catch {
            setTimeout(() => setLoaded(true), 100);
        }
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

    return (
        <View style={{
            flex: 1,
            paddingTop: 36,
            backgroundColor: theme.backgroundPrimary
        }}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            <View style={{ backgroundColor: theme.surfaceOnBg, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}>
                {!!stableOfflineV ? (
                    <OfflineWebView
                        ref={webRef}
                        key={`offline-rendered-${offlineRender}`}
                        uri={`${folderPath}${normalizePath(stableOfflineV)}/index.html`}
                        baseUrl={`${folderPath}${normalizePath(stableOfflineV)}/`}
                        initialRoute={source.initialRoute}
                        queryParams={source.queryParams}
                        style={{
                            backgroundColor: theme.surfaceOnBg,
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
                                    backgroundColor: theme.surfaceOnBg,
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
                                webviewDebuggingEnabled={isTestnet}
                            />
                        </Animated.View>
                    )
                }
                <WebViewLoader type={'create'} loaded={loaded} />
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