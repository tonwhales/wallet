import * as React from 'react';
import { ActivityIndicator, Linking, Platform, View, Text, Pressable, Alert, KeyboardAvoidingView, BackHandler } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShouldStartLoadRequest, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { MixpanelEvent, trackEvent, useTrackEvent } from '../../analytics/mixpanel';
import { t } from '../../i18n/t';
import { useLinkNavigator } from '../../Navigation';
import { resolveUrl } from '../../utils/resolveUrl';
import { AppConfig } from '../../AppConfig';
import { protectNavigation } from '../apps/components/protect/protectNavigation';
import { useEngine } from '../../engine/Engine';
import { contractFromPublicKey } from '../../engine/contractFromPublicKey';
import { createInjectSource, dispatchResponse } from '../apps/components/inject/createInjectSource';
import { useInjectEngine } from '../apps/components/inject/useInjectEngine';
import { warn } from '../../utils/log';
import { Theme } from '../../Theme';
import { AndroidToolbar } from '../../components/AndroidToolbar';
import { ZenPayAppParams } from './ZenPayAppFragment';
import { HeaderBackButton } from "@react-navigation/elements";
import { openWithInApp } from '../../utils/openWithInApp';

export const ZenPayAppComponent = React.memo((props: { variant: ZenPayAppParams, token: string, title: string, endpoint: string }) => {
    const engine = useEngine();
    const zenPayCards = engine.products.zenPay.useCards();
    const [canGoBack, setCanGoBack] = React.useState(false);
    const [scrollEnabled, setScrollEnabled] = React.useState(true);
    const [promptBeforeExit, setPromptBeforeExit] = React.useState(true);
    const [pageTitle, setPageTitle] = React.useState(t('products.zenPay.title'));
    const webRef = React.useRef<WebView>(null);
    const navigation = useTypedNavigation();

    // 
    // Page title
    // 
    const updatePateTitle = React.useCallback(
        (url: string) => {
            const card = /\/card\/[a-z0-9]+/;
            if (card.test(url)) {

                let cardNumber: string | number | undefined | null = undefined;
                const parts = url.split("/");
                if (parts.length > 4) {
                    const cardId = parts[4];
                    const account = zenPayCards.find((c) => c.id === cardId);
                    if (account) {
                        cardNumber = account.card.lastFourDigits;
                    }
                }

                const limits = /^https:\/\/next\.zenpay\.org\/card\/[a-z0-9]+\/limits$/;
                if (limits.test(url)) {
                    setPageTitle(cardNumber ? t('products.zenPay.pageTitles.cardLimits', { cardNumber }) : t('products.zenPay.pageTitles.cardLimitsDefault'));
                    return;
                }

                const deposit = /^https:\/\/next\.zenpay\.org\/card\/[a-z0-9]+\/deposit$/;
                if (deposit.test(url)) {
                    setPageTitle(t('products.zenPay.pageTitles.cardDeposit'));
                    return;
                }

                const details = /^https:\/\/next\.zenpay\.org\/card\/[a-z0-9]+\/details$/;
                if (details.test(url)) {
                    setPageTitle(t('products.zenPay.pageTitles.cardDetails'));
                    return;
                }

                const transfer = /^https:\/\/next\.zenpay\.org\/card\/[a-z0-9]+\/transfer$/;
                if (transfer.test(url)) {
                    setPageTitle(t('products.zenPay.pageTitles.transfer'));
                    return;
                }

                setPageTitle(t('products.zenPay.pageTitles.card'));
            } else if (url.indexOf('/auth') !== -1) {
                setPageTitle(t('products.zenPay.title'));
            } else {
                setPageTitle(t('products.zenPay.pageTitles.general'));
            }
        },
        [zenPayCards],
    );

    // 
    // Track events
    // 
    const start = React.useMemo(() => {
        return Date.now();
    }, []);
    const close = React.useCallback(() => {
        // Handle extension back navigation
        if (canGoBack) {
            webRef.current?.goBack();
            return true;
        }

        if (promptBeforeExit) {
            Alert.alert(t('products.zenPay.confirm.title'), t('products.zenPay.confirm.message'), [{
                text: t('common.close'),
                style: 'destructive',
                onPress: () => {
                    engine.products.zenPay.doSync();
                    navigation.goBack();
                    trackEvent(MixpanelEvent.ZenPayClose, { type: props.variant.type, duration: Date.now() - start });
                }
            }, {
                text: t('common.cancel'),
            }]);
            return true;
        } else {
            engine.products.zenPay.doSync();
            navigation.goBack();
            trackEvent(MixpanelEvent.ZenPayClose, { type: props.variant.type, duration: Date.now() - start });
            return true;
        }
    }, [webRef, canGoBack, promptBeforeExit]);
    useTrackEvent(MixpanelEvent.ZenPay, { url: props.variant.type });

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
            backgroundColor: Theme.background,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: withTiming(opacity.value, { duration: 300 }),
        };
    });

    //
    // Navigation
    //
    const linkNavigator = useLinkNavigator();
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

        let domainSign = engine.products.keys.createDomainSignature(domain);

        return createInjectSource({
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
        });
    }, []);
    const injectionEngine = useInjectEngine(extractDomain(props.endpoint), props.title);
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
                if (pageDomain.endsWith('tonsandbox.com') || pageDomain.endsWith('tonwhales.com')) {
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

    const updateCanGoBack = React.useCallback((url: string, canGoBack: boolean) => {
        const cardAction = /\/card\/[a-z0-9]+\/confirm\?action=/;
        if (cardAction.test(url)) {
            setCanGoBack(canGoBack);
            return;
        }
        if (
            url.indexOf('/auth/countrySelect') !== -1
            || url.indexOf('/auth/phone') !== -1
            || url.indexOf('/auth/code') !== -1
            || url.endsWith('details')
            || url.endsWith('deposit')
            || url.endsWith('limits')
            || url.endsWith('transfer')
        ) {
            setCanGoBack(canGoBack);
        } else {
            setCanGoBack(false);
        }
    }, []);

    const updateScrollEnabled = React.useCallback((url: string) => {
        if (url.indexOf('/auth/countrySelect') !== -1
            || url.indexOf('/auth/phone') !== -1
            || url.indexOf('/auth/code') !== -1
        ) {
            setScrollEnabled(true);
        } else {
            setScrollEnabled(false);
        }
    }, []);

    const updatePromptBeforeExit = React.useCallback((url: string) => {
        if (url.indexOf('/auth/countrySelect') !== -1
            || url.indexOf('/auth/phone') !== -1
            || url.indexOf('/auth/code') !== -1
            || url.endsWith('auth')
            || url.endsWith('create')
            || url.endsWith('kyc')
        ) {
            setPromptBeforeExit(true);
        } else {
            setScrollEnabled(false);
        }
    }, []);

    React.useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', close);
        return () => {
            BackHandler.removeEventListener('hardwareBackPress', close);
        }
    }, [close]);

    return (
        <>
            <View style={{ backgroundColor: Theme.background, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
                <AndroidToolbar
                    pageTitle={pageTitle}
                    onBack={close}
                />
                {Platform.OS === 'ios' && (
                    <>
                        <View style={{
                            width: '100%',
                            flexDirection: 'row',
                            paddingHorizontal: 15,
                            marginVertical: 14,
                            height: 42,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            {canGoBack && (
                                <Animated.View
                                    entering={FadeIn}
                                    exiting={FadeOut}
                                    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, justifyContent: 'center' }}
                                >
                                    <HeaderBackButton
                                        label={t('common.back')}
                                        labelVisible
                                        onPress={close}
                                        tintColor={Theme.accent}
                                    />
                                </Animated.View>
                            )}
                            {!canGoBack && (
                                <Animated.View
                                    style={{
                                        position: 'absolute',
                                        top: 0, bottom: 0, left: 15, justifyContent: 'center'
                                    }}
                                    entering={FadeIn}
                                    exiting={FadeOut}
                                >
                                    <Pressable
                                        style={({ pressed }) => {
                                            return ({
                                                opacity: pressed ? 0.3 : 1,
                                            });
                                        }}
                                        onPress={close}
                                    >
                                        <Text style={{
                                            fontWeight: '400',
                                            fontSize: 17,
                                            textAlign: 'center',
                                        }}>
                                            {canGoBack ? t('common.back') : t('common.close')}
                                        </Text>
                                    </Pressable>
                                </Animated.View>
                            )}
                            <Text style={{
                                fontWeight: '600',
                                fontSize: 17,
                                textAlign: 'center',
                            }}>
                                {pageTitle}
                            </Text>
                        </View>
                    </>
                )}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{
                        backgroundColor: Theme.background,
                        flexGrow: 1,
                    }}
                >
                    <WebView
                        ref={webRef}
                        source={{ uri: props.endpoint }}
                        startInLoadingState={true}
                        style={{
                            backgroundColor: Theme.background,
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
                                // Update canGoBack
                                updateCanGoBack(event.nativeEvent.url, event.nativeEvent.canGoBack);

                                // Update promptBeforeExit
                                updatePromptBeforeExit(event.nativeEvent.url);

                                // Page title 
                                updatePateTitle(event.nativeEvent.url);
                            }
                        }}
                        onNavigationStateChange={(event: WebViewNavigation) => {

                            // Update canGoBack
                            updateCanGoBack(event.url, event.canGoBack);

                            // Update scrollEnabled for iOS
                            if (Platform.OS === 'ios') {
                                updateScrollEnabled(event.url)
                            }

                            // Update promptBeforeExit
                            updatePromptBeforeExit(event.url)

                            // Page title 
                            updatePateTitle(event.url);
                        }}
                        scrollEnabled={scrollEnabled}
                        contentInset={{ top: 0, bottom: 0 }}
                        autoManageStatusBarEnabled={false}
                        allowFileAccessFromFileURLs={false}
                        allowUniversalAccessFromFileURLs={false}
                        decelerationRate="normal"
                        allowsInlineMediaPlayback={true}
                        injectedJavaScriptBeforeContentLoaded={injectSource}
                        onShouldStartLoadWithRequest={loadWithRequest}
                        onMessage={handleWebViewMessage}
                        keyboardDisplayRequiresUserAction={false}
                    />
                </KeyboardAvoidingView>
                <Animated.View
                    style={animatedStyles}
                    pointerEvents={loaded ? 'none' : 'box-none'}
                >
                    <ActivityIndicator size="large" color={Theme.accent} />
                </Animated.View>
            </View>
        </>
    );
});