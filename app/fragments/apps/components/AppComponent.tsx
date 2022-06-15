import * as React from 'react';
import { ActivityIndicator, Alert, Linking, View } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DomainSubkey } from '../../../engine/products/AppsProduct';
import { ShouldStartLoadRequest, WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';
import { extractDomain } from '../../../utils/extractDomain';
import { resolveUrl } from '../../../utils/resolveUrl';
import { useLinkNavigator } from '../../../Navigation';
import { tonXinjectionSource } from '../../../engine/tonx/tonXinjectionSource';
import { TonXMessage, tonXMessageCodec } from '../../../engine/tonx/codecs';
import { isLeft } from 'fp-ts/lib/Either';
import { AppConfig } from '../../../AppConfig';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import { handleTonXMessage } from '../../../engine/tonx/transport';
import { t } from '../../../i18n/t';

export const AppComponent = React.memo((props: {
    endpoint: string,
    color: string,
    foreground: string,
    title: string,
    domainKey: DomainSubkey
}) => {
    const safeArea = useSafeAreaInsets();
    let [loaded, setLoaded] = React.useState(false);
    const [locked, setLocked] = React.useState(false);
    const webRef = React.createRef<WebView>();
    const navigation = useTypedNavigation();
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
    const linkNavigator = useLinkNavigator();
    const loadWithRequest = React.useCallback((event: ShouldStartLoadRequest): boolean => {
        if (extractDomain(event.url) === extractDomain(props.endpoint)) {
            return true;
        }

        // Resolve internal url
        const resolved = resolveUrl(event.url);
        if (resolved) {
            linkNavigator(resolved);
            return false;
        }

        // Resolve linking
        Linking.openURL(event.url);
        return false;
    }, []);

    const handleWebViewMessage = React.useCallback(
        (event: WebViewMessageEvent) => {
            if (locked) return;
            const nativeEvent = event.nativeEvent;
            const parsedTonXMessage = tonXMessageCodec.decode(JSON.parse(nativeEvent.data));
            // Ignore non toxMessages
            if (!isLeft(parsedTonXMessage)) {
                const message = parsedTonXMessage.right as TonXMessage<any>;

                // Check for net missmatch
                if (message.data.testnet !== AppConfig.isTestnet) {
                    setLocked(true);

                    Alert.alert(
                        t('auth.apps.wrongChainTitle'),
                        t('auth.apps.wrongChainMesage'),
                        [{
                            text: t('common.yes'),
                            style: 'destructive',
                            onPress: () => { navigation.goBack(); }
                        }]
                    );
                    return;
                }

                handleTonXMessage(message, props.domainKey, webRef);
            }
        }, [props.domainKey, webRef, locked]);
    return (
        <View style={{ backgroundColor: props.color, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
            <WebView
                ref={webRef}
                source={{ uri: props.endpoint }}
                startInLoadingState={true}
                style={{ backgroundColor: props.color, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}
                onLoadEnd={() => {
                    setLoaded(true);
                    opacity.value = 0;
                }}
                contentInset={{ bottom: safeArea.bottom }}
                autoManageStatusBarEnabled={false}
                allowFileAccessFromFileURLs={false}
                allowUniversalAccessFromFileURLs={false}
                decelerationRate="normal"
                injectedJavaScriptBeforeContentLoaded={tonXinjectionSource}
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
    );
});