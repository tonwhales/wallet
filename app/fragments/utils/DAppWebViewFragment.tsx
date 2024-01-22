import React, { useCallback, useMemo, useRef } from "react";
import { Linking, Platform, View } from "react-native";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { StatusBar } from "expo-status-bar";
import { useNetwork, usePrice, useThemeStyle } from "../../engine/hooks";
import { extractDomain } from "../../engine/utils/extractDomain";
import { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { useLinkNavigator } from "../../useLinkNavigator";
import { resolveUrl } from "../../utils/resolveUrl";
import { protectNavigation } from "../apps/components/protect/protectNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { DAppWebview } from "../../components/webview/DAppWebview";
import { getCurrentAddress } from "../../storage/appState";
import { usePermissions } from "expo-notifications";
import i18n from 'i18next';
import WebView from "react-native-webview";

export type DAppWebViewFragmentParams = {
    url: string;
    header?: {
        title: string;
        onBack?: () => void;
        onClose?: () => void;
    };
    useMainButton?: boolean;
    useStatusBar?: boolean;
    refId?: string;
}

export const DAppWebViewFragment = fragment(() => {
    const { url, useMainButton, useStatusBar, header, refId } = useParams<DAppWebViewFragmentParams>();
    const [themeStyle,] = useThemeStyle();
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
            source.searchParams.set('themeStyle', themeStyle === 'dark' ? 'dark' : 'light');
            source.searchParams.set('pushNotifications', pushNotifications ? 'true' : 'false');

            if (refId) {
                source.searchParams.set('refId', encodeURIComponent(refId));
            }

            return source.toString();
        } catch {
            return url;
        }
    }, [url, pushPemissions, currency]);

    const webViewRef = useRef<WebView>(null);

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
    }, [header]);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({
                ios: 'light',
                android: themeStyle === 'dark' ? 'light' : 'dark',
            })} />
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
                useStatusBar={useStatusBar}
                useMainButton={useMainButton}
                onShouldStartLoadWithRequest={loadWithRequest}
            />
        </View>
    );
});