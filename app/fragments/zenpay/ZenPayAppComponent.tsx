import * as React from 'react';
import { ActivityIndicator, Linking, Platform, View, Text, Pressable, Alert, KeyboardAvoidingView } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
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

export const ZenPayAppComponent = React.memo((props: { variant: ZenPayAppParams, token: string, title: string, endpoint: string }) => {
    const [canGoBack, setCanGoBack] = React.useState(false);
    const [scrollEnabled, setScrollEnabled] = React.useState(false);
    const webRef = React.useRef<WebView>(null);
    const navigation = useTypedNavigation();

    // 
    // Track events
    // 
    const start = React.useMemo(() => {
        return Date.now();
    }, []);
    const close = React.useCallback(() => {
        Alert.alert(t('products.zenPay.confirm.title'), t('products.zenPay.confirm.message'), [{
            text: t('common.close'),
            style: 'destructive',
            onPress: () => {
                if (canGoBack) {
                    webRef.current?.goBack();
                }
                navigation.goBack();
                trackEvent(MixpanelEvent.ZenPayClose, { type: props.variant.type, duration: Date.now() - start });
            }
        }, {
            text: t('common.cancel'),
        }]);
    }, [webRef]);
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

    const engine = useEngine();
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
    const injectionEngine = useInjectEngine(props.title);
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

    console.log({ canGoBack });

    return (
        <>
            <View style={{ backgroundColor: Theme.background, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
                <AndroidToolbar
                    pageTitle={t('products.zenPay.title')}
                    onBack={close}
                />
                {Platform.OS === 'ios' && (
                    <>
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ height: 4, width: 35, borderRadius: 5, backgroundColor: '#CFCBCB', marginTop: 6 }} />
                        </View>
                        <View style={{
                            width: '100%',
                            flexDirection: 'row',
                            marginTop: 14,
                            paddingHorizontal: 15,
                            justifyContent: 'center',
                            paddingBottom: 8
                        }}>
                            <Pressable
                                style={({ pressed }) => {
                                    return ({
                                        opacity: pressed ? 0.3 : 1,
                                        position: 'absolute', top: 0, bottom: 0, left: 15
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
                            <Text style={{
                                fontWeight: '600',
                                fontSize: 17,
                                textAlign: 'center'
                            }}>
                                {t('products.zenPay.title')}
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
                        onNavigationStateChange={(event: WebViewNavigation) => {
                            console.log({ event });
                            if (event.url.endsWith('auth')) {
                                setScrollEnabled(false);
                            } else {
                                setScrollEnabled(true);
                                setCanGoBack(event.canGoBack);
                            }
                        }}
                        scrollEnabled={false}
                        contentInset={{ top: 0, bottom: 0 }}
                        autoManageStatusBarEnabled={false}
                        allowFileAccessFromFileURLs={false}
                        allowUniversalAccessFromFileURLs={false}
                        decelerationRate="normal"
                        allowsInlineMediaPlayback={true}
                        injectedJavaScriptBeforeContentLoaded={injectSource}
                        onShouldStartLoadWithRequest={loadWithRequest}
                        onMessage={handleWebViewMessage}
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