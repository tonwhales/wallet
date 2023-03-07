import * as React from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { extractDomain } from '../../../engine/utils/extractDomain';
import { resolveUrl } from '../../../utils/resolveUrl';
import { useLinkNavigator } from '../../../Navigation';
import { AppConfig } from '../../../AppConfig';
import { useEngine } from '../../../engine/Engine';
import { protectNavigation } from './protect/protectNavigation';
import { RoundButton } from '../../../components/RoundButton';
import { t } from '../../../i18n/t';
import { MixpanelEvent, trackEvent, useTrackEvent } from '../../../analytics/mixpanel';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import { Theme } from '../../../Theme';
import { useDAppBridge } from '../../../engine/tonconnect/useInjectConnectEngine';

export const ConnectAppComponent = React.memo((props: {
    endpoint: string,
    title: string,
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
        trackEvent(MixpanelEvent.AppClose, { url: props.endpoint, domain, duration: Date.now() - start, protocol: 'tonconnect' });
    }, []);
    useTrackEvent(MixpanelEvent.AppOpen, { url: props.endpoint, domain, protocol: 'tonconnect' });

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
    const { ref, isConnected, disconnect, ...webViewProps } = useDAppBridge(
        props.endpoint,
        engine,
        navigation
    );

    return (
        <>
            <View style={{ backgroundColor: Theme.background, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
                <View style={{ height: safeArea.top }} />
                <WebView
                    ref={ref}
                    source={{ uri: props.endpoint }}
                    startInLoadingState={true}
                    style={{ backgroundColor: Theme.background, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}
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
                    onShouldStartLoadWithRequest={loadWithRequest}
                    {...webViewProps}
                />

                <Animated.View
                    style={animatedStyles}
                    pointerEvents={loaded ? 'none' : 'box-none'}
                >
                    <ActivityIndicator size="large" color={Theme.accent} />
                </Animated.View>

            </View>
            <View style={{ flexDirection: 'row', height: 50 + safeArea.bottom, alignItems: 'center', justifyContent: 'center', paddingBottom: safeArea.bottom, backgroundColor: Theme.background }}>
                <RoundButton
                    title={t('common.close')}
                    display="secondary"
                    size="normal"
                    style={{ paddingHorizontal: 8 }}
                    onPress={close}
                />
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