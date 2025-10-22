import { Linking, Platform, Pressable, Share, View } from "react-native";
import { fragment } from "../../fragment";
import { StatusBar } from "expo-status-bar";
import { useBounceableWalletFormat, useCreateDomainKeyIfNeeded, useDAppBridge, useNetwork, usePrice, useTheme } from "../../engine/hooks";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { usePermissions } from "../../utils/expo/usePermissions";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentAddress } from "../../storage/appState";
import i18n from 'i18next';
import { DAppWebView, DAppWebViewProps } from "../../components/webview/DAppWebView";
import { useLinkNavigator } from "../../utils/link-navigator/useLinkNavigator";
import { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { extractDomain } from "../../engine/utils/extractDomain";
import { resolveUrl } from "../../utils/url/resolveUrl";
import { protectNavigation } from "../apps/components/protect/protectNavigation";
import { useInjectEngine, useTonhubBridgeEngine } from "../apps/components/inject/useInjectEngine";
import { injectSourceFromDomain } from "../../engine/utils/injectSourceFromDomain";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Modal from "react-native-modal";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { ItemSwitch } from "../../components/Item";
import { ATextInput } from "../../components/ATextInput";
import { RoundButton } from "../../components/RoundButton";
import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from "react-native-gesture-handler";
import { useKeysAuth } from "../../components/secure/AuthWalletKeys";
import { getDomainKey } from "../../engine/state/domainKeys";
import { ItemButton } from "../../components/ItemButton";
import { t } from "../../i18n/t";
import { tonhubBridgeSource } from "../apps/components/inject/createInjectSource";
import { getPlatform } from "../../engine/tonconnect/config";

import Chevron from '@assets/ic-chevron-down.svg';

type EngineOptions = 'ton-x' | 'ton-connect' | 'none' | 'tonhub-bridge';
const engineOptions: EngineOptions[] = ['ton-x', 'ton-connect', 'none', 'tonhub-bridge'];

export const DevDAppWebViewFragment = fragment(() => {
    const authContext = useKeysAuth();
    const safeArea = useSafeAreaInsets();
    const isTestnet = useNetwork().isTestnet;
    const navigation = useTypedNavigation();
    const createDomainKeyIfNeeded = useCreateDomainKeyIfNeeded();
    const theme = useTheme();
    const pushPermissionsGranted = usePermissions();
    const [, currency] = usePrice();
    const [bounceableFormat] = useBounceableWalletFormat();

    const initExampleUrl = isTestnet ? 'https://test.tonhub.com/' : 'https://tonhub.com/';

    const [url, setUrl] = useState(initExampleUrl);
    const [urlInput, setUrlInput] = useState(url);
    const [engine, setEngine] = useState<EngineOptions>('tonhub-bridge');
    const [useMainButton, setUseMainButton] = useState(false);
    const [useStatusBar, setUseStatusBar] = useState(false);
    const [useQueryAPI, setUseQueryAPI] = useState(false);
    const [useToaster, setUseToaster] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [renderKey, setRenderKey] = useState(0);

    const endpoint = useMemo(() => {
        try {
            const selected = getCurrentAddress();

            const source = new URL(url);

            source.searchParams.set('address', encodeURIComponent(selected.addressString));
            source.searchParams.set('utm_source', 'tonhub');
            source.searchParams.set('utm_content', 'extension');
            source.searchParams.set('ref', 'tonhub');
            source.searchParams.set('lang', i18n.language);
            source.searchParams.set('currency', currency);
            source.searchParams.set('themeStyle', theme.style === 'dark' ? 'dark' : 'light');
            source.searchParams.set('pushNotifications', pushPermissionsGranted ? 'true' : 'false');

            return source.toString();
        } catch {
            return url;
        }
    }, [url, pushPermissionsGranted, currency, theme.style]);

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

    //
    // Injection
    //
    const domain = useMemo(() => {
        try {
            return extractDomain(endpoint)
        } catch {
            return '';
        }
    }, []);
    const [hasDomainKey, setHasDomainKey] = useState(getDomainKey(domain) !== undefined);

    useEffect(() => {
        setHasDomainKey(getDomainKey(domain) !== undefined);
    }, [domain]);

    // ton-connect
    const { ref: webViewRef, isConnected, disconnect, ...tonConnectWebViewProps } = useDAppBridge(endpoint, navigation);
    // ton-x
    const injectionEngine = useInjectEngine(domain, 'DevWebView', isTestnet, endpoint);
    const injectionSource = injectSourceFromDomain(domain, isTestnet, safeArea);
    // tonhub-bridge
    const bridgeEngine = useTonhubBridgeEngine(domain, 'DevWebView', isTestnet, endpoint);

    const webViewProps: DAppWebViewProps = useMemo(() => {
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

        if (engine === 'tonhub-bridge') {
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
        tonConnectWebViewProps, injectionEngine, bridgeEngine, injectionSource,
        domain, isTestnet, safeArea, webViewRef,
        useStatusBar, useMainButton, useQueryAPI, useToaster,
        loadWithRequest
    ]);

    useEffect(() => {
        setRenderKey(renderKey + 1);
    }, [webViewProps.injectedJavaScriptBeforeContentLoaded, useMainButton, useStatusBar, useQueryAPI, useToaster, url]);

    const onShare = useCallback(() => {
        if (Platform.OS === 'ios') {
            Share.share({ title: t('receive.share.title'), url: endpoint });
        } else {
            Share.share({ title: t('receive.share.title'), message: endpoint });
        }
    }, [endpoint]);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            <DAppWebView
                key={renderKey}
                ref={webViewRef}
                source={{ uri: endpoint }}
                {...webViewProps}
                webviewDebuggingEnabled={isTestnet}
                onContentProcessDidTerminate={webViewRef.current?.reload}
            />
            <Pressable
                style={{ position: 'absolute', right: 16, bottom: safeArea.bottom + 16 }}
                onPress={() => {
                    setUrlInput(url);
                    setModalVisible(true);
                }}
            >
                <View style={{
                    backgroundColor: theme.accent,
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 54, width: 54,
                    borderRadius: 27,
                }}>
                    <Chevron
                        height={24} width={24}
                        style={{
                            height: 24, width: 24,
                            transform: [{ rotate: isModalVisible ? '0deg' : '-180deg' }]
                        }}
                    />
                </View>
            </Pressable>
            <Modal
                isVisible={isModalVisible}
                avoidKeyboard
                onBackdropPress={() => setModalVisible(false)}
            >
                <View style={{ flex: 1 }}>
                    <View style={{
                        marginTop: safeArea.top + 16,
                        paddingTop: 16,
                        backgroundColor: theme.elevation,
                        borderRadius: 14,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        flexShrink: 1
                    }}>
                        <ScrollView>
                            <View style={{
                                flexDirection: 'row',
                                marginBottom: 16, marginHorizontal: 16,
                                paddingHorizontal: 8, paddingVertical: 4,
                                justifyContent: 'flex-end', alignItems: 'center',
                                backgroundColor: theme.surfaceOnBg,
                                borderRadius: 8,
                                gap: 8
                            }}>
                                <Pressable
                                    style={{ padding: 8, justifyContent: 'center', alignItems: 'center' }}
                                    onPress={webViewRef.current?.goBack}
                                >
                                    <Ionicons
                                        name={'arrow-back'}
                                        size={24}
                                        color={theme.iconNav}
                                    />
                                </Pressable>
                                <Pressable
                                    style={{ padding: 8, justifyContent: 'center', alignItems: 'center' }}
                                    onPress={webViewRef.current?.goForward}
                                >
                                    <Ionicons
                                        name={'arrow-forward'}
                                        size={24}
                                        color={theme.iconNav}
                                    />
                                </Pressable>
                                <Pressable
                                    style={{ padding: 8, justifyContent: 'center', alignItems: 'center' }}
                                    onPress={webViewRef.current?.stopLoading}
                                >
                                    <Ionicons
                                        name={'close'}
                                        size={24}
                                        color={theme.iconNav}
                                    />
                                </Pressable>
                                <Pressable
                                    style={{ padding: 8, justifyContent: 'center', alignItems: 'center' }}
                                    onPress={webViewRef.current?.reload}
                                >
                                    <Ionicons
                                        name={'refresh'}
                                        size={24}
                                        color={theme.iconNav}
                                    />
                                </Pressable>
                                <View style={{ flexGrow: 1 }} />

                                <Pressable
                                    style={{ padding: 8, justifyContent: 'center', alignItems: 'center' }}
                                    onPress={onShare}
                                >
                                    <Ionicons
                                        name={'share'}
                                        size={24}
                                        color={theme.iconNav}
                                    />
                                </Pressable>
                            </View>
                            <SegmentedControl
                                values={engineOptions}
                                selectedIndex={engineOptions.indexOf(engine ?? 'none')}
                                appearance={theme.style === 'dark' ? 'dark' : 'light'}
                                onChange={(event) => setEngine(engineOptions[event.nativeEvent.selectedSegmentIndex] ?? null)}
                                style={{ marginHorizontal: 16 }}
                                backgroundColor={theme.surfaceOnBg}
                                fontStyle={{ fontSize: 10, fontWeight: '500', color: theme.textPrimary }}
                                activeFontStyle={{ fontSize: 10, fontWeight: '500', color: theme.textPrimary }}
                            />
                            <View style={{
                                backgroundColor: theme.surfaceOnElevation,
                                paddingVertical: 20,
                                borderRadius: 20,
                                marginHorizontal: 16,
                                marginTop: 16
                            }}>
                                <ATextInput
                                    style={{ paddingHorizontal: 16, flexShrink: 1 }}
                                    value={urlInput}
                                    onValueChange={setUrlInput}
                                    label="URL"
                                />
                            </View>
                            {engine === 'ton-x' && (
                                <ItemButton
                                    title={`${hasDomainKey ? '' : 'Create'} Domain key`}
                                    hint={hasDomainKey ? 'Exists' : 'Not domain key'}
                                    onPress={!hasDomainKey ? async () => {
                                        let domain = extractDomain(endpoint);
                                        let created = await createDomainKeyIfNeeded(
                                            domain,
                                            authContext,
                                            undefined,
                                            {
                                                backgroundColor: theme.elevation,
                                                containerStyle: { paddingBottom: safeArea.bottom + 56 },
                                            },
                                        );
                                        if (created) {
                                            setHasDomainKey(true);
                                        }
                                    } : undefined}
                                />
                            )}
                            <ItemSwitch
                                title={'Main button API'}
                                value={useMainButton}
                                onChange={setUseMainButton}
                            />
                            <ItemSwitch
                                title={'Status bar API'}
                                value={useStatusBar}
                                onChange={setUseStatusBar}
                            />
                            <ItemSwitch
                                title={'Toaster API'}
                                value={useToaster}
                                onChange={setUseToaster}
                            />
                            <ItemSwitch
                                title={'Query API'}
                                value={useQueryAPI}
                                onChange={setUseQueryAPI}
                            />
                            <RoundButton
                                title={'Save'}
                                style={{ marginHorizontal: 16, marginBottom: 16 }}
                                onPress={() => {
                                    setModalVisible(false);
                                    setUrl(urlInput);
                                }}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    )
});