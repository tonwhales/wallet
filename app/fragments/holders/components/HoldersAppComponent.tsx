import * as React from 'react';
import { Linking, Platform, View, BackHandler, KeyboardAvoidingView } from 'react-native';
import WebView from 'react-native-webview';
import { ShouldStartLoadRequest, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';
import { extractDomain } from '../../../engine/utils/extractDomain';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import { MixpanelEvent, trackEvent, useTrackEvent } from '../../../analytics/mixpanel';
import { resolveUrl } from '../../../utils/resolveUrl';
import { protectNavigation } from '../../apps/components/protect/protectNavigation';
import { walletConfigFromContract, contractFromPublicKey } from '../../../engine/contractFromPublicKey';
import { dispatchMainButtonResponse } from '../../apps/components/inject/createInjectSource';
import { createInjectSource, dispatchResponse } from '../../apps/components/inject/createInjectSource';
import { useInjectEngine } from '../../apps/components/inject/useInjectEngine';
import { warn } from '../../../utils/log';
import { openWithInApp } from '../../../utils/openWithInApp';
import { HoldersParams, extractHoldersQueryParams, processStatusBarMessage } from '../utils';
import { getLocales } from 'react-native-localize';
import { useLinkNavigator } from '../../../useLinkNavigator';
import * as FileSystem from 'expo-file-system';
import { DappMainButton, processMainButtonMessage, reduceMainButton } from '../../../components/DappMainButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { HoldersAppParams } from '../HoldersAppFragment';
import Animated, { Easing, Extrapolation, FadeIn, FadeInDown, FadeOutDown, cancelAnimation, interpolate, interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { WebViewErrorComponent } from './WebViewErrorComponent';
import { useOfflineApp, usePrimaryCurrency } from '../../../engine/hooks';
import { useTheme } from '../../../engine/hooks';
import { useNetwork } from '../../../engine/hooks';
import { useSelectedAccount } from '../../../engine/hooks';
import { getCurrentAddress } from '../../../storage/appState';
import { useHoldersAccountStatus } from '../../../engine/hooks';
import { HoldersAccountState } from '../../../engine/api/holders/fetchAccountState';
import { useHoldersAccounts } from '../../../engine/hooks';
import { createDomainSignature } from '../../../engine/utils/createDomainSignature';
import { getHoldersToken } from '../../../engine/hooks/holders/useHoldersAccountStatus';
import { useKeyboard } from '@react-native-community/hooks';
import { OfflineWebView } from './OfflineWebView';
import { getDomainKey } from '../../../engine/state/domainKeys';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { onHoldersInvalidate } from '../../../engine/effects/onHoldersInvalidate';
import { ThemeType } from '../../../engine/state/theme';

export function normalizePath(path: string) {
    return path.replaceAll('.', '_');
}

import IcHolders from '../../../../assets/ic_holders.svg';
import { StatusBar, setStatusBarBackgroundColor, setStatusBarStyle } from 'expo-status-bar';

function PulsingCardPlaceholder(theme: ThemeType) {
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
            [1, 1.03],
            Extrapolation.CLAMP,
        )
        return {
            transform: [{ scale: scale }],
        };
    }, []);

    return (
        <Animated.View style={[
            { flexGrow: 1, width: '100%' },
            {
                opacity: interpolate(
                    animation.value,
                    [0, 1],
                    [1, 0.75],
                    Extrapolation.CLAMP
                )
            }
        ]}>
            <View
                style={{
                    backgroundColor: theme.backgroundUnchangeable,
                    height: 324,
                    position: 'absolute',
                    top: -30 - safeArea.top - 44,
                    left: -4,
                    right: -4,
                    borderRadius: 20,
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    borderBottomLeftRadius: 20,
                    borderBottomRightRadius: 20,
                }}
            />
            <Animated.View style={[
                {
                    height: 44,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 8 - safeArea.top,
                    paddingHorizontal: 22
                },
                animatedStyles
            ]}>
                <View style={{
                    width: 32, height: 32,
                    backgroundColor: theme.textSecondary,
                    borderRadius: 16
                }} />
                <View style={{ height: 36, flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: theme.textSecondary, height: 28, width: 132, borderRadius: 20 }} />
                </View>
                <View style={{ width: 32, height: 32, }} />
            </Animated.View>
            <Animated.View
                style={[
                    {
                        backgroundColor: theme.textSecondary,
                        height: 28,
                        width: 142,
                        borderRadius: 8,
                        marginTop: 44,
                        alignSelf: 'center'
                    },
                    animatedStyles
                ]}
            />
            <Animated.View
                style={[
                    {
                        backgroundColor: theme.textSecondary,
                        height: 26,
                        width: 78,
                        borderRadius: 20,
                        marginTop: 24,
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
                        marginTop: 38,
                        marginHorizontal: 20
                    },
                    animatedStyles
                ]}
            />
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

function WebViewLoader({ loaded, type }: { loaded: boolean, type: 'account' | 'create' }) {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();

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
            backgroundColor: theme.backgroundPrimary,
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
            <ScreenHeader
                onBackPressed={showClose ? navigation.goBack : undefined}
                style={{ paddingTop: safeArea.top, paddingHorizontal: 16 }}
            />
            {type === 'account' ? <PulsingCardPlaceholder {...theme} /> : <HoldersPlaceholder />}

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
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const acc = useMemo(() => getCurrentAddress(), []);
    const domain = useMemo(() => extractDomain(props.endpoint), []);

    const status = useHoldersAccountStatus(acc.address.toString({ testOnly: isTestnet })).data;
    const accountsStatus = useHoldersAccounts(acc.address.toString({ testOnly: isTestnet })).data;
    const domainKey = getDomainKey(domain);

    const webRef = useRef<WebView>(null);
    const navigation = useTypedNavigation();
    const lang = getLocales()[0].languageCode;
    const [currency,] = usePrimaryCurrency();
    const selectedAccount = useSelectedAccount();
    const keyboard = useKeyboard();
    const bottomMargin = (safeArea.bottom === 0 ? 32 : safeArea.bottom);

    // TODO
    const stableOfflineV = useOfflineApp().stableOfflineV;

    const [mainButton, dispatchMainButton] = useReducer(
        reduceMainButton(),
        {
            text: '',
            textColor: theme.surfaceOnBg,
            color: theme.accent,
            disabledColor: theme.surfaceOnElevation,
            isVisible: false,
            isActive: false,
            isProgressVisible: false,
            onPress: undefined,
        }
    );

    const [holdersParams, setHoldersParams] = useState<Omit<HoldersParams, 'openEnrollment' | 'openUrl' | 'closeApp'>>({
        backPolicy: 'back',
        showKeyboardAccessoryView: false,
        lockScroll: true
    });

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
    // View
    //
    const [loaded, setLoaded] = useState(false);

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
    const injectSource = useMemo(() => {
        if (!selectedAccount) {
            throw new Error('No account selected');
        }

        const contract = contractFromPublicKey(selectedAccount.publicKey);
        const config = walletConfigFromContract(contract);

        const walletConfig = config.walletConfig;
        const walletType = config.type;

        let suspended = false;

        if (!!status && typeof (status as any).suspended === 'boolean') {
            suspended = (status as any).suspended;
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
            ...accountsStatus?.type === 'private' ? { accountsList: accountsStatus.accounts } : {},
        }

        const initialInjection = `
        window.initialState = ${JSON.stringify(initialState)};
        `;

        if (!domainKey) {
            return initialInjection;
        }

        let domainSign = createDomainSignature(domain, domainKey);

        return createInjectSource(
            {
                version: 1,
                platform: Platform.OS,
                platformVersion: Platform.Version,
                network: isTestnet ? 'testnet' : 'mainnet',
                address: selectedAccount.address.toString({ testOnly: isTestnet }),
                publicKey: selectedAccount.publicKey.toString('base64'),
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
            safeArea,
            initialInjection,
            true,
            true
        );
    }, [status, accountsStatus]);

    const injectionEngine = useInjectEngine(extractDomain(props.endpoint), props.title, isTestnet, props.endpoint);
    const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
        const nativeEvent = event.nativeEvent;

        // Resolve parameters
        let data: any;
        let id: number;
        try {
            let parsed = JSON.parse(nativeEvent.data);
            // Main button API
            let processed = processMainButtonMessage(
                parsed,
                dispatchMainButton,
                dispatchMainButtonResponse,
                webRef
            );

            if (processed) {
                return;
            }

            // Header API
            processed = processStatusBarMessage(parsed, setStatusBarStyle, setStatusBarBackgroundColor);

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
        onHoldersInvalidate(acc.addressString, isTestnet);
        navigation.goBack();
        trackEvent(MixpanelEvent.HoldersClose, { type: props.variant.type, duration: Date.now() - start }, isTestnet);
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
        setHoldersParams((prev) => {
            const newValue = {
                ...prev,
                ...Object.fromEntries(
                    Object.entries(params).filter(([, value]) => value !== undefined)
                )
            }
            return newValue;
        });
        if (!!params.openUrl) {
            safelyOpenUrl(params.openUrl);
        }
    }, [setHoldersParams]);

    const onHardwareBackPress = useCallback(() => {
        if (holdersParams.backPolicy === 'lock') {
            return true;
        }
        if (holdersParams.backPolicy === 'back') {
            if (webRef.current) {
                webRef.current.goBack();
            }
            return true;
        }
        if (holdersParams.backPolicy === 'close') {
            navigation.goBack();
            return true;
        }
        return false;
    }, [holdersParams.backPolicy]);

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
            <View style={{ flex: 1 }}>
                {!!stableOfflineV ? (
                    <OfflineWebView
                        key={`offline-rendered-${offlineRender}`}
                        ref={webRef}
                        uri={`${folderPath}${normalizePath(stableOfflineV)}/index.html`}
                        baseUrl={`${folderPath}${normalizePath(stableOfflineV)}/`}
                        initialRoute={source.initialRoute}
                        queryParams={source.queryParams}
                        style={{
                            backgroundColor: theme.backgroundPrimary,
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
                        onShouldStartLoadWithRequest={loadWithRequest}
                        // In case of iOS blank WebView
                        onContentProcessDidTerminate={onContentProcessDidTerminate}
                        // In case of Android blank WebView
                        onRenderProcessGone={onContentProcessDidTerminate}
                        onMessage={handleWebViewMessage}
                        keyboardDisplayRequiresUserAction={false}
                        hideKeyboardAccessoryView={!holdersParams.showKeyboardAccessoryView}
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
                            injectedJavaScriptBeforeContentLoaded={injectSource}
                            onShouldStartLoadWithRequest={loadWithRequest}
                            // In case of iOS blank WebView
                            onContentProcessDidTerminate={onContentProcessDidTerminate}
                            // In case of Android blank WebView
                            onRenderProcessGone={onContentProcessDidTerminate}
                            onMessage={handleWebViewMessage}
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
                )}
                <WebViewLoader type={props.variant.type} loaded={loaded} />
                <KeyboardAvoidingView
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
                    behavior={Platform.OS === 'ios' ? 'position' : undefined}
                    contentContainerStyle={{ marginHorizontal: 16, marginBottom: 0 }}
                    keyboardVerticalOffset={Platform.OS === 'ios'
                        ? bottomMargin + (keyboard.keyboardShown ? 32 : 0)
                        : undefined
                    }
                >
                    {mainButton && mainButton.isVisible && (
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
                    )}
                </KeyboardAvoidingView>
            </View>
        </>
    );
});