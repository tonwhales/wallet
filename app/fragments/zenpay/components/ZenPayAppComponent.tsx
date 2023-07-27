import * as React from 'react';
import { ActivityIndicator, Linking, Text, Platform, View, BackHandler, Pressable } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ShouldStartLoadRequest, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';
import { extractDomain } from '../../../engine/utils/extractDomain';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import { MixpanelEvent, trackEvent, useTrackEvent } from '../../../analytics/mixpanel';
import { resolveUrl } from '../../../utils/resolveUrl';
import { protectNavigation } from '../../apps/components/protect/protectNavigation';
import { useEngine } from '../../../engine/Engine';
import { contractFromPublicKey } from '../../../engine/contractFromPublicKey';
import { createInjectSource, dispatchResponse } from '../../apps/components/inject/createInjectSource';
import { useInjectEngine } from '../../apps/components/inject/useInjectEngine';
import { warn } from '../../../utils/log';
import { ZenPayAppParams } from '../ZenPayAppFragment';
import { openWithInApp } from '../../../utils/openWithInApp';
import { extractZenPayQueryParams } from '../utils';
import { AndroidToolbar } from '../../../components/topbar/AndroidToolbar';
import { BackPolicy } from '../types';
import { getLocales } from 'react-native-localize';
import { t } from '../../../i18n/t';
import { useLinkNavigator } from '../../../useLinkNavigator';
import { useAppConfig } from '../../../utils/AppConfigContext';
import { AnotherKeyboardAvoidingView } from 'react-native-another-keyboard-avoiding-view';

export const ZenPayAppComponent = React.memo((
    props: {
        variant: ZenPayAppParams,
        token: string,
        title: string,
        endpoint: string
    }
) => {
    const { Theme, AppConfig } = useAppConfig();
    const engine = useEngine();
    const [backPolicy, setBackPolicy] = React.useState<BackPolicy>('back');
    const [hideKeyboardAccessoryView, setHideKeyboardAccessoryView] = React.useState(true);
    const webRef = React.useRef<WebView>(null);
    const navigation = useTypedNavigation();
    const lang = getLocales()[0].languageCode;
    const currency = engine.products.price.usePrimaryCurrency();

    // 
    // Track events
    // 
    const start = React.useMemo(() => {
        return Date.now();
    }, []);
    useTrackEvent(MixpanelEvent.ZenPay, { url: props.variant.type }, AppConfig.isTestnet);

    //
    // View
    //
    let [loaded, setLoaded] = React.useState(false);
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
            opacity: withTiming(opacity.value, { duration: 300 }),
        };
    });

    //
    // Navigation
    //
    const linkNavigator = useLinkNavigator(AppConfig.isTestnet);
    const loadWithRequest = React.useCallback((event: ShouldStartLoadRequest): boolean => {
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
    const injectSource = React.useMemo(() => {
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
                        }
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
            initialInjection
        );
    }, []);
    const injectionEngine = useInjectEngine(extractDomain(props.endpoint), props.title, AppConfig.isTestnet);
    const handleWebViewMessage = React.useCallback((event: WebViewMessageEvent) => {
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

    const onCloseApp = React.useCallback(() => {
        engine.products.zenPay.doSync();
        navigation.goBack();
        trackEvent(MixpanelEvent.ZenPayClose, { type: props.variant.type, duration: Date.now() - start }, AppConfig.isTestnet);
    }, []);

    const safelyOpenUrl = React.useCallback((url: string) => {
        try {
            let pageDomain = extractDomain(url);
            if (
                pageDomain.endsWith('tonsandbox.com')
                || pageDomain.endsWith('tonwhales.com')
                || pageDomain.endsWith('tontestnet.com')
                || pageDomain.endsWith('tonhub.com')
            ) {
                openWithInApp(url);
                return;
            }
        } catch (e) {
            warn(e);
        }
    }, []);

    const onNavigation = React.useCallback((url: string) => {
        const params = extractZenPayQueryParams(url);
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

    const onHardwareBackPress = React.useCallback(() => {
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

    React.useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
        return () => {
            BackHandler.removeEventListener('hardwareBackPress', onHardwareBackPress);
        }
    }, [onHardwareBackPress]);

    const onContentProcessDidTerminate = React.useCallback(() => {
        webRef.current?.reload();
    }, []);

    return (
        <>
            <View style={{ backgroundColor: Theme.item, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
                <AnotherKeyboardAvoidingView
                    style={{ backgroundColor: Theme.item, flexGrow: 1 }}
                >
                    <WebView
                        ref={webRef}
                        source={{ uri: `${props.endpoint}?lang=${lang}&currency=${currency}` }}
                        startInLoadingState={true}
                        style={{
                            backgroundColor: Theme.item,
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
                </AnotherKeyboardAvoidingView>
                <Animated.View
                    style={animatedStyles}
                    pointerEvents={loaded ? 'none' : 'box-none'}
                >
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                        <AndroidToolbar accentColor={'#564CE2'} onBack={() => navigation.goBack()} />
                    </View>
                    {Platform.OS === 'ios' && (
                        <Pressable
                            style={{ position: 'absolute', top: 22, right: 16 }}
                            onPress={() => {
                                navigation.goBack();
                            }} >
                            <Text style={{ color: '#564CE2', fontWeight: '500', fontSize: 17 }}>
                                {t('common.close')}
                            </Text>
                        </Pressable>
                    )}
                    <ActivityIndicator size="small" color={'#564CE2'} />
                </Animated.View>
            </View>
        </>
    );
});