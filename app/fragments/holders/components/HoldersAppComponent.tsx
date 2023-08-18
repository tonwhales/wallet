import * as React from 'react';
import { ActivityIndicator, Linking, Text, Platform, View, BackHandler, Pressable, KeyboardAvoidingView } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { Easing, Extrapolate, FadeIn, FadeInDown, FadeOutDown, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { ShouldStartLoadRequest, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';
import { extractDomain } from '../../../engine/utils/extractDomain';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import { MixpanelEvent, trackEvent, useTrackEvent } from '../../../analytics/mixpanel';
import { resolveUrl } from '../../../utils/resolveUrl';
import { protectNavigation } from '../../apps/components/protect/protectNavigation';
import { useEngine } from '../../../engine/Engine';
import { contractFromPublicKey } from '../../../engine/contractFromPublicKey';
import { createInjectSource, dispatchMainButtonResponse, dispatchResponse } from '../../apps/components/inject/createInjectSource';
import { useInjectEngine } from '../../apps/components/inject/useInjectEngine';
import { warn } from '../../../utils/log';
import { HoldersAppParams } from '../HoldersAppFragment';
import { openWithInApp } from '../../../utils/openWithInApp';
import { extractHoldersQueryParams } from '../utils';
import { AndroidToolbar } from '../../../components/topbar/AndroidToolbar';
import { BackPolicy } from '../types';
import { getLocales } from 'react-native-localize';
import { t } from '../../../i18n/t';
import { useLinkNavigator } from '../../../useLinkNavigator';
import { useAppConfig } from '../../../utils/AppConfigContext';
import { OfflineWebView } from './OfflineWebView';
import * as FileSystem from 'expo-file-system';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { DappMainButton, processMainButtonMessage, reduceMainButton } from '../../../components/DappMainButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalizePath } from '../../../engine/holders/HoldersProduct';
import IcHolders from '../../../../assets/ic_holders.svg';
import { WebViewErrorComponent } from './WebViewErrorComponent';
import { useKeyboard } from '@react-native-community/hooks';

function PulsingCardPlaceholder() {
    const animation = useSharedValue(0);

    useEffect(() => {
        animation.value =
            withRepeat(
                withTiming(1, {
                    duration: 250,
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
            [1, 0.75],
            Extrapolate.CLAMP
        );
        const scale = interpolate(
            animation.value,
            [0, 1],
            [1, 1.03],
            Extrapolate.CLAMP,
        )
        return {
            width: 268, height: 153, position: 'absolute', backgroundColor: '#eee', top: 80, borderRadius: 21,
            opacity: opacity,
            transform: [{ scale: scale }],
        };
    }, []);

    return (
        <Animated.View style={animatedStyles}>
            <View style={{ width: 90, height: 20, backgroundColor: 'white', top: 22, left: 16, borderRadius: 8 }} />
            <View style={{ marginTop: 4, width: 60, height: 16, backgroundColor: 'white', top: 22, left: 16, borderRadius: 6 }} />
            <View style={{ display: 'flex', flexDirection: 'row', marginTop: 32 }}>
                <View>
                    <View style={{ width: 68, height: 16, backgroundColor: 'white', top: 22, left: 16, borderRadius: 6 }} />
                    <View style={{ marginTop: 4, width: 90, height: 16, backgroundColor: 'white', top: 22, left: 16, borderRadius: 6 }} />
                </View>
            </View>
        </Animated.View>
    );
}

function HoldersPlaceholder() {
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
            [1, 0.8],
            Extrapolate.CLAMP
        );
        const scale = interpolate(
            animation.value,
            [0, 1],
            [1, 1.01],
            Extrapolate.CLAMP,
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

function WebViewLoader({ loaded, type }: { loaded: boolean, type: 'card' | 'account' }) {
    const { Theme } = useAppConfig();
    const navigation = useTypedNavigation();

    const [animationPlayed, setAnimationPlayed] = useState(loaded);
    const [showClose, setShowClose] = useState(false);

    const opacity = useSharedValue(1);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Theme.item,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: withTiming(opacity.value, { duration: 150, easing: Easing.bezier(0.42, 0, 1, 1) }),
        };
    });

    useEffect(() => {
        if (loaded) {
            setTimeout(() => {
                opacity.value = 0;
                setTimeout(() => {
                    setAnimationPlayed(true);
                }, 150);
            }, 250);
        }
    }, [loaded]);

    useEffect(() => {
        setTimeout(() => {
            setShowClose(true);
        }, 3000);
    }, []);

    if (animationPlayed) {
        return null;
    }

    return (
        <Animated.View
            style={animatedStyles}
        >
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                <AndroidToolbar tintColor={Theme.accent} onBack={() => navigation.goBack()} />
            </View>
            {type === 'card' ? <PulsingCardPlaceholder /> : <HoldersPlaceholder />}
            {Platform.OS === 'ios' && showClose && (
                <Animated.View style={{ position: 'absolute', top: 22, right: 16 }} entering={FadeIn}>
                    <Pressable
                        onPress={() => {
                            navigation.goBack();
                        }} >
                        <Text style={{ color: Theme.accent, fontWeight: '500', fontSize: 17 }}>
                            {t('common.close')}
                        </Text>
                    </Pressable>
                </Animated.View>
            )}
        </Animated.View>
    );
}

export const HoldersAppComponent = React.memo((
    props: {
        variant: HoldersAppParams,
        token: string,
        title: string,
        endpoint: string
    }
) => {
    const safeArea = useSafeAreaInsets();
    const { Theme, AppConfig } = useAppConfig();
    const engine = useEngine();
    const status = engine.products.holders.useStatus();
    const webRef = useRef<WebView>(null);
    const navigation = useTypedNavigation();
    const lang = getLocales()[0].languageCode;
    const currency = engine.products.price.usePrimaryCurrency();
    const stableOfflineV = engine.products.holders.stableOfflineVersion;
    const bottomMargin = (safeArea.bottom === 0 ? 32 : safeArea.bottom);
    const useOfflineApp = engine.products.holders.devUseOffline && !!stableOfflineV;
    const keyboard = useKeyboard();

    const [mainButton, dispatchMainButton] = useReducer(
        reduceMainButton(),
        {
            text: '',
            textColor: Theme.item,
            color: Theme.accent,
            disabledColor: Theme.disabled,
            isVisible: false,
            isActive: false,
            isProgressVisible: false,
            onPress: undefined,
        }
    );
    const [backPolicy, setBackPolicy] = useState<BackPolicy>('back');
    const [hideKeyboardAccessoryView, setHideKeyboardAccessoryView] = useState(true);

    const source = useMemo(() => {
        let route = '';
        if (props.variant.type === 'account') {
            route = status.state === 'ok' ? '/create' : '/';
        } else if (props.variant.type === 'card') {
            route = `/card/${props.variant.id}`;
        }

        return {
            url: `${props.endpoint}${route}?lang=${lang}&currency=${currency}`,
            initialRoute: `${route}?lang=${lang}&currency=${currency}`,
        };
    }, [props, lang, currency, status]);

    // 
    // Track events
    // 
    const start = useMemo(() => {
        return Date.now();
    }, []);
    useTrackEvent(MixpanelEvent.Holders, { url: props.variant.type }, AppConfig.isTestnet);

    //
    // View
    //
    const [loaded, setLoaded] = useState(false);

    //
    // Navigation
    //
    const linkNavigator = useLinkNavigator(AppConfig.isTestnet);
    const loadWithRequest = useCallback((event: ShouldStartLoadRequest): boolean => {
        if (extractDomain(event.url) === extractDomain(props.endpoint)) {
            return true;
        }

        // Resolve internal url
        const resolved = resolveUrl(event.url, AppConfig.isTestnet);
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
    const injectSource = useMemo(() => {
        const contract = contractFromPublicKey(engine.publicKey);
        const walletConfig = contract.source.backup();
        const walletType = contract.source.type;
        const domain = extractDomain(props.endpoint);

        const cardsState = engine.persistence.holdersCards.item(engine.address).value;
        const accountState = engine.persistence.holdersStatus.item(engine.address).value;

        const initialState = {
            ...accountState
                ? {
                    account: {
                        status: {
                            state: accountState.state,
                            kycStatus: accountState.state === 'need-kyc' ? accountState.kycStatus : null,
                            suspended: accountState.state === 'need-enrolment' ? false : accountState.suspended,
                        },
                        token: accountState.state === 'ok' ? accountState.token : engine.products.holders.getToken(),
                    }
                }
                : {},
            ...cardsState ? { cardsList: cardsState.accounts } : {},
        }

        const initialInjection = `
        window.initialState = ${JSON.stringify(initialState)};
        `;

        let domainSign = engine.products.keys.createDomainSignature(domain);

        return createInjectSource(
            {
                version: 1,
                platform: Platform.OS,
                platformVersion: Platform.Version,
                network: AppConfig.isTestnet ? 'testnet' : 'mainnet',
                address: engine.address.toFriendly({ testOnly: AppConfig.isTestnet }),
                publicKey: engine.publicKey.toString('base64'),
                walletConfig,
                walletType,
                signature: domainSign.signature,
                time: domainSign.time,
                subkey: {
                    domain: domainSign.subkey.domain,
                    publicKey: domainSign.subkey.publicKey,
                    time: domainSign.subkey.time,
                    signature: domainSign.subkey.signature
                }
            },
            initialInjection,
            true
        );
    }, []);
    const injectionEngine = useInjectEngine(extractDomain(props.endpoint), props.title, AppConfig.isTestnet);
    const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
        const nativeEvent = event.nativeEvent;

        // Resolve parameters
        let data: any;
        let id: number;
        try {
            let parsed = JSON.parse(nativeEvent.data);
            // Main button API
            const processed = processMainButtonMessage(
                parsed,
                dispatchMainButton,
                dispatchMainButtonResponse,
                webRef
            );

            if (processed) {
                return;
            }

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

        if (data.name === 'openUrl' && data.args.url) {
            try {
                let pageDomain = extractDomain(data.args.url);
                if (
                    pageDomain.endsWith('tonsandbox.com')
                    || pageDomain.endsWith('tonwhales.com')
                    || pageDomain.endsWith('tontestnet.com')
                    || pageDomain.endsWith('tonhub.com')
                ) {
                    openWithInApp(data.args.url);
                    return;
                }
            } catch (e) {
                console.warn(e);
            }
        }
        if (data.name === 'closeApp') {
            navigation.goBack();
            return;
        }

        // Execute
        (async () => {
            let res = { type: 'error', message: 'Unknown error' };
            try {
                res = await injectionEngine.execute(data);
            } catch (e) {
                warn(e);
            }
            dispatchResponse(webRef, { id, data: res });
        })();
    }, []);

    const onCloseApp = useCallback(() => {
        engine.products.holders.doSync();
        navigation.goBack();
        trackEvent(MixpanelEvent.HoldersClose, { type: props.variant.type, duration: Date.now() - start }, AppConfig.isTestnet);
    }, []);

    const safelyOpenUrl = useCallback((url: string) => {
        try {
            let pageDomain = extractDomain(url);
            if (
                pageDomain.endsWith('tonsandbox.com')
                || pageDomain.endsWith('tonwhales.com')
                || pageDomain.endsWith('tontestnet.com')
                || pageDomain.endsWith('tonhub.com')
                || pageDomain.endsWith('t.me')
            ) {
                openWithInApp(url);
                return;
            }
        } catch (e) {
            warn(e);
        }
    }, []);

    const onNavigation = useCallback((url: string) => {
        const params = extractHoldersQueryParams(url);
        if (params.closeApp) {
            onCloseApp();
            return;
        }
        setHideKeyboardAccessoryView(!params.showKeyboardAccessoryView);
        setBackPolicy(params.backPolicy);
        if (params.openUrl) {
            safelyOpenUrl(params.openUrl);
        }
    }, []);

    const onHardwareBackPress = useCallback(() => {
        if (backPolicy === 'lock') {
            return true;
        }
        if (backPolicy === 'back') {
            if (webRef.current) {
                webRef.current.goBack();
            }
            return true;
        }
        if (backPolicy === 'close') {
            navigation.goBack();
            return true;
        }
        return false;
    }, [backPolicy]);

    useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
        return () => {
            BackHandler.removeEventListener('hardwareBackPress', onHardwareBackPress);
        }
    }, [onHardwareBackPress]);

    const folderPath = `${FileSystem.cacheDirectory}holders`;
    const [offlineRender, setOfflineRender] = useState(0);

    const onLoadEnd = useCallback(() => {
        setLoaded(true);
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
        <>
            <View style={{ backgroundColor: Theme.item, flex: 1 }}>
                {useOfflineApp ? (
                    <OfflineWebView
                        key={`offline-rendered-${offlineRender}`}
                        ref={webRef}
                        uri={`${folderPath}${normalizePath(stableOfflineV)}/index.html`}
                        baseUrl={`${folderPath}${normalizePath(stableOfflineV)}/`}
                        initialRoute={source.initialRoute}
                        style={{
                            backgroundColor: Theme.item,
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
                        scrollEnabled={false}
                        contentInset={{ top: 0, bottom: 0 }}
                        autoManageStatusBarEnabled={false}
                        decelerationRate="normal"
                        allowsInlineMediaPlayback={true}
                        injectedJavaScriptBeforeContentLoaded={injectSource}
                        onShouldStartLoadWithRequest={loadWithRequest}
                        // In case of iOS blank WebView
                        onContentProcessDidTerminate={onContentProcessDidTerminate}
                        // In case of Android blank WebView
                        onRenderProcessGone={onContentProcessDidTerminate}
                        onMessage={handleWebViewMessage}
                        keyboardDisplayRequiresUserAction={false}
                        hideKeyboardAccessoryView={hideKeyboardAccessoryView}
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
                        bounces={false}
                        startInLoadingState={true}
                    />
                ) : (
                    <Animated.View style={{ flexGrow: 1, flexBasis: 0, height: '100%', }} entering={FadeIn}>
                        <WebView
                            ref={webRef}
                            source={{ uri: source.url }}
                            startInLoadingState={true}
                            style={{
                                backgroundColor: Theme.item,
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
                            scrollEnabled={false}
                            contentInset={{ top: 0, bottom: 0 }}
                            autoManageStatusBarEnabled={false}
                            allowFileAccessFromFileURLs={false}
                            allowUniversalAccessFromFileURLs={false}
                            decelerationRate="normal"
                            allowsInlineMediaPlayback={true}
                            injectedJavaScriptBeforeContentLoaded={injectSource}
                            onShouldStartLoadWithRequest={loadWithRequest}
                            // In case of iOS blank WebView
                            onContentProcessDidTerminate={onContentProcessDidTerminate}
                            // In case of Android blank WebView
                            onRenderProcessGone={onContentProcessDidTerminate}
                            onMessage={handleWebViewMessage}
                            keyboardDisplayRequiresUserAction={false}
                            hideKeyboardAccessoryView={hideKeyboardAccessoryView}
                            bounces={false}
                        />
                    </Animated.View>
                )}
                <WebViewLoader type={props.variant.type} loaded={loaded} />
                {mainButton && mainButton.isVisible && (
                    <KeyboardAvoidingView
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
                        behavior={Platform.OS === 'ios' ? 'position' : undefined}
                        contentContainerStyle={{ marginHorizontal: 16, marginBottom: 0 }}
                        keyboardVerticalOffset={Platform.OS === 'ios'
                            ? bottomMargin + (keyboard.keyboardShown ? 32 : 0)
                            : undefined
                        }
                    >
                        <Animated.View
                            style={Platform.OS === 'android'
                                ? { marginHorizontal: 16, marginBottom: 16 }
                                : { marginBottom: 32 }
                            }
                            entering={FadeInDown}
                            exiting={FadeOutDown}
                        >
                            <DappMainButton {...mainButton} />
                        </Animated.View>
                    </KeyboardAvoidingView>
                )}
            </View>
        </>
    );
});