import * as React from 'react';
import { ActivityIndicator, Linking, Platform, View } from 'react-native';
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
import { keyPairFromSeed } from 'ton-crypto';
import { contractFromPublicKey } from '../../../engine/contractFromPublicKey';
import { beginCell, safeSign } from 'ton';
import { getAppInstancePublicKey } from '../../../storage/appState';

export const AppComponent = React.memo((props: {
    endpoint: string,
    color: string,
    foreground: string,
    title: string,
    domainKey: DomainSubkey
}) => {

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
        const resolved = resolveUrl(event.url);
        if (resolved) {
            linkNavigator(resolved);
            return false;
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
        const subkey = keyPairFromSeed(props.domainKey.secret);
        const contract = contractFromPublicKey(engine.publicKey);
        const walletConfig = contract.source.backup();
        const walletType = contract.source.type;
        const domain = extractDomain(props.endpoint);

        const time = Math.floor((Date.now() / 1000));
        const toSign = beginCell()
            .storeCoins(1)
            .storeAddress(contract.address)
            .storeUint(time, 32)
            .storeRefMaybe(beginCell()
                .storeBuffer(Buffer.from(domain))
                .endCell())
            .endCell();
        const signature = safeSign(toSign, subkey.secretKey);

        return createInjectSource({
            version: 1,
            platform: Platform.OS,
            platformVersion: Platform.Version,
            network: AppConfig.isTestnet ? 'sandbox' : 'mainnet',
            address: engine.address.toFriendly({ testOnly: AppConfig.isTestnet }),
            publicKey: engine.publicKey.toString('base64'),
            walletConfig,
            walletType,
            signature: signature.toString('base64'),
            time,
            subkey: {
                domain: domain,
                publicKey: subkey.publicKey.toString('base64'),
                time: props.domainKey.time,
                signature: props.domainKey.signature.toString('base64')
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
    );
});