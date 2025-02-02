import * as React from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { extractDomain } from '../../../engine/utils/extractDomain';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import { MixpanelEvent, trackEvent, useTrackEvent } from '../../../analytics/mixpanel';
import { resolveUrl } from '../../../utils/resolveUrl';
import { protectNavigation } from '../../apps/components/protect/protectNavigation';
import { useLinkNavigator } from '../../../useLinkNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HoldersAppParams, HoldersAppParamsType } from '../HoldersAppFragment';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useDAppBridge, useLanguage, usePrimaryCurrency } from '../../../engine/hooks';
import { useTheme } from '../../../engine/hooks';
import { useNetwork } from '../../../engine/hooks';
import { useSelectedAccount } from '../../../engine/hooks';
import { getCurrentAddress } from '../../../storage/appState';
import { HoldersUserState, holdersUrl } from '../../../engine/api/holders/fetchUserState';
import { HoldersAccountStatus, getHoldersToken } from '../../../engine/hooks/holders/useHoldersAccountStatus';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { onHoldersInvalidate } from '../../../engine/effects/onHoldersInvalidate';
import { DAppWebView, DAppWebViewProps } from '../../../components/webview/DAppWebView';
import { HoldersAccounts } from '../../../engine/hooks/holders/useHoldersAccounts';
import { openWithInApp } from '../../../utils/openWithInApp';
import { t } from '../../../i18n/t';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { AccountPlaceholder } from './AccountPlaceholder';
import { Image } from "expo-image";
import { CardPlaceholder } from './CardPlaceholder';
import { AnimatedCards } from './AnimatedCards';

export const holdersSupportUrl = 'https://t.me/Welcome_holders';
export const supportFormUrl = 'https://airtable.com/appWErwfR8x0o7vmz/shr81d2H644BNUtPN';
export const holdersSupportWebUrl = 'https://help.holders.io/en';

export function normalizePath(path: string) {
    return path.replaceAll('.', '_');
}

export const HoldersLoader = memo(({
    loaded,
    type,
    onReload,
    onSupport
}: {
    loaded: boolean,
    type: HoldersAppParamsType,
    onReload?: () => void,
    onSupport?: () => void
}) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const [showClose, setShowClose] = useState(false);

    const opacity = useSharedValue(1);
    const animatedStyles = useAnimatedStyle(() => {
        return { opacity: opacity.value };
    });

    const longLoadingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const start = useMemo(() => Date.now(), []);
    const trackLoadingTime = useCallback(() => {
        trackEvent(MixpanelEvent.HoldersLoadingTime, { type, duration: Date.now() - start });
    }, []);

    useEffect(() => {
        if (loaded) {
            longLoadingTimerRef.current && clearTimeout(longLoadingTimerRef.current);
            opacity.value = withTiming(0, { duration: 350, easing: Easing.inOut(Easing.ease) });
            trackLoadingTime();
        } else {
            setShowClose(false);
            opacity.value = 1;
        };
    }, [loaded]);

    useEffect(() => {
        const showCloseTimer = setTimeout(() => {
            setShowClose(true);
        }, 5000);

        if (longLoadingTimerRef.current) {
            clearTimeout(longLoadingTimerRef.current);
        }

        longLoadingTimerRef.current = setTimeout(() => {
            trackEvent(MixpanelEvent.holdersLongLoadingTime, { type, duration: 12000 });
        }, 10000);

        return () => {
            longLoadingTimerRef.current && clearTimeout(longLoadingTimerRef.current);
            clearTimeout(showCloseTimer);
        }
    }, []);

    const placeholder = useMemo(() => {
        if (type === HoldersAppParamsType.Account) {
            return (
                <AccountPlaceholder
                    theme={theme}
                    showClose={showClose}
                    onReload={onReload}
                    onSupport={onSupport}
                />
            );
        }

        if (type === HoldersAppParamsType.Prepaid) {
            return (
                <CardPlaceholder
                    theme={theme}
                    showClose={showClose}
                    onReload={onReload}
                    onSupport={onSupport}
                />
            );
        }

        return <AnimatedCards />;
    }, [type, theme, showClose, onReload, onSupport]);

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: theme.backgroundPrimary,
                    alignItems: 'center'
                },
                animatedStyles,
                Platform.select({
                    ios: { paddingTop: (type === HoldersAppParamsType.Account || type === HoldersAppParamsType.Prepaid) ? 0 : safeArea.top },
                    android: { paddingTop: 0 }
                }),
            ]}
            pointerEvents={loaded ? 'none' : 'auto'}
        >
            {placeholder}
            {!loaded && (
                <ScreenHeader
                    onBackPressed={undefined}
                    leftButton={showClose ? <Pressable
                        style={({ pressed }) => [
                            {
                                opacity: pressed ? 0.5 : 1,
                                backgroundColor: type === HoldersAppParamsType.Account ? '#1c1c1e' : theme.surfaceOnBg,
                                borderRadius: 32,
                                height: 32, width: 32,
                                justifyContent: 'center', alignItems: 'center',
                            },
                        ]}
                        onPress={navigation.goBack}
                    >
                        <Image
                            style={{
                                tintColor: theme.iconNav,
                                height: 10, width: 6,
                                justifyContent: 'center', alignItems: 'center',
                                left: -1
                            }}
                            source={require('@assets/ic-nav-back.png')}
                        />
                    </Pressable> : undefined}
                    style={[
                        { position: 'absolute', top: 32, left: 16, right: 0 },
                        Platform.select({
                            ios: { top: safeArea.top - 16 },
                            android: { top: safeArea.top - 6 }
                        })
                    ]}
                />
            )}
        </Animated.View>
    );
});

export const HoldersAppComponent = memo((
    props: {
        variant: HoldersAppParams,
        title: string,
        endpoint: string,
        status?: HoldersAccountStatus,
        accounts?: HoldersAccounts,
    }
) => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const domain = useMemo(() => extractDomain(props.endpoint), []);
    const [lang] = useLanguage();
    const acc = useMemo(() => getCurrentAddress(), []);
    const status = props.status;
    const accountsStatus = props.accounts;
    const [currency] = usePrimaryCurrency();
    const selectedAccount = useSelectedAccount();
    const url = holdersUrl(isTestnet);
    const { showActionSheetWithOptions } = useActionSheet();

    const source = useMemo(() => {
        const queryParams = new URLSearchParams({
            lang: lang,
            currency: currency,
            theme: 'holders',
            'theme-style': theme.style === 'dark' ? 'dark' : 'light',
        });

        let route = '';
        switch (props.variant.type) {
            case HoldersAppParamsType.Invite:
                route = '/';
                break;
            case HoldersAppParamsType.Create:
                route = '/create';
                break;
            case HoldersAppParamsType.Account:
                route = `/account/${props.variant.id}`;
                break;
            case HoldersAppParamsType.Prepaid:
                route = `/card-prepaid/${props.variant.id}`;
                break;
            case HoldersAppParamsType.Transactions:
                route = `/transactions`;
                for (const [key, value] of Object.entries(props.variant.query)) {
                    if (!!value) {
                        queryParams.append(key, value);
                    }
                }
                break;
            case HoldersAppParamsType.Path:
                // check if path is has a leading slash
                if (props.variant.path.startsWith('/')) {
                    route = props.variant.path;
                } else {
                    route = `/${props.variant.path}`;
                }

                for (const [key, value] of Object.entries(props.variant.query)) {
                    if (!!value) {
                        queryParams.append(key, value);
                    }
                }
                break;
            case HoldersAppParamsType.Topup:
                route = `/account/${props.variant.id}/deposit`;
                break;
            case HoldersAppParamsType.Accounts:
                route = '/accounts';
                break;
        }

        const uri = `${props.endpoint}${route}`;
        const url = new URL(uri);
        for (const [key, value] of queryParams.entries()) {
            url.searchParams.append(key, value);
        }

        const urlString = url.toString();
        let initialRoute = urlString.split(props.endpoint)[1];

        queryParams.append('initial-route', route);

        return { url: urlString, initialRoute, queryParams: queryParams.toString() };
    }, [props, lang, currency, status, theme]);

    // 
    // Track events
    // 
    const start = useMemo(() => {
        return Date.now();
    }, []);
    useTrackEvent(MixpanelEvent.Holders, { url: props.variant.type }, isTestnet);

    //
    // Navigation
    //
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

        if (event.url === 'about:blank') {
            return false;
        }

        // Resolve linking
        Linking.openURL(event.url);
        return false;
    }, []);

    //
    // Injection
    //
    const { ref: webViewRef, isConnected, disconnect, ...tonConnectWebViewProps } = useDAppBridge(url, navigation);

    const injectSource = useMemo(() => {
        if (!selectedAccount) {
            throw new Error('No account selected');
        }

        // TODO: add accounts state
        const initialState = {
            ...status
                ? {
                    user: {
                        status: {
                            state: status.state,
                            kycStatus: status.state === 'need-kyc' ? status.kycStatus : null,
                            suspended: (status as { suspended: boolean | undefined }).suspended === true,
                        },
                        token: status.state === HoldersUserState.Ok ? status.token : getHoldersToken(acc.address.toString({ testOnly: isTestnet })),
                    }
                }
                : {},
            ...accountsStatus?.type === 'private' ? { accountsList: accountsStatus.accounts, prepaidCards: accountsStatus.prepaidCards } : {},
        };

        return `
        ${tonConnectWebViewProps.injectedJavaScriptBeforeContentLoaded || ''}
        (() => {
            window.initialState = ${JSON.stringify(initialState)};
        })();
        `
    }, [status, accountsStatus, tonConnectWebViewProps]);

    const onClose = useCallback(() => {
        onHoldersInvalidate(acc.addressString, isTestnet);
        trackEvent(MixpanelEvent.HoldersClose, { type: props.variant.type, duration: Date.now() - start }, isTestnet);
    }, []);

    const onContentProcessDidTerminate = useCallback(() => {
        webViewRef.current?.reload();
        // TODO: add offline support check when offline will be ready
        // In case of blank WebView without offline
        // if (!stableOfflineV || Platform.OS === 'android') {
        //     webRef.current?.reload();
        //     return;
        // }
        // In case of iOS blank WebView with offline app
        // Re-render OfflineWebView to preserve folderPath navigation & inject last offlineRoute as initialRoute
        // if (Platform.OS === 'ios') {
        //     setOfflineRender(offlineRender + 1);
        // }
        // }, [offlineRender, stableOfflineV]);
    }, []);

    const webViewProps: DAppWebViewProps = useMemo(() => {
        return {
            ...tonConnectWebViewProps,
            injectedJavaScriptBeforeContentLoaded: injectSource,

            useStatusBar: true,
            useMainButton: true,
            useToaster: true,
            useQueryAPI: true,
            useEmitter: true,
            useAuthApi: true,
            useWalletAPI: true,

            onShouldStartLoadWithRequest: loadWithRequest,
            onContentProcessDidTerminate,
            onClose,
        }
    }, [
        domain,
        isTestnet,
        tonConnectWebViewProps,
        loadWithRequest,
        onContentProcessDidTerminate,
        onClose,
        injectSource
    ]);

    const [renderKey, setRenderKey] = useState(0);

    const onReaload = useCallback(() => {
        trackEvent(MixpanelEvent.HoldersReload, { route: source.url }, isTestnet);
        setRenderKey(renderKey + 1);
    }, [renderKey, isTestnet]);

    const onSupport = useCallback(() => {
        const tonhubOptions = [
            t('common.cancel'),
            t('settings.support.telegram'),
            t('settings.support.form'),
            t('settings.support.holders')
        ];
        const cancelButtonIndex = 0;

        const tonhubSupportSheet = () => {
            showActionSheetWithOptions({
                options: tonhubOptions,
                title: t('settings.support.title'),
                cancelButtonIndex,
            }, (selectedIndex?: number) => {
                switch (selectedIndex) {
                    case 1:
                        openWithInApp(holdersSupportUrl);
                        break;
                    case 2:
                        openWithInApp(supportFormUrl);
                        break;
                    case 3:
                        openWithInApp(holdersSupportWebUrl);
                        break;
                    default:
                        break;
                }
            });
        }

        tonhubSupportSheet();
    }, []);

    return (
        <View
            key={`content-${renderKey}`}
            style={{ backgroundColor: theme.backgroundPrimary, flex: 1 }}
        >
            <DAppWebView
                ref={webViewRef}
                source={{ uri: source.url }}
                {...webViewProps}
                defaultQueryParamsState={{
                    backPolicy: 'back',
                    showKeyboardAccessoryView: false,
                    lockScroll: true
                }}
                webviewDebuggingEnabled={isTestnet}
                loader={(p) => (
                    <HoldersLoader
                        type={
                            props.variant.type === HoldersAppParamsType.Transactions || props.variant.type === HoldersAppParamsType.Path
                                ? HoldersAppParamsType.Account
                                : props.variant.type
                        }
                        {...p}
                        onReload={onReaload}
                        onSupport={onSupport}
                    />
                )}
            />
        </View>
    );
});