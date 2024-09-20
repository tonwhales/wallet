import * as React from 'react';
import { ActivityIndicator, Linking, NativeSyntheticEvent, Platform, Share, View, Image, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { ShouldStartLoadRequest, WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';
import { extractDomain } from '../../../engine/utils/extractDomain';
import { resolveUrl } from '../../../utils/resolveUrl';
import { useLinkNavigator } from "../../../useLinkNavigator";
import { warn } from '../../../utils/log';
import { createInjectSource, dispatchResponse } from './inject/createInjectSource';
import { useInjectEngine } from './inject/useInjectEngine';
import { contractFromPublicKey, walletConfigFromContract } from '../../../engine/contractFromPublicKey';
import { protectNavigation } from './protect/protectNavigation';
import { t } from '../../../i18n/t';
import MoreIcon from '../../../../assets/ic_more.svg';
import { generateAppLink } from '../../../utils/generateAppLink';
import { MixpanelEvent, trackEvent, useTrackEvent } from '../../../analytics/mixpanel';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import ContextMenu, { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view';
import { useBounceableWalletFormat, useTheme } from '../../../engine/hooks';
import { useNetwork } from '../../../engine/hooks';
import { getCurrentAddress } from '../../../storage/appState';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { createDomainSignature } from '../../../engine/utils/createDomainSignature';
import { DomainSubkey, getDomainKey } from '../../../engine/state/domainKeys';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWalletVersion } from '../../../engine/hooks/useWalletVersion';

export const AppComponent = memo((props: {
    endpoint: string,
    color: string,
    dark: boolean,
    foreground: string,
    title: string,
    domainKey: DomainSubkey
}) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const domain = useMemo(() => extractDomain(props.endpoint), []);
    const domainKey = getDomainKey(domain);
    const safeArea = useSafeAreaInsets();
    const [bounceableFormat,] = useBounceableWalletFormat();
    //
    // Track events
    //
    const navigation = useTypedNavigation();
    const start = useMemo(() => {
        return Date.now();
    }, []);
    const close = useCallback(() => {
        navigation.goBack();
        trackEvent(MixpanelEvent.AppClose, { url: props.endpoint, domain, duration: Date.now() - start, protocol: 'ton-x' }, isTestnet);
    }, []);
    useTrackEvent(MixpanelEvent.AppOpen, { url: props.endpoint, domain, protocol: 'ton-x' }, isTestnet);

    // 
    // Actions menu
    // 

    const onShare = useCallback(() => {
        const link = generateAppLink(props.endpoint, props.title, isTestnet);
        if (Platform.OS === 'ios') {
            Share.share({ title: t('receive.share.title'), url: link });
        } else {
            Share.share({ title: t('receive.share.title'), message: link });
        }
    }, [props]);

    const onReview = useCallback(() => {
        navigation.navigateReview({ type: 'review', url: props.endpoint });
    }, [props]);

    const onReport = useCallback(() => {
        navigation.navigateReview({ type: 'report', url: props.endpoint });
    }, [props]);

    // View
    let [loaded, setLoaded] = useState(false);
    const webRef = useRef<WebView>(null);

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

    const walletVersion = useWalletVersion();

    const injectSource = useMemo(() => {
        const currentAccount = getCurrentAddress();
        const contract = contractFromPublicKey(currentAccount.publicKey, walletVersion, isTestnet);
        const config = walletConfigFromContract(contract);

        const walletConfig = config.walletConfig;
        const walletType = config.type;

        if (!domainKey) {
            return '';
        }

        let domainSign = createDomainSignature(domain, domainKey, isTestnet);

        return createInjectSource({
            config: {
                version: 1,
                platform: Platform.OS,
                platformVersion: Platform.Version,
                network: isTestnet ? 'testnet' : 'mainnet',
                address: currentAccount.address.toString({ testOnly: isTestnet, bounceable: bounceableFormat }),
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
    }, [domainKey, bounceableFormat]);
    const injectionEngine = useInjectEngine(domain, props.title, isTestnet, props.endpoint);
    const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
        const nativeEvent = event.nativeEvent;

        // Resolve parameters
        let data: any;
        let id: number;
        try {
            let parsed = JSON.parse(nativeEvent.data);
            if (typeof parsed.id !== 'number') {
                warn('Invalid operation id');
                return;
            }
            id = parsed.id;
            data = parsed.data;
        } catch (e) {
            warn(e);
            return;
        }

        // Execute
        (async () => {
            let res = { type: 'error', message: 'Unknown error' };
            try {
                res = await injectionEngine.execute(data);
            } catch {
                warn('Failed to execute inject engine operation');
            }
            dispatchResponse(webRef, { id, data: res });
        })();

    }, []);

    const handleAction = useCallback((e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => {
        if (e.nativeEvent.name === t('common.share')) onShare();
        if (e.nativeEvent.name === t('review.title')) onReview();
        if (e.nativeEvent.name === t('report.title')) onReport();
    }, [onShare, onReview, onReport]);

    return (
        <>
            <View style={{ backgroundColor: theme.backgroundPrimary, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
                <ScreenHeader
                    style={{ paddingTop: 32, paddingHorizontal: 16 }}
                    onBackPressed={close}
                    rightButton={(
                        <ContextMenu
                            style={{ height: 30 }}
                            dropdownMenuMode
                            onPress={handleAction}
                            actions={[
                                { title: t('common.share'), systemIcon: Platform.OS === 'ios' ? 'square.and.arrow.up' : undefined },
                                { title: t('review.title'), systemIcon: Platform.OS === 'ios' ? 'star' : undefined },
                                { title: t('report.title'), systemIcon: Platform.OS === 'ios' ? 'exclamationmark.triangle' : undefined, destructive: true },
                            ]}
                        >
                            <View style={{
                                height: 30, width: 30,
                                justifyContent: 'center', alignItems: 'center',
                                backgroundColor: theme.surfaceOnElevation, borderRadius: 15
                            }}>
                                <Image
                                    style={{
                                        height: 26, width: 26,
                                        tintColor: theme.textSecondary,
                                    }}
                                    source={require('@assets/ic-more.png')}
                                />
                            </View>
                            <MoreIcon color={'black'} height={30} width={30} />
                        </ContextMenu>
                    )}
                    title={props.title}
                />
                <WebView
                    ref={webRef}
                    source={{ uri: props.endpoint }}
                    startInLoadingState={true}
                    style={{ backgroundColor: theme.backgroundPrimary, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}
                    onLoadEnd={() => setLoaded(true)}
                    contentInset={{ top: 0, bottom: 0 }}
                    autoManageStatusBarEnabled={false}
                    allowFileAccessFromFileURLs={false}
                    allowUniversalAccessFromFileURLs={false}
                    decelerationRate="normal"
                    allowsInlineMediaPlayback={true}
                    injectedJavaScriptBeforeContentLoaded={injectSource}
                    onShouldStartLoadWithRequest={loadWithRequest}
                    onMessage={handleWebViewMessage}
                />
                {!loaded && (
                    <Animated.View
                        entering={FadeIn}
                        exiting={FadeOut}
                        style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.backgroundPrimary }]}
                        pointerEvents={loaded ? 'none' : 'box-none'}
                    >
                        <ActivityIndicator size="large" color={theme.accent} />
                    </Animated.View>
                )}
            </View>
        </>
    );
});