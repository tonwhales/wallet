import * as React from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { t } from '../../i18n/t';
import { extractDomain } from '../../engine/utils/extractDomain';
import { useParams } from '../../utils/useParams';
import { HoldersAppParams, HoldersAppParamsType } from './HoldersAppFragment';
import { getLocales } from 'react-native-localize';
import { fragment } from '../../fragment';
import { useKeysAuth } from '../../components/secure/AuthWalletKeys';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useNetwork, usePrimaryCurrency, useSelectedAccount } from '../../engine/hooks';
import { useTheme } from '../../engine/hooks';
import { useHoldersEnroll } from '../../engine/hooks';
import { ScreenHeader } from '../../components/ScreenHeader';
import { HoldersLoader } from './components/HoldersAppComponent';
import { StatusBar } from 'expo-status-bar';
import { openWithInApp } from '../../utils/openWithInApp';
import { HoldersEnrollErrorType } from '../../engine/hooks/holders/useHoldersEnroll';
import { DAppWebView, DAppWebViewProps } from '../../components/webview/DAppWebView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppManifest } from '../../engine/getters/getAppManifest';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { MixpanelEvent, trackEvent } from '../../analytics/mixpanel';
import { AnimatedCards } from './components/AnimatedCards';

export const HoldersLandingFragment = fragment(() => {
    const acc = useSelectedAccount()!;
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const webRef = useRef<WebView>(null);
    const authContext = useKeysAuth();
    const { showActionSheetWithOptions } = useActionSheet();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const [currency] = usePrimaryCurrency();

    const { endpoint, onEnrollType, inviteId } = useParams<{ endpoint: string, onEnrollType: HoldersAppParams, inviteId?: string }>();

    const domain = extractDomain(endpoint);
    const enroll = useHoldersEnroll({ acc, domain, authContext, inviteId, authStyle: { paddingTop: 32 } });
    const lang = getLocales()[0].languageCode;

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

            const res = await enroll();

            if (res.type === 'success') {
                // Navigate to continue
                navigation.replace('Holders', onEnrollType);
                isAuthenticating.current = false;
                return;
            }

            let message = ''

            switch (res.error) {
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
        } catch {
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
    }, [enroll]);

    const source = useMemo(() => {
        const queryParams = new URLSearchParams({
            lang: lang,
            currency: currency,
            theme: 'holders',
            'theme-style': theme.style === 'dark' ? 'dark' : 'light',
        });

        const url = `${endpoint}/about?${queryParams.toString()}`;
        const initialRoute = `/about?${queryParams.toString()}`;

        queryParams.append('initial-route', 'about');

        return { url, initialRoute, queryParams: queryParams.toString() };
    }, [theme]);

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

            onContentProcessDidTerminate,
            onEnroll
        }
    }, [onContentProcessDidTerminate, onEnroll]);

    const [renderKey, setRenderKey] = useState(0);

    const onReload = useCallback(() => {
        trackEvent(MixpanelEvent.HoldersReload, { route: source.url }, isTestnet);
        setRenderKey(renderKey + 1);
    }, [renderKey, isTestnet]);

    const onSupport = useCallback(() => {
        const tonhubOptions = [t('common.cancel'), t('settings.support.telegram'), t('settings.support.form')];
        const cancelButtonIndex = 0;

        const tonhubSupportSheet = () => {
            showActionSheetWithOptions({
                options: tonhubOptions,
                title: t('settings.support.title'),
                cancelButtonIndex,
            }, (selectedIndex?: number) => {
                switch (selectedIndex) {
                    case 1:
                        openWithInApp('https://t.me/WhalesSupportBot');
                        break;
                    case 2:
                        openWithInApp('https://airtable.com/appWErwfR8x0o7vmz/shr81d2H644BNUtPN');
                        break;
                    default:
                        break;
                }
            });
        }

        tonhubSupportSheet();
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: theme.backgroundPrimary }}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            <View
                key={`content-${renderKey}`}
                style={{ backgroundColor: theme.surfaceOnBg, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch', }}
            >
                <DAppWebView
                    ref={webRef}
                    source={{ uri: source.url }}
                    {...webViewProps}
                    defaultQueryParamsState={{
                        backPolicy: 'back',
                        showKeyboardAccessoryView: false,
                        lockScroll: true
                    }}
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
                </Animated.View>
            </View>
        </View>
    );
});