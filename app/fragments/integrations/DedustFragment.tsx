import { StatusBar } from "expo-status-bar";
import { fragment } from "../../fragment";
import { Linking, Platform, View } from "react-native";
import { useBounceableWalletFormat, useNetwork, usePrice, useTheme } from "../../engine/hooks";
import { useCallback, useMemo, useRef, useState } from "react";
import { getPlatform } from "../../engine/tonconnect/config";
import { tonhubBridgeSource } from "../apps/components/inject/createInjectSource";
import { getCurrentAddress } from "../../storage/appState";
import { useTonhubBridgeEngine } from "../apps/components/inject/useInjectEngine";
import { usePermissions } from "../../utils/expo/usePermissions";
import i18n from 'i18next';
import { extractDomain } from "../../engine/utils/extractDomain";
import { useLinkNavigator } from "../../utils/link-navigator/useLinkNavigator";
import { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { resolveUrl } from "../../utils/url/resolveUrl";
import { protectNavigation } from "../apps/components/protect/protectNavigation";
import { DAppWebView } from "../../components/webview/DAppWebView";
import WebView from "react-native-webview";
import { SwapSkeleton } from "../../components/skeletons/SwapSkeleton";
import { useTrackScreen } from "../../analytics/mixpanel";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sharedStoragePersistence } from "../../storage/storage";
import { t } from "../../i18n/t";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ConfirmLegal } from "../../components/ConfirmLegal";

const skipLegalDeDust = 'skipLegalDeDust';
const logo = require('@assets/known/ic-dedust.png');

export const DedustFragment = fragment(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { isTestnet } = useNetwork();
    const [bounceableFormat,] = useBounceableWalletFormat();
    const pushPemissionsGranted = usePermissions();
    const [, currency] = usePrice();
    const [accepted, setAccepted] = useState(sharedStoragePersistence.getBoolean(skipLegalDeDust));

    const webViewRef = useRef<WebView>(null);
    const deDustUrl = 'https://tonhub.dedust.io/';
    const domain = extractDomain(deDustUrl);
    const endpoint = useMemo(() => {
        try {
            const selected = getCurrentAddress();

            const source = new URL(deDustUrl);

            source.searchParams.set('address', encodeURIComponent(selected.addressString));
            source.searchParams.set('utm_source', 'tonhub');
            source.searchParams.set('utm_content', 'extension');
            source.searchParams.set('ref', 'tonhub');
            source.searchParams.set('lang', i18n.language);
            source.searchParams.set('currency', currency);
            source.searchParams.set('themeStyle', theme.style === 'dark' ? 'dark' : 'light');
            source.searchParams.set('pushNotifications', pushPemissionsGranted ? 'true' : 'false');

            return source.toString();
        } catch {
            return deDustUrl;
        }
    }, [pushPemissionsGranted, currency, theme.style]);

    const bridgeEngine = useTonhubBridgeEngine(domain, 'DeDust.io', isTestnet, endpoint);
    const linkNavigator = useLinkNavigator(isTestnet);
    const loadWithRequest = useCallback((event: ShouldStartLoadRequest): boolean => {
        try {
            new URL(event.url);
            new URL(endpoint);
        } catch (error) {
            return false;
        }
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

    const webViewProps = useMemo(() => {
        const devicePlatform = getPlatform();

        let platform = 'other';
        if (devicePlatform === 'android') {
            platform = 'android';
        } else if (devicePlatform === 'iphone') {
            platform = 'ios';
        }

        const injectionSource = tonhubBridgeSource({
            platform,
            wallet: {
                address: getCurrentAddress().address.toString({ testOnly: isTestnet, bounceable: bounceableFormat }),
                publicKey: getCurrentAddress().publicKey.toString('base64'),
            },
            version: 1,
            network: isTestnet ? 'testnet' : 'mainnet',
            theme: theme.style === 'dark' ? 'dark' : 'light'
        });

        return {
            injectedJavaScriptBeforeContentLoaded: injectionSource,
            injectionEngine: bridgeEngine,
            useStatusBar: true,
            // useMainButton,
            useToaster: true,
            useQueryAPI: true,
            onShouldStartLoadWithRequest: loadWithRequest
        }
    }, [theme, isTestnet, bridgeEngine, loadWithRequest, bounceableFormat]);

    useTrackScreen('Swap', isTestnet);

    return (
        <View style={{
            flexGrow: 1,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            overflow: 'hidden',
        }}>
            <StatusBar
                style={Platform.select({
                    android: theme.style === 'dark' ? 'light' : 'dark',
                    ios: 'light'
                })}
            />
            {!accepted ? (
                <>
                    <ScreenHeader onClosePressed={navigation.goBack} title={t('wallet.actions.swap')} />
                    <ConfirmLegal
                        onConfirmed={() => setAccepted(true)}
                        skipKey={skipLegalDeDust}
                        title={t('swap.title')}
                        description={t('swap.description')}
                        termsAndPrivacy={t('swap.termsAndPrivacy')}
                        dontShowTitle={t('swap.dontShowTitle')}
                        privacyUrl={'https://tonhub.dedust.io/docs/privacy.pdf'}
                        termsUrl={'https://tonhub.dedust.io/docs/term-of-use.pdf'}
                        icon={logo}
                    />
                </>
            ) : (
                <DAppWebView
                    ref={webViewRef}
                    source={{ uri: endpoint }}
                    {...webViewProps}
                    webviewDebuggingEnabled={isTestnet}
                    onContentProcessDidTerminate={webViewRef.current?.reload}
                    loader={(l) => <SwapSkeleton loaded={l.loaded} theme={theme} />}
                    defaultSafeArea={Platform.OS === 'ios' ? { bottom: safeArea.bottom - 8 } : { top: 16, bottom: 0 }}
                />
            )}
        </View>
    );
});