import * as React from 'react';
import { Linking, Platform, View } from 'react-native';
import WebView from 'react-native-webview';
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { extractDomain } from '../../../engine/utils/extractDomain';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import { MixpanelEvent, trackEvent, useTrackEvent } from '../../../analytics/mixpanel';
import { resolveUrl } from '../../../utils/resolveUrl';
import { protectNavigation } from '../../apps/components/protect/protectNavigation';
import { walletConfigFromContract, contractFromPublicKey } from '../../../engine/contractFromPublicKey';
import { createInjectSource } from '../../apps/components/inject/createInjectSource';
import { useInjectEngine } from '../../apps/components/inject/useInjectEngine';
import { getLocales } from 'react-native-localize';
import { useLinkNavigator } from '../../../useLinkNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HoldersAppParams } from '../HoldersAppFragment';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { usePrimaryCurrency } from '../../../engine/hooks';
import { useTheme } from '../../../engine/hooks';
import { useNetwork } from '../../../engine/hooks';
import { useSelectedAccount } from '../../../engine/hooks';
import { getCurrentAddress } from '../../../storage/appState';
import { useHoldersAccountStatus } from '../../../engine/hooks';
import { HoldersAccountState } from '../../../engine/api/holders/fetchAccountState';
import { useHoldersAccounts } from '../../../engine/hooks';
import { createDomainSignature } from '../../../engine/utils/createDomainSignature';
import { getHoldersToken } from '../../../engine/hooks/holders/useHoldersAccountStatus';
import { getDomainKey } from '../../../engine/state/domainKeys';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { onHoldersInvalidate } from '../../../engine/effects/onHoldersInvalidate';
import { DAppWebView, DAppWebViewProps } from '../../../components/webview/DAppWebView';
import { ThemeType } from '../../../engine/state/theme';

export function normalizePath(path: string) {
    return path.replaceAll('.', '_');
}

import IcHolders from '../../../../assets/ic_holders.svg';

function PulsingCardPlaceholder(theme: ThemeType) {
    const safeArea = useSafeAreaInsets();
    const animation = useSharedValue(0);

    useEffect(() => {
        animation.value =
            withRepeat(
                withTiming(1, {
                    duration: 450,
                    easing: Easing.bezier(0.42, 0, 1, 1)
                }),
                -1,
                true,
            );
    }, []);

    const animatedStyles = useAnimatedStyle(() => {
        const scale = interpolate(
            animation.value,
            [0, 1],
            [1, 1.03],
            Extrapolation.CLAMP,
        )
        return {
            transform: [{ scale: scale }],
        };
    }, []);

    return (
        <Animated.View style={[
            { flexGrow: 1, width: '100%' },
            {
                opacity: interpolate(
                    animation.value,
                    [0, 1],
                    [1, 0.75],
                    Extrapolation.CLAMP
                )
            }
        ]}>
            <View
                style={{
                    backgroundColor: theme.backgroundUnchangeable,
                    height: 324,
                    position: 'absolute',
                    top: -30 - 36 - safeArea.top,
                    left: -4,
                    right: -4,
                    borderRadius: 20,
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    borderBottomLeftRadius: 28,
                    borderBottomRightRadius: 28,
                }}
            />
            <Animated.View style={[
                {
                    height: 44,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 22,
                    marginTop: -12
                },
                animatedStyles
            ]}>
                <View style={{
                    width: 32, height: 32,
                    backgroundColor: theme.textSecondary,
                    borderRadius: 16
                }} />
                <View style={{ height: 36, flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: theme.textSecondary, height: 28, width: 132, borderRadius: 20 }} />
                </View>
                <View style={{ width: 32, height: 32, }} />
            </Animated.View>
            <Animated.View
                style={[
                    {
                        backgroundColor: theme.textSecondary,
                        height: 38,
                        width: 142,
                        borderRadius: 8,
                        marginTop: 24,
                        alignSelf: 'center'
                    },
                    animatedStyles
                ]}
            />
            <Animated.View
                style={[
                    {
                        backgroundColor: theme.textSecondary,
                        height: 26,
                        width: 78,
                        borderRadius: 20,
                        marginTop: 20,
                        alignSelf: 'center'
                    },
                    animatedStyles
                ]}
            />
            <Animated.View
                style={[
                    {
                        backgroundColor: theme.surfaceOnBg,
                        height: 96,
                        borderRadius: 20,
                        marginTop: 24,
                        marginHorizontal: 20
                    },
                    animatedStyles
                ]}
            />
        </Animated.View>
    );
}

function HoldersPlaceholder() {
    const animation = useSharedValue(0);

    useEffect(() => {
        animation.value =
            withRepeat(
                withTiming(1, {
                    duration: 300,
                    easing: Easing.linear,
                }),
                -1,
                true,
            );
    }, []);

    const animatedStyles = useAnimatedStyle(() => {
        const opacity = interpolate(
            animation.value,
            [0, 1],
            [1, 0.9],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            animation.value,
            [0, 1],
            [1, 1.01],
            Extrapolation.CLAMP,
        )
        return {
            flex: 1,
            alignSelf: 'center',
            justifyContent: 'center',
            marginBottom: 56,
            opacity: opacity,
            transform: [{ scale: scale }],
        };
    }, []);

    return (
        <Animated.View style={animatedStyles}>
            <IcHolders color={'#eee'} />
        </Animated.View>
    );
}

export function WebViewLoader({ loaded, type }: { loaded: boolean, type: 'account' | 'create' }) {
    const theme = useTheme();
    const navigation = useTypedNavigation();

    const [animationPlayed, setAnimationPlayed] = useState(loaded);
    const [showClose, setShowClose] = useState(false);

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
            opacity: withTiming(opacity.value, { duration: 150, easing: Easing.bezier(0.42, 0, 1, 1) }),
        };
    });

    useEffect(() => {
        if (loaded) {
            setTimeout(() => {
                opacity.value = 0;
                setTimeout(() => {
                    setAnimationPlayed(true);
                }, 150);
            }, 250);
        }
    }, [loaded]);

    useEffect(() => {
        setTimeout(() => {
            setShowClose(true);
        }, 3000);
    }, []);

    if (animationPlayed) {
        return null;
    }

    return (
        <Animated.View
            style={animatedStyles}
        >
            <ScreenHeader
                onBackPressed={showClose ? navigation.goBack : undefined}
                style={{ paddingHorizontal: 16, width: '100%' }}
            />
            {type === 'account' ? <PulsingCardPlaceholder {...theme} /> : <HoldersPlaceholder />}
        </Animated.View>
    );
}

export const HoldersAppComponent = memo((
    props: {
        variant: HoldersAppParams,
        token: string,
        title: string,
        endpoint: string
    }
) => {
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const acc = useMemo(() => getCurrentAddress(), []);
    const domain = useMemo(() => extractDomain(props.endpoint), []);

    const status = useHoldersAccountStatus(acc.address.toString({ testOnly: isTestnet })).data;
    const accountsStatus = useHoldersAccounts(acc.address.toString({ testOnly: isTestnet })).data;
    const domainKey = getDomainKey(domain);

    const webRef = useRef<WebView>(null);
    const lang = getLocales()[0].languageCode;
    const [currency,] = usePrimaryCurrency();
    const selectedAccount = useSelectedAccount();

    const source = useMemo(() => {
        let route = '';
        if (props.variant.type === 'create') {
            route = '/create';
        } else if (props.variant.type === 'account') {
            route = `/account/${props.variant.id}`;
        }

        const queryParams = new URLSearchParams({
            lang: lang,
            currency: currency,
            theme: 'holders',
            'theme-style': theme.style === 'dark' ? 'dark' : 'light',
        });

        const url = `${props.endpoint}${route}?${queryParams.toString()}`;
        const initialRoute = `${route}?${queryParams.toString()}`;

        queryParams.append('initial-route', route);

        return { url, initialRoute, queryParams: queryParams.toString() };
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

        // Resolve linking
        Linking.openURL(event.url);
        return false;
    }, []);

    //
    // Injection
    //
    const injectSource = useMemo(() => {
        if (!selectedAccount) {
            throw new Error('No account selected');
        }

        const contract = contractFromPublicKey(selectedAccount.publicKey);
        const config = walletConfigFromContract(contract);

        const walletConfig = config.walletConfig;
        const walletType = config.type;

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
                        token: status.state === HoldersAccountState.Ok ? status.token : getHoldersToken(acc.address.toString({ testOnly: isTestnet })),
                    }
                }
                : {},
            ...accountsStatus?.type === 'private' ? { accountsList: accountsStatus.accounts } : {},
        }

        const initialInjection = `
        window.initialState = ${JSON.stringify(initialState)};
        window['tonhub'] = (() => {
            const obj = {};
            Object.freeze(obj);
            return obj;
        })();
        `;

        if (!domainKey) {
            return initialInjection;
        }

        let domainSign = createDomainSignature(domain, domainKey);

        return createInjectSource({
            config: {
                version: 1,
                platform: Platform.OS,
                platformVersion: Platform.Version,
                network: isTestnet ? 'testnet' : 'mainnet',
                address: selectedAccount.address.toString({ testOnly: isTestnet }),
                publicKey: selectedAccount.publicKey.toString('base64'),
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
            safeArea,
            additionalInjections: initialInjection,
        });
    }, [status, accountsStatus]);

    const injectionEngine = useInjectEngine(extractDomain(props.endpoint), props.title, isTestnet, props.endpoint);

    const onClose = useCallback(() => {
        onHoldersInvalidate(acc.addressString, isTestnet);
        trackEvent(MixpanelEvent.HoldersClose, { type: props.variant.type, duration: Date.now() - start }, isTestnet);
    }, []);

    const onContentProcessDidTerminate = useCallback(() => {
        webRef.current?.reload();
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
            injectionEngine,
            injectedJavaScriptBeforeContentLoaded: injectSource,
            useStatusBar: true,
            useMainButton: true,
            useToaster: true,
            useQueryAPI: true,
            onShouldStartLoadWithRequest: loadWithRequest,
            onContentProcessDidTerminate,
            onClose,
        }
    }, [
        domain,
        isTestnet,
        safeArea,
        injectionEngine,
        loadWithRequest,
        onContentProcessDidTerminate,
        onClose,
        injectSource
    ]);

    return (
        <View style={{ backgroundColor: theme.backgroundPrimary, flex: 1 }}>
            <DAppWebView
                ref={webRef}
                source={{ uri: source.url }}
                {...webViewProps}
                webviewDebuggingEnabled={isTestnet}
                loader={(p) => <WebViewLoader type={props.variant.type} {...p} />}
            />
        </View>
    );
});