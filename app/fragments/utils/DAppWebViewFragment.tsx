import { Linking, Platform, View } from "react-native";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { StatusBar } from "expo-status-bar";
import { useDAppBridge, useNetwork, useThemeStyle } from "../../engine/hooks";
import { extractDomain } from "../../engine/utils/extractDomain";
import React, { useCallback, useMemo } from "react";
import { ShouldStartLoadRequest, WebViewMessageEvent } from "react-native-webview/lib/WebViewTypes";
import { useLinkNavigator } from "../../useLinkNavigator";
import { resolveUrl } from "../../utils/resolveUrl";
import { protectNavigation } from "../apps/components/protect/protectNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { getDomainKey } from "../../engine/state/domainKeys";
import { DAppWebview, DAppWebviewProps } from "../../components/webview/DappWebview";
import { useInjectEngine } from "../apps/components/inject/useInjectEngine";
import { warn } from "../../utils/log";
import { createInjectSource, dispatchResponse } from "../apps/components/inject/createInjectSource";
import { getCurrentAddress } from "../../storage/appState";
import { contractFromPublicKey, walletConfigFromContract } from "../../engine/contractFromPublicKey";
import { createDomainSignature } from "../../engine/utils/createDomainSignature";
import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";

function injectSourceFromDomain(domain: string, isTestnet: boolean, safeArea: EdgeInsets) {
    const currentAccount = getCurrentAddress();
    const contract = contractFromPublicKey(currentAccount.publicKey);
    const config = walletConfigFromContract(contract);

    const walletConfig = config.walletConfig;
    const walletType = config.type;

    const domainKey = getDomainKey(domain);

    if (!domainKey) {
        return '';
    }

    const domainSign = createDomainSignature(domain, domainKey);
    return createInjectSource({
        config: {
            version: 1,
            platform: Platform.OS,
            platformVersion: Platform.Version,
            network: isTestnet ? 'testnet' : 'mainnet',
            address: currentAccount.address.toString({ testOnly: isTestnet }),
            publicKey: currentAccount.publicKey.toString('base64'),
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
        },
        safeArea: safeArea
    });
}

export type DAppWebViewFragmentParams = {
    url: string;
    header?: {
        title: string;
        onBack?: () => void;
        onClose?: () => void;
    };
    useMainButton?: boolean;
    useStatusBar?: boolean;
    engine?: 'ton-x' | 'ton-connect'
}

export const DAppWebViewFragment = fragment(() => {
    const { url, useMainButton, useStatusBar, engine, header } = useParams<DAppWebViewFragmentParams>();
    const [themeStyle,] = useThemeStyle();
    const isTestnet = useNetwork().isTestnet;
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();

    const domain = useMemo(() => {
        try {
            return extractDomain(url);
        } catch {
            return '';
        }
    }, [url]);
    const endpoint = useMemo(() => {
        try {
            const source = new URL(url);
            source.searchParams.set('utm_source', 'tonhub');
            source.searchParams.set('utm_content', 'extension');
            return source.toString();
        } catch {
            return url;
        }
    }, [url]);

    // Injection
    const { ref: webViewRef, isConnected, disconnect, ...tonConnectProps } = useDAppBridge(url, navigation);
    const injectionEngine = useInjectEngine(domain, header?.title ?? '', isTestnet, url);

    const webViewProps: DAppWebviewProps = useMemo(() => {
        if (!engine) {
            // reusing ref from DAppBridge
            return { ref: webViewRef, useStatusBar, useMainButton }
        }

        if (engine === 'ton-connect') {
            return {
                useStatusBar,
                useMainButton,
                ref: webViewRef,
                ...tonConnectProps
            };
        }

        const injectSource = injectSourceFromDomain(domain, isTestnet, safeArea);

        return {
            ref: webViewRef,
            useStatusBar,
            useMainButton,
            injectionEngine,
            injectedJavaScriptBeforeContentLoaded: injectSource,
        }
    }, [engine, isTestnet, injectionEngine, useMainButton, useStatusBar, webViewRef, domain, safeArea]);

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
                source={{ uri: endpoint }}
                onShouldStartLoadWithRequest={loadWithRequest}
                {...webViewProps}
            />
        </View>
    );
});