import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Linking, View } from "react-native";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { StatusBar } from "expo-status-bar";
import { useDAppBridge, useNetwork, usePrice, useTheme } from "../../engine/hooks";
import { extractDomain } from "../../engine/utils/extractDomain";
import { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { useLinkNavigator } from "../../useLinkNavigator";
import { resolveUrl } from "../../utils/resolveUrl";
import { protectNavigation } from "../apps/components/protect/protectNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { DAppWebview, DAppWebviewProps } from "../../components/webview/DAppWebview";
import { getCurrentAddress } from "../../storage/appState";
import { usePermissions } from "expo-notifications";
import i18n from 'i18next';
import { useInjectEngine } from "../apps/components/inject/useInjectEngine";
import { injectSourceFromDomain } from "../../engine/utils/injectSourceFromDomain";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getDomainKey } from "../../engine/state/domainKeys";

type DAppEngine = 'ton-x' | 'ton-connect';

export type DAppWebViewFragmentParams = {
    url: string;
    title?: string;
    header?: {
        title: string;
        onBack?: () => void;
        onClose?: () => void;
    };
    useMainButton?: boolean;
    useStatusBar?: boolean;
    useQueryAPI?: boolean;
    useToaster?: boolean;
    refId?: string;
    engine?: DAppEngine;
}

export const DAppWebViewFragment = fragment(() => {
    const { url, title, useMainButton, useStatusBar, useQueryAPI, useToaster, header, refId, engine } = useParams<DAppWebViewFragmentParams>();
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const isTestnet = useNetwork().isTestnet;
    const navigation = useTypedNavigation();
    const [pushPemissions,] = usePermissions();
    const [, currency] = usePrice();

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
            source.searchParams.set('themeStyle', theme.style === 'dark' ? 'dark' : 'light');
            source.searchParams.set('theme-style', theme.style === 'dark' ? 'dark' : 'light');
            source.searchParams.set('theme', 'holders');
            source.searchParams.set('pushNotifications', pushNotifications ? 'true' : 'false');

            if (refId) {
                source.searchParams.set('refId', encodeURIComponent(refId));
            }

            return source.toString();
        } catch {
            return url;
        }
    }, [url, pushPemissions, currency, theme.style]);

    const linkNavigator = useLinkNavigator(isTestnet);
    const loadWithRequest = useCallback((event: ShouldStartLoadRequest): boolean => {

        if (extractDomain(event.url) === extractDomain(url)) {
            return true;
        }

        // Resolve internal url
        const resolved = resolveUrl(event.url, isTestnet);
        if (resolved) {
            linkNavigator(resolved);
            return false;
        }

        // Secondary protection
        let prt = protectNavigation(event.url, url);
        if (prt) {
            return true;
        }

        // Resolve linking
        Linking.openURL(event.url);
        return false;
    }, []);

    const headerOnClose = useMemo(() => {
        if (!header?.onClose && !header?.onBack) {
            return navigation.goBack;
        }

        return header.onClose;
    }, []);

    const domain = useMemo(() => {
        try {
            return extractDomain(endpoint)
        } catch {
            return '';
        }
    }, [endpoint]);

    const [hasDomainKey, setHasDomainKey] = useState(!!getDomainKey(domain));

    // ton-connect
    const { ref: webViewRef, isConnected, disconnect, ...tonConnectWebViewProps } = useDAppBridge(endpoint, navigation);
    // ton-x
    const injectionEngine = useInjectEngine(domain, title ?? '', isTestnet, endpoint);

    const webViewProps: DAppWebviewProps = useMemo(() => {
        if (engine === 'ton-connect') {
            return {
                ...tonConnectWebViewProps,
                useStatusBar,
                useMainButton,
                useToaster,
                useQueryAPI,
                onShouldStartLoadWithRequest: loadWithRequest,
            };
        }

        if (engine === 'ton-x') {
            const injectionSource = injectSourceFromDomain(domain, isTestnet, safeArea);

            return {
                injectionEngine,
                injectedJavaScriptBeforeContentLoaded: injectionSource,
                useStatusBar,
                useMainButton,
                useToaster,
                useQueryAPI,
                onShouldStartLoadWithRequest: loadWithRequest,
            }
        }

        return {
            useStatusBar,
            useMainButton,
            useToaster,
            useQueryAPI,
            onShouldStartLoadWithRequest: loadWithRequest
        };
    }, [
        engine,
        tonConnectWebViewProps,
        domain,
        isTestnet,
        safeArea,
        webViewRef,
        injectionEngine,
        useStatusBar, useMainButton, useQueryAPI, useToaster,
        loadWithRequest,
        hasDomainKey
    ]);

    if (engine === 'ton-x' && !hasDomainKey) {
        navigation.navigate('Install', { url: endpoint, title: title ?? '', image: null, callback: setHasDomainKey });
        return (
            <View style={{ flexGrow: 1 }}>
                <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
                {!!header && (
                    <ScreenHeader
                        style={{ paddingTop: 32, paddingHorizontal: 16 }}
                        onBackPressed={header.onBack}
                        onClosePressed={headerOnClose}
                        title={header.title}
                    />
                )}
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </View>
        );
    }

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            {!!header && (
                <ScreenHeader
                    style={{ paddingTop: 32, paddingHorizontal: 16 }}
                    onBackPressed={header.onBack}
                    onClosePressed={headerOnClose}
                    title={header.title}
                />
            )}
            <DAppWebview
                ref={webViewRef}
                source={{ uri: endpoint }}
                {...webViewProps}
                webviewDebuggingEnabled={isTestnet}
                refId={refId}
            />
        </View>
    );
});