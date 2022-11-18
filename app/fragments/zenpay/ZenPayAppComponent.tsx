import * as React from 'react';
import { ActivityIndicator, Linking, NativeSyntheticEvent, Platform, Share, View, Text } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShouldStartLoadRequest, WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';
import ContextMenu, { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { DomainSubkey } from '../../engine/products/ExtensionsProduct';
import { MixpanelEvent, trackEvent, useTrackEvent } from '../../analytics/mixpanel';
import { generateAppLink } from '../../utils/generateAppLink';
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
import { RoundButton } from '../../components/RoundButton';
import { Theme } from '../../Theme';

export const ZenPayAppComponent = React.memo((props: { variant: { cardNumber: string, type: 'card' } | { type: 'account' } }) => {

    // 
    // Track events
    // 
    const navigation = useTypedNavigation();
    const start = React.useMemo(() => {
        return Date.now();
    }, []);
    const close = React.useCallback(() => {
        navigation.goBack();
        trackEvent(MixpanelEvent.AppClose, { type: props.variant.type, duration: Date.now() - start });
    }, []);
    useTrackEvent(MixpanelEvent.AppOpen, { url: props.variant.type });

    //
    // View
    //

    // const safeArea = useSafeAreaInsets();
    // let [loaded, setLoaded] = React.useState(false);
    // const webRef = React.useRef<WebView>(null);
    // const opacity = useSharedValue(1);
    // const animatedStyles = useAnimatedStyle(() => {
    //     return {
    //         position: 'absolute',
    //         top: 0,
    //         left: 0,
    //         right: 0,
    //         bottom: 0,
    //         backgroundColor: Theme.background,
    //         alignItems: 'center',
    //         justifyContent: 'center',
    //         opacity: withTiming(opacity.value, { duration: 300 }),
    //     };
    // });

    // //
    // // Navigation
    // //

    // const linkNavigator = useLinkNavigator();
    // const loadWithRequest = React.useCallback((event: ShouldStartLoadRequest): boolean => {
    //     if (extractDomain(event.url) === extractDomain(props.endpoint)) {
    //         return true;
    //     }

    //     // Resolve internal url
    //     const resolved = resolveUrl(event.url, AppConfig.isTestnet);
    //     if (resolved) {
    //         linkNavigator(resolved);
    //         return false;
    //     }

    //     // Secondary protection
    //     let prt = protectNavigation(event.url, props.endpoint);
    //     if (prt) {
    //         return true;
    //     }

    //     // Resolve linking
    //     Linking.openURL(event.url);
    //     return false;
    // }, []);

    // //
    // // Injection
    // //

    // const engine = useEngine();
    // const injectSource = React.useMemo(() => {
    //     const contract = contractFromPublicKey(engine.publicKey);
    //     const walletConfig = contract.source.backup();
    //     const walletType = contract.source.type;
    //     const domain = extractDomain(props.endpoint);

    //     let domainSign = engine.products.keys.createDomainSignature(domain);

    //     return createInjectSource({
    //         version: 1,
    //         platform: Platform.OS,
    //         platformVersion: Platform.Version,
    //         network: AppConfig.isTestnet ? 'testnet' : 'mainnet',
    //         address: engine.address.toFriendly({ testOnly: AppConfig.isTestnet }),
    //         publicKey: engine.publicKey.toString('base64'),
    //         walletConfig,
    //         walletType,
    //         signature: domainSign.signature,
    //         time: domainSign.time,
    //         subkey: {
    //             domain: domainSign.subkey.domain,
    //             publicKey: domainSign.subkey.publicKey,
    //             time: domainSign.subkey.time,
    //             signature: domainSign.subkey.signature
    //         }
    //     });
    // }, []);
    // const injectionEngine = useInjectEngine(props.title);
    // const handleWebViewMessage = React.useCallback((event: WebViewMessageEvent) => {
    //     const nativeEvent = event.nativeEvent;

    //     // Resolve parameters
    //     let data: any;
    //     let id: number;
    //     try {
    //         let parsed = JSON.parse(nativeEvent.data);
    //         if (typeof parsed.id !== 'number') {
    //             warn('Invalid operation id');
    //             return;
    //         }
    //         id = parsed.id;
    //         data = parsed.data;
    //     } catch (e) {
    //         warn(e);
    //         return;
    //     }

    //     // Execute
    //     (async () => {
    //         let res = { type: 'error', message: 'Unknown error' };
    //         try {
    //             res = await injectionEngine.execute(data);
    //         } catch (e) {
    //             warn(e);
    //         }
    //         dispatchResponse(webRef, { id, data: res });
    //     })();

    // }, []);

    return (
        <>
            <View style={{ backgroundColor: Theme.background, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
                {/* <WebView
                    ref={webRef}
                    source={{ uri: props.endpoint }}
                    startInLoadingState={true}
                    style={{ backgroundColor: props.color, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}
                    onLoadEnd={() => {
                        setLoaded(true);
                        opacity.value = 0;
                    }}
                    contentInset={{ top: 0, bottom: 0 }}
                    autoManageStatusBarEnabled={false}
                    allowFileAccessFromFileURLs={false}
                    allowUniversalAccessFromFileURLs={false}
                    decelerationRate="normal"
                    allowsInlineMediaPlayback={true}
                    injectedJavaScriptBeforeContentLoaded={injectSource}
                    onShouldStartLoadWithRequest={loadWithRequest}
                    onMessage={handleWebViewMessage}
                /> */}
                <Text style={{
                    color: Theme.textColor,
                    alignSelf: 'center'
                }}>
                    {'ZEN PAY GOES HERE'}
                </Text>

                {/* <Animated.View
                    style={animatedStyles}
                    pointerEvents={loaded ? 'none' : 'box-none'}
                >
                    <ActivityIndicator size="large" color={Theme.accent} />
                </Animated.View> */}

            </View>
        </>
    );
});