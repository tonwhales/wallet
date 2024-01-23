import { Linking, View } from "react-native";
import { fragment } from "../../fragment";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useDAppBridge, useNetwork, usePrice, useThemeStyle } from "../../engine/hooks";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { usePermissions } from "expo-notifications";
import { useCallback, useMemo, useState } from "react";
import { getCurrentAddress } from "../../storage/appState";
import i18n from 'i18next';
import { DAppWebview } from "../../components/webview/DAppWebview";
import { useLinkNavigator } from "../../useLinkNavigator";
import { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { extractDomain } from "../../engine/utils/extractDomain";
import { resolveUrl } from "../../utils/resolveUrl";
import { protectNavigation } from "../apps/components/protect/protectNavigation";
import { useInjectEngine } from "../apps/components/inject/useInjectEngine";
import { injectSourceFromDomain } from "../../engine/utils/injectSourceFromDomain";

export const DevDAppWebviewFragment = fragment(() => {
    const [themeStyle,] = useThemeStyle();
    const isTestnet = useNetwork().isTestnet;
    const navigation = useTypedNavigation();
    const [pushPemissions,] = usePermissions();
    const [, currency] = usePrice();

    const initExampleUrl = isTestnet ? 'https://apps-sandbox.vercel.app/apps/examples/full' : 'https://apps.tonhub.com/apps/examples/full';

    const [url, setUrl] = useState(initExampleUrl);
    const [engine, setEngine] = useState<'ton-x' | 'ton-connect' | null>(null);
    const [useMainButton, setUseMainButton] = useState(true);
    const [useStatusBar, setUseStatusBar] = useState(true);
    const [useToaster, setUseToaster] = useState(true);

    const endpoint = useMemo(() => {
        try {
            const selected = getCurrentAddress();
            const pushNotifications = pushPemissions?.granted && pushPemissions?.status === 'granted';

            const source = new URL(url);

            source.searchParams.set('address', encodeURIComponent(selected.addressString));
            source.searchParams.set('utm_source', 'tonhub');
            source.searchParams.set('utm_content', 'extension');
            source.searchParams.set('ref', 'tonhub');
            source.searchParams.set('lang', i18n.language);
            source.searchParams.set('currency', currency);
            source.searchParams.set('themeStyle', themeStyle === 'dark' ? 'dark' : 'light');
            source.searchParams.set('pushNotifications', pushNotifications ? 'true' : 'false');

            return source.toString();
        } catch {
            return url;
        }
    }, [url, pushPemissions, currency]);

    const linkNavigator = useLinkNavigator(isTestnet);
    const loadWithRequest = useCallback((event: ShouldStartLoadRequest): boolean => {
        if (extractDomain(event.url) === extractDomain(endpoint)) {
            return true;
        }

        // Resolve internal url
        const resolved = resolveUrl(event.url, isTestnet);
        if (resolved) {
            linkNavigator(resolved);
            return false;
        }

        // Secondary protection
        let prt = protectNavigation(event.url, endpoint);
        if (prt) {
            return true;
        }

        // Resolve linking
        Linking.openURL(event.url);
        return false;
    }, [endpoint, linkNavigator]);

    //
    // Injection
    //

    // ton-connect
    const { ref: webViewRef, isConnected, disconnect, ...tonConnectWebViewProps } = useDAppBridge(endpoint, navigation);
    const injectionEngine = useInjectEngine(domain, props.title, isTestnet, props.endpoint);

    const webViewProps = useMemo(() => {
        if (engine === 'ton-connect') {
            return tonConnectWebViewProps;
        }

        if (engine === 'ton-x') {
            const injectionSource = injectSourceFromDomain()
        }

        return {};
    }, [engine, tonConnectWebViewProps]);


    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({
                ios: 'light',
                android: themeStyle === 'dark' ? 'light' : 'dark',
            })} />
            <DAppWebview
                ref={webViewRef}
                source={{ uri: endpoint }}
                useStatusBar={useStatusBar}
                useMainButton={useMainButton}
                useToaster={useToaster}
                onShouldStartLoadWithRequest={loadWithRequest}
            />
        </View>
    )
});