import * as React from 'react';
import { ActivityIndicator, Linking, Platform, Share, View } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DomainSubkey } from '../../../engine/products/ExtensionsProduct';
import { ShouldStartLoadRequest, WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';
import { extractDomain } from '../../../engine/utils/extractDomain';
import { resolveUrl } from '../../../utils/resolveUrl';
import { useLinkNavigator } from '../../../Navigation';
import { warn } from '../../../utils/log';
import { createInjectSource, dispatchResponse } from './inject/createInjectSource';
import { useInjectEngine } from './inject/useInjectEngine';
import { AppConfig } from '../../../AppConfig';
import { useEngine } from '../../../engine/Engine';
import { contractFromPublicKey } from '../../../engine/contractFromPublicKey';
import { protectNavigation } from './protect/protectNavigation';
import { RoundButton } from '../../../components/RoundButton';
import { t } from '../../../i18n/t';
import MoreIcon from '../../../../assets/ic_more.svg';
import { MenuView } from '@react-native-menu/menu';
import { generateAppLink } from '../../../utils/generateAppLink';
import { MixpanelEvent, trackEvent, useTrackEvent } from '../../../analytics/mixpanel';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';

export const AppComponent = React.memo((props: {
    endpoint: string,
    color: string,
    dark: boolean,
    foreground: string,
    title: string,
    domainKey: DomainSubkey
}) => {

    // 
    // Track events
    // 
    const domain = extractDomain(props.endpoint);
    const navigation = useTypedNavigation();
    const start = React.useMemo(() => {
        return Date.now();
    }, []);
    const close = React.useCallback(() => {
        navigation.goBack();
        trackEvent(MixpanelEvent.AppClose, { url: props.endpoint, domain, duration: Date.now() - start });
    }, []);
    useTrackEvent(MixpanelEvent.AppOpen, { url: props.endpoint, domain });

    // 
    // Actions menu
    // 

    const onShare = React.useCallback(
        () => {
            const link = generateAppLink(props.endpoint, props.title);
            if (Platform.OS === 'ios') {
                Share.share({ title: t('receive.share.title'), url: link });
            } else {
                Share.share({ title: t('receive.share.title'), message: link });
            }
        },
        [props],
    );

    const onReview = React.useCallback(
        () => {
            navigation.navigateReview({ type: 'review', url: props.endpoint });
        },
        [props],
    );

    const onReport = React.useCallback(
        () => {
            navigation.navigateReview({ type: 'report', url: props.endpoint });
        },
        [props],
    );

    //
    // View
    //

    const safeArea = useSafeAreaInsets();
    let [loaded, setLoaded] = React.useState(false);
    const webRef = React.useRef<WebView>(null);
    const opacity = useSharedValue(1);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: props.color,
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

    return (
        <>
            <View style={{ backgroundColor: props.color, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
                <View style={{ height: safeArea.top }} />
                <WebView
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
                />

                <Animated.View
                    style={animatedStyles}
                    pointerEvents={loaded ? 'none' : 'box-none'}
                >
                    <ActivityIndicator size="large" color={props.foreground} />
                </Animated.View>

            </View>
            <View style={{ flexDirection: 'row', height: 50 + safeArea.bottom, alignItems: 'center', justifyContent: 'center', paddingBottom: safeArea.bottom, backgroundColor: props.color }}>
                <RoundButton
                    title={t('common.close')}
                    display="secondary"
                    size="normal"
                    style={{ paddingHorizontal: 8 }}
                    onPress={close}
                />
                <MenuView
                    style={{
                        position: 'absolute',
                        top: 8, right: 16,
                        height: 32
                    }}
                    onPressAction={({ nativeEvent }) => {
                        if (nativeEvent.event === 'share') onShare();
                        if (nativeEvent.event === 'review') onReview();
                        if (nativeEvent.event === 'report') onReport();
                    }}
                    actions={[
                        { title: t('report.title'), id: 'report', image: Platform.OS === 'ios' ? 'exclamationmark.triangle' : undefined, attributes: { destructive: true } },
                        { title: t('review.title'), id: 'review', image: Platform.OS === 'ios' ? 'star' : undefined },
                        { title: t('common.share'), id: 'share', image: Platform.OS === 'ios' ? 'square.and.arrow.up' : undefined },
                    ]}
                >
                    <MoreIcon color={'black'} height={30} width={30} />
                </MenuView>
                <View style={{
                    position: 'absolute',
                    top: 0.5, left: 0, right: 0,
                    height: 0.5,
                    width: '100%',
                    backgroundColor: '#000',
                    opacity: 0.08
                }} />
            </View>
        </>
    );
});