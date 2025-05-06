import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import { DAppWebView, DAppWebViewProps } from "../../../components/webview/DAppWebView";
import { HoldersLoader } from "./HoldersAppComponent";
import { HoldersAppParams, HoldersAppParamsType } from "../HoldersAppFragment";
import { ScreenHeader } from "../../../components/ScreenHeader";
import { AnimatedCards } from "./AnimatedCards";
import { Image } from "expo-image";
import { useBounceableWalletFormat, useHoldersEnroll, useHoldersLedgerEnroll, useLanguage, useNetwork, usePrimaryCurrency, useSelectedAccount, useSolanaSelectedAccount, useSupport, useTheme } from "../../../engine/hooks";
import WebView from "react-native-webview";
import { useKeysAuth } from "../../../components/secure/AuthWalletKeys";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { extractDomain } from "../../../engine/utils/extractDomain";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { getAppManifest } from "../../../engine/getters/getAppManifest";
import { openWithInApp } from "../../../utils/openWithInApp";
import { HoldersEnrollErrorType } from "../../../engine/hooks/holders/useHoldersEnroll";
import { t } from "../../../i18n/t";
import { getSearchParams } from "../../../utils/holders/queryParamsStore";
import { MixpanelEvent, trackEvent } from "../../../analytics/mixpanel";
import { Typography } from "../../../components/styles";
import { useLedgerTransport } from "../../ledger/components/TransportContext";
import { Address } from "@ton/core";

export type HoldersLandingComponentProps = {
    endpoint: string,
    onEnrollType: HoldersAppParams,
    inviteId?: string,
    isLedger?: boolean
};

export const HoldersLandingComponent = memo(({ endpoint, onEnrollType, inviteId, isLedger }: HoldersLandingComponentProps) => {
    const acc = useSelectedAccount()!;
    const solanaAddress = useSolanaSelectedAccount()!
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const webRef = useRef<WebView>(null);
    const authContext = useKeysAuth();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const [currency] = usePrimaryCurrency();
    const [lang] = useLanguage();
    const [bounceableFormat] = useBounceableWalletFormat();
    const { onSupport } = useSupport({ isLedger });
    const ledgerContext = useLedgerTransport();
    const ledgerAddress = ledgerContext?.addr?.address ? Address.parse(ledgerContext?.addr?.address) : undefined;
    const address = isLedger ? ledgerAddress : acc?.address;

    const domain = extractDomain(endpoint);
    const [confirmOnLedger, setConfirmOnLedger] = useState(false);
    const isComponentMounted = useRef(true);

    const enroll = useHoldersEnroll({ acc, domain, authContext, inviteId, authStyle: { paddingTop: 32 }, solanaAddress: isLedger ? undefined : solanaAddress });
    const ledgerEnroll = useHoldersLedgerEnroll({ inviteId, setConfirming: setConfirmOnLedger });
    const authenticate = isLedger ? ledgerEnroll : enroll;

    useEffect(() => {
        return () => {
            isComponentMounted.current = false;
        };
    }, []);

    // Anim
    const isAuthenticating = useRef(false);
    const authOpacity = useSharedValue(0);
    const animatedAuthStyles = useAnimatedStyle(() => {
        return {
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            paddingTop: safeArea.top,
            backgroundColor: theme.backgroundPrimary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: withTiming(authOpacity.value, { duration: 300, easing: Easing.bezier(0.42, 0, 1, 1) }),
        };
    });

    const onEnroll = useCallback(async () => {
        if (isAuthenticating.current) {
            return;
        }
        // Show loader
        authOpacity.value = 1;
        isAuthenticating.current = true;

        try {
            const manifestUrl = `${endpoint}/jsons/tonconnect-manifest.json`;
            const manifest = await getAppManifest(manifestUrl);
            if (!manifest) {
                Alert.alert(
                    t('products.holders.enroll.failed.title'),
                    t('products.holders.enroll.failed.noAppData'),
                    [
                        { text: t('common.cancel') },
                        {
                            text: t('webView.contactSupport'),
                            onPress: () => openWithInApp('https://t.me/WhalesSupportBot')
                        }
                    ]
                );
                authOpacity.value = 0;
                isAuthenticating.current = false;
                return;
            }

            const res = await authenticate();

            if (res.type === 'success') {
                if (isComponentMounted.current) {
                    // Navigate to continue
                    navigation.navigateHolders(onEnrollType, isTestnet, isLedger, true);
                }
                isAuthenticating.current = false;
                return;
            }

            const err = (res as { type: 'error', error: HoldersEnrollErrorType }).error;

            if (err === HoldersEnrollErrorType.LedgerHandled) {
                authOpacity.value = 0;
                isAuthenticating.current = false;
                return;
            }

            let message = ''

            switch (err) {
                case HoldersEnrollErrorType.NoDomainKey:
                    message = t('products.holders.enroll.failed.noDomainKey');
                    break;
                case HoldersEnrollErrorType.CreateSignatureFailed:
                    message = t('products.holders.enroll.failed.createSignature');
                    break;
                case HoldersEnrollErrorType.DomainKeyFailed:
                    message = t('products.holders.enroll.failed.createDomainKey');
                    break;
                case HoldersEnrollErrorType.FetchTokenFailed:
                    message = t('products.holders.enroll.failed.fetchToken');
                    break;
            }

            Alert.alert(
                t('products.holders.enroll.failed.title'),
                message,
                [
                    { text: t('common.cancel') },
                    {
                        text: t('webView.contactSupport'),
                        onPress: () => openWithInApp('https://t.me/WhalesSupportBot')
                    }
                ]
            );
            authOpacity.value = 0;
            isAuthenticating.current = false;
            return;
        } catch (error) {
            console.error('HoldersLandingFragment enroll error', error);
            authOpacity.value = 0;
            isAuthenticating.current = false;

            Alert.alert(
                t('products.holders.enroll.failed.title'),
                undefined,
                [
                    { text: t('common.cancel') },
                    {
                        text: t('webView.contactSupport'),
                        onPress: () => openWithInApp('https://t.me/WhalesSupportBot')
                    }
                ]
            );
        }
    }, [authenticate, isTestnet, endpoint]);

    const source = useMemo(() => {
        const queryParams = new URLSearchParams({
            lang: lang,
            currency: currency,
            theme: 'holders',
            'theme-style': theme.style === 'dark' ? 'dark' : 'light',
            bounceable: bounceableFormat.toString()
        });

        const storedReferrerParams = getSearchParams();

        for (const [key, value] of Object.entries(storedReferrerParams)) {
            queryParams.append(key, value);
        }

        const url = `${endpoint}/about?${queryParams.toString()}`;
        const initialRoute = `/about?${queryParams.toString()}`;

        queryParams.append('initial-route', 'about');

        return { url, initialRoute, queryParams: queryParams.toString() };
    }, [theme, lang, currency, endpoint, bounceableFormat]);

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
            useStatusBar: true,
            useMainButton: true,
            useToaster: true,
            useQueryAPI: true,
            useEmitter: true,
            useAuthApi: true,
            useWalletAPI: true,
            useDappClient: true,
            useSupportAPI: true,

            onContentProcessDidTerminate,
            onEnroll
        }
    }, [onContentProcessDidTerminate, onEnroll]);

    const [renderKey, setRenderKey] = useState(0);

    const onReload = useCallback(() => {
        trackEvent(MixpanelEvent.HoldersReload, { route: source.url }, isTestnet);
        setRenderKey(renderKey + 1);
    }, [renderKey, isTestnet]);

    return (
        <View
            key={`content-${renderKey}`}
            style={{ backgroundColor: theme.surfaceOnBg, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}
        >
            <DAppWebView
                ref={webRef}
                source={{ uri: source.url }}
                {...webViewProps}
                defaultNavigationOptions={{
                    backPolicy: 'back',
                    showKAV: false,
                    lockScroll: true
                }}
                address={address}
                webviewDebuggingEnabled={isTestnet}
                loader={(p) => <HoldersLoader
                    type={HoldersAppParamsType.Create}
                    {...p}
                    onSupport={onSupport}
                    onReload={onReload}
                />}
            />
            <Animated.View style={[StyleSheet.absoluteFill, animatedAuthStyles]} pointerEvents={'none'}>
                <ScreenHeader
                    onBackPressed={navigation.goBack}
                    style={{ paddingHorizontal: 16 }}
                />
                <AnimatedCards />
                {!!confirmOnLedger && (
                    <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: safeArea.top + 60, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, gap: 16 }}>
                        <View style={{ flexDirection: 'row', flex: 1, flexShrink: 1, paddingLeft: 12, paddingRight: 16, paddingVertical: 8, backgroundColor: theme.surfaceOnElevation, borderRadius: 62, gap: 4, alignItems: 'center' }}>
                            <Image
                                style={{ width: 46, height: 46 }}
                                source={require('@assets/ledger_device_common.png')}
                            />
                            <View style={{ flexShrink: 1 }}>
                                <Text style={[Typography.semiBold20_28, { color: theme.textPrimary, textAlign: 'center', flexShrink: 1 }]}>
                                    {t('products.holders.enroll.ledger.confirmTitle')}
                                </Text>
                            </View>
                        </View>
                    </Animated.View>
                )}
            </Animated.View>
        </View>
    );
});