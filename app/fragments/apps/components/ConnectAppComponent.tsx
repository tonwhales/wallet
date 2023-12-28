import * as React from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { extractDomain } from '../../../engine/utils/extractDomain';
import { resolveUrl } from '../../../utils/resolveUrl';
import { useLinkNavigator } from "../../../useLinkNavigator";
import { protectNavigation } from './protect/protectNavigation';
import { MixpanelEvent, trackEvent, useTrackEvent } from '../../../analytics/mixpanel';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import { useDAppBridge } from '../../../engine/hooks';
import { useTheme } from '../../../engine/hooks';
import { useNetwork } from '../../../engine/hooks';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { memo, useCallback, useMemo, useState } from 'react';

export const ConnectAppComponent = memo((props: {
    endpoint: string,
    title: string,
}) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();

    // Track events
    const domain = extractDomain(props.endpoint);
    const navigation = useTypedNavigation();
    const start = useMemo(() => Date.now(), []);
    const close = useCallback(() => {
        navigation.goBack();
        trackEvent(
            MixpanelEvent.AppClose,
            {
                url: props.endpoint,
                domain,
                duration: Date.now() - start,
                protocol: 'tonconnect'
            },
            isTestnet
        );
    }, []);
    useTrackEvent(MixpanelEvent.AppOpen, { url: props.endpoint, domain, protocol: 'tonconnect' }, isTestnet);

    const safeArea = useSafeAreaInsets();
    let [loaded, setLoaded] = useState(false);
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
            opacity: withTiming(opacity.value, { duration: 300 }),
        };
    });

    // Navigation
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

    // Injection
    const { ref, isConnected, disconnect, ...webViewProps } = useDAppBridge(
        props.endpoint,
        navigation
    );

    const endpoint = useMemo(() => {
        const url = new URL(props.endpoint);
        url.searchParams.set('utm_source', 'tonhub');
        url.searchParams.set('utm_content', 'extension');
        return url.toString();
    }, [props.endpoint]);

    return (
        <>
            <View style={{ backgroundColor: theme.backgroundPrimary, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
                <ScreenHeader
                    style={{ paddingTop: 32, paddingHorizontal: 16 }}
                    onBackPressed={close}
                    title={props.title}
                />
                <WebView
                    ref={ref}
                    source={{ uri: endpoint }}
                    startInLoadingState={true}
                    style={{ backgroundColor: theme.backgroundPrimary, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}
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
                    <ActivityIndicator size="large" color={theme.accent} />
                </Animated.View>

            </View>
        </>
    );
});