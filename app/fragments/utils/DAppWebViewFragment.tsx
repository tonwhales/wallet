import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, View, Platform, Share, Pressable, BackHandler, Text } from "react-native";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import { useDAppBridge, useNetwork, usePrice, useTheme } from "../../engine/hooks";
import { extractDomain } from "../../engine/utils/extractDomain";
import { ShouldStartLoadRequest, WebViewNavigation } from "react-native-webview/lib/WebViewTypes";
import { useLinkNavigator } from "../../utils/link-navigator/useLinkNavigator";
import { resolveUrl } from "../../utils/url/resolveUrl";
import { protectNavigation } from "../apps/components/protect/protectNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { DAppWebView, DAppWebViewProps } from "../../components/webview/DAppWebView";
import { getCurrentAddress } from "../../storage/appState";
import { usePermissions } from "expo-notifications";
import i18n from 'i18next';
import { useInjectEngine } from "../apps/components/inject/useInjectEngine";
import { injectSourceFromDomain } from "../../engine/utils/injectSourceFromDomain";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getDomainKey } from "../../engine/state/domainKeys";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { QueryParamsState } from "../../components/webview/utils/extractWebViewQueryAPIParams";
import { Ionicons } from '@expo/vector-icons';
import { CloseButton } from "../../components/navigation/CloseButton";
import { ActionSheetOptions, useActionSheet } from "@expo/react-native-action-sheet";
import { t } from "../../i18n/t";
import { ThemeType } from "../../engine/state/theme";
import { Typography } from "../../components/styles";

type DAppEngine = 'ton-x' | 'ton-connect';

type TitleParams = { domain: string, title?: string | null }

function DAppWebViewTitle(params: TitleParams, theme: ThemeType) {
    const { domain, title } = params;
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ marginRight: 8 }}>
                <View style={{
                    width: 24, height: 24,
                    borderRadius: 12,
                    backgroundColor: theme.accent,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold15_20]}>
                        {domain.charAt(0).toUpperCase()}
                    </Text>
                </View>
            </View>
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                {title && (
                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold15_20]}>
                        {title}
                    </Text>
                )}
                <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                    {domain}
                </Text>
            </View>
        </View>
    );
}

export type DAppWebViewFragmentParams = {
    url: string;
    title?: string;
    header?: {
        onBack?: () => void;
        onClose?: () => void;
        title?: { type: 'component', component: React.ReactNode } | { type: 'params', params: TitleParams };
    };
    useMainButton?: boolean;
    useStatusBar?: boolean;
    useQueryAPI?: boolean;
    useToaster?: boolean;
    refId?: string;
    engine?: DAppEngine;
    defaultQueryParamsState?: QueryParamsState;
    controlls?: {
        back?: boolean;
        forward?: boolean;
        refresh?: boolean;
        share?: boolean;
    };
    safeMode?: boolean;
    lockNativeBack?: boolean;
    fullScreen?: boolean;
    webViewProps?: DAppWebViewProps;
}

export const DAppWebViewFragment = fragment(() => {
    const { url, title, useMainButton, useStatusBar, useQueryAPI, useToaster, header, refId, engine, defaultQueryParamsState, controlls, safeMode, lockNativeBack, webViewProps: viewProps } = useParams<DAppWebViewFragmentParams>();
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const isTestnet = useNetwork().isTestnet;
    const navigation = useTypedNavigation();
    const [pushPemissions] = usePermissions();
    const [, currency] = usePrice();
    const routeName = useRoute().name;
    const isModal = routeName === 'DAppWebViewModal';
    const { showActionSheetWithOptions } = useActionSheet();

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

    const [currentUrl, setCurrentUrl] = useState(endpoint);

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

        let isTg = false;

        try {
            isTg = new URL(event.url).protocol === 'tg:';
        } catch {
            // ignore
        }

        if (prt || (safeMode && !isTg)) {
            return true;
        }

        // Resolve linking
        Linking.openURL(event.url);
        return false;
    }, [safeMode]);

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
    const { ref: webViewRef, isConnected, disconnect, ...tonConnectWebViewProps } = useDAppBridge(currentUrl, navigation);
    // ton-x
    const injectionEngine = useInjectEngine(domain, title ?? '', isTestnet, endpoint);

    const webViewProps: DAppWebViewProps = useMemo(() => {
        if (engine === 'ton-connect') {
            return {
                ...viewProps,
                ...tonConnectWebViewProps,
                useStatusBar,
                useMainButton,
                useToaster,
                useQueryAPI,
                onShouldStartLoadWithRequest: loadWithRequest,
            };
        }

        if (engine === 'ton-x') {
            let injectionSource = injectSourceFromDomain(domain, isTestnet, safeArea);

            if (viewProps?.injectedJavaScriptBeforeContentLoaded) {
                injectionSource = `${injectionSource};${viewProps.injectedJavaScriptBeforeContentLoaded}`;
            }

            return {
                ...viewProps,
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
            ...viewProps,
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
        hasDomainKey,
        viewProps
    ]);

    // to account for wierd statusbar bug with navigating withing the bottom bar stack
    useFocusEffect(() => setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark'));

    const onShare = useCallback(() => {
        if (Platform.OS === 'ios') {
            Share.share({ url: currentUrl });
        } else {
            Share.share({ message: currentUrl });
        }
    }, [currentUrl]);

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
                    />
                )}
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </View>
        );
    }

    const controllsComponent = useMemo(() => {
        if (!controlls || (!controlls.back && !controlls.forward && !controlls.refresh && !controlls.share)) {
            return undefined;
        }

        const { back, forward, refresh, share } = controlls;

        const options: string[] = [];
        const icons: React.ReactNode[] = [];
        const actions: (() => void)[] = [];
        if (back) {
            options.push(t('browser.back'));
            icons.push(<Ionicons
                name={'arrow-back'}
                size={24}
                color={theme.iconNav}
            />);
            actions.push(() => webViewRef.current?.goBack());
        }
        if (forward) {
            options.push(t('browser.forward'));
            icons.push(<Ionicons
                name={'arrow-forward'}
                size={24}
                color={theme.iconNav}
            />);
            actions.push(() => webViewRef.current?.goForward());
        }
        if (refresh) {
            options.push(t('browser.refresh'));
            icons.push(<Ionicons
                name={'refresh'}
                size={24}
                color={theme.iconNav}
            />);
            actions.push(() => webViewRef.current?.reload());
        }
        if (share) {
            options.push(t('browser.share'));
            icons.push(<Ionicons
                name={'share'}
                size={24}
                color={theme.iconNav}
            />);
            actions.push(onShare);
        }
        options.push(t('common.cancel'));


        const handleAction = (eN?: number) => {
            if (eN === undefined || eN === options.length - 1) {
                return;
            }

            actions[eN]();
        }

        const actionSheetOptions: ActionSheetOptions = {
            options,
            userInterfaceStyle: theme.style,
            cancelButtonIndex: options.length - 1,
            icons
        }

        return (
            <View style={{
                flexDirection: 'row',
                gap: 4, backgroundColor: theme.surfaceOnElevation,
                marginRight: 16, borderRadius: 32,
                paddingHorizontal: 8
            }}>
                <Pressable
                    style={({ pressed }) => [
                        {
                            opacity: pressed ? 0.5 : 1,
                            backgroundColor: theme.surfaceOnElevation,
                            borderRadius: 32,
                            height: 32, width: 32,
                            justifyContent: 'center', alignItems: 'center',
                        },
                    ]}
                    onPress={() => showActionSheetWithOptions(actionSheetOptions, handleAction)}
                >
                    <Ionicons
                        name={'ellipsis-horizontal'}
                        size={24}
                        color={theme.iconNav}
                    />
                </Pressable>
                <CloseButton
                    onPress={headerOnClose}
                />
            </View>
        );

    }, [controlls, headerOnClose, onShare]);

    const onAndroidBackPressed = useCallback(() => {
        if (webViewRef.current) {
            webViewRef.current.goBack();
            return true;
        }

        return false;
    }, []);

    useEffect(() => {
        if (Platform.OS === 'android' && lockNativeBack) {
            BackHandler.addEventListener('hardwareBackPress', onAndroidBackPressed);
        }
        return () => BackHandler.removeEventListener('hardwareBackPress', onAndroidBackPressed);
    }, [onAndroidBackPressed, lockNativeBack]);

    const onNavigationStateChange = useCallback((event: WebViewNavigation) => {
        webViewProps?.onNavigationStateChange?.(event);
        setCurrentUrl(event.url);

    }, [webViewProps.onNavigationStateChange]);

    const titleComponent: React.ReactNode = useMemo(() => {
        if (!header?.title) {
            return undefined;
        }

        if (header.title.type === 'component') {
            return header.title.component;
        }

        return DAppWebViewTitle(header.title.params, theme);
    }, [theme, header]);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            {!!header && (
                <ScreenHeader
                    style={Platform.select({ android: { paddingTop: 32 }, ios: { paddingTop: isModal ? 0 : 32 } })}
                    onBackPressed={header.onBack}
                    onClosePressed={!!controllsComponent ? undefined : headerOnClose}
                    rightButton={controllsComponent}
                    titleComponent={titleComponent}
                />
            )}
            <DAppWebView
                ref={webViewRef}
                source={{ uri: endpoint }}
                {...webViewProps}
                onNavigationStateChange={onNavigationStateChange}
                webviewDebuggingEnabled={isTestnet}
                allowsBackForwardNavigationGestures={lockNativeBack}
                refId={refId}
                defaultNavigationOptions={{
                    backPolicy: 'back',
                    showKAV: false,
                    lockScroll: false,
                    ...defaultQueryParamsState
                }}
                originWhitelist={['http:\/\/*', 'https:\/\/*', 'tg:*', 'blob:*']}
            />
        </View>
    );
});