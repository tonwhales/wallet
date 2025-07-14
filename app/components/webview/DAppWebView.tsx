import { ForwardedRef, RefObject, forwardRef, memo, useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { KeyboardAvoidingView, Platform, View, StyleSheet, ActivityIndicator, BackHandler, Linking } from "react-native";
import WebView, { WebViewMessageEvent, WebViewNavigation, WebViewProps } from "react-native-webview";
import { useNetwork, useTheme } from "../../engine/hooks";
import { WebViewErrorComponent } from "./WebViewErrorComponent";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";
import { DappMainButton, reduceMainButton } from "../DappMainButton";
import Animated, { FadeInDown, FadeOut, FadeOutDown } from "react-native-reanimated";
import { authAPI, dappClientAPI, dappWalletAPI, dispatchResponse, dispatchTonhubBridgeResponse, emitterAPI, mainButtonAPI, statusBarAPI, supportAPI, toasterAPI } from "../../fragments/apps/components/inject/createInjectSource";
import { warn } from "../../utils/log";
import { extractDomain } from "../../engine/utils/extractDomain";
import { openWithInApp } from "../../utils/openWithInApp";
import { InjectEngine } from "../../fragments/apps/components/inject/InjectEngine";
import { useToaster as useToasterClient } from "../toast/ToastProvider";
import { extractWebViewQueryAPIParams } from "./utils/extractWebViewQueryAPIParams";
import { useMarkBannerHidden } from "../../engine/hooks/banners/useHiddenBanners";
import { isSafeDomain } from "./utils/isSafeDomain";
import DeviceInfo from 'react-native-device-info';
import { getLastAuthTimestamp, useKeysAuth } from "../secure/AuthWalletKeys";
import { getLockAppWithAuthState } from "../../engine/state/lockAppWithAuthState";
import { WebViewSourceUri } from "react-native-webview/lib/WebViewTypes";
import { holdersUrl } from "../../engine/api/holders/fetchUserState";
import { useLocalStorageStatus } from "../../engine/hooks/webView/useLocalStorageStatus";
import { checkLocalStorageScript } from "./utils/checkLocalStorageScript";
import { isAllowedDomain } from "../../fragments/apps/components/protect/protectNavigation";
import { ScreenHeader } from "../ScreenHeader";
import { DAppWebViewAPI, processWebViewMessage } from "./utils/processWebViewMessage";
import { SetNavigationOptionsAction, WebViewNavigationOptions, reduceNavigationOptions } from "./utils/reduceNavigationOptions";
import { BackPolicy, QueryAPI } from "./types";
import { Address } from "@ton/core";

export type DAppWebViewProps = WebViewProps & DAppWebViewAPI & {
    address?: Address,
    useWalletAPI?: boolean;
    injectionEngine?: InjectEngine;
    onContentProcessDidTerminate?: () => void;
    onClose?: () => void;
    loader?: (props: WebViewLoaderProps<{}>) => JSX.Element;
    refId?: string;
    defaultNavigationOptions?: WebViewNavigationOptions;
    onEnroll?: (payload?: string) => void;
    defaultSafeArea?: { top?: number; right?: number; bottom?: number; left?: number; };
}

export type WebViewLoaderProps<T> = { loaded: boolean } & T;

function WebViewLoader(props: WebViewLoaderProps<{}>) {
    const theme = useTheme();

    if (props.loaded) {
        return null;
    }
    return (
        <Animated.View
            exiting={FadeOut}
            style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.backgroundPrimary }]}
            pointerEvents={props.loaded ? 'none' : 'box-none'}
        >
            <ActivityIndicator size={'small'} color={theme.accent} />
        </Animated.View>
    );
};

export const DAppWebView = memo(forwardRef((props: DAppWebViewProps, ref: ForwardedRef<WebView>) => {
    const { isTestnet } = useNetwork();
    const {
        defaultNavigationOptions, source, useQueryAPI, refId, address,
        onClose, onEnroll, onMessage, onNavigationStateChange,
        useMainButton, useStatusBar, useToaster, useEmitter, useAuthApi, useWalletAPI, useDappClient, useSupportAPI,
        injectedJavaScriptBeforeContentLoaded, injectionEngine, defaultSafeArea,
        loader,
        onContentProcessDidTerminate,
    } = props;
    const safeArea = useSafeAreaInsets();
    const authContext = useKeysAuth();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const toaster = useToasterClient();
    const markRefIdShown = useMarkBannerHidden();
    const [, updateLocalStorageStatus] = useLocalStorageStatus();
    const [currentUrl, setCurrentUrl] = useState<string | undefined>(undefined);
    const shouldShowHeaderNavigation = useMemo(() => {
        if (!currentUrl) {
            return false;
        }
        return isAllowedDomain(extractDomain(currentUrl));
    }, [currentUrl]);

    const [loaded, setLoaded] = useState(false);

    const [mainButton, dispatchMainButton] = useReducer(
        reduceMainButton(),
        {
            text: '',
            textColor: theme.surfaceOnBg,
            color: theme.accent,
            disabledColor: theme.surfaceOnElevation,
            isVisible: false,
            isActive: false,
            isProgressVisible: false,
            onPress: undefined,
        }
    );

    const [navigationOptions, dispatchNavigationOptions] = useReducer(
        reduceNavigationOptions(),
        defaultNavigationOptions ?? {
            backPolicy: 'back',
            showKAV: false,
            lockScroll: false
        }
    );

    const safelyOpenUrl = useCallback((url: string) => {
        try {
            const scheme = new URL(url).protocol.replace(':', '');
            const sourceUrl = (source as WebViewSourceUri)?.uri;

            if (
                scheme === 'tg'
                && !!sourceUrl
                || sourceUrl.startsWith(holdersUrl(isTestnet))
            ) {
                Linking.openURL(url);
                return;
            }

            let pageDomain = extractDomain(url);

            if (isSafeDomain(pageDomain)) {
                openWithInApp(url);
                return;
            }
        } catch { }
    }, [source]);

    const onNavigation = useCallback((url: string) => {
        if (!useQueryAPI) {
            return;
        }
        const params = extractWebViewQueryAPIParams(url);

        if ((params.markAsShown || params.subscribed) && !!refId) {
            markRefIdShown(refId);
        }

        if (params.closeApp) {
            onClose?.();
            navigation.goBack();
            return;
        }

        if (params.openEnrollment) {
            onEnroll?.();
            return;
        }

        if (!!params.openUrl) {
            safelyOpenUrl(params.openUrl);
            return;
        }

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                switch (key) {
                    case QueryAPI.BackPolicy:
                        if (typeof value === 'string') {
                            dispatchNavigationOptions({ type: SetNavigationOptionsAction.setBackPolicy, backPolicy: value as BackPolicy });
                        }
                        break;
                    case QueryAPI.LockScroll:
                        if (typeof value === 'boolean') {
                            dispatchNavigationOptions({ type: SetNavigationOptionsAction.setLockScroll, lockScroll: value });
                        }
                        break;
                    case QueryAPI.ShowKeyboardAccessoryView:
                        if (typeof value === 'boolean') {
                            dispatchNavigationOptions({ type: SetNavigationOptionsAction.setShowKeyboardAccessoryView, showKAV: value });
                        }
                        break;
                    default:
                        warn(`Unsupported query API param: ${key}`);
                }
            }
        });
    }, [
        dispatchNavigationOptions, useQueryAPI,
        markRefIdShown, refId,
        onClose, onEnroll
    ]);

    const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
        if (onMessage) {
            onMessage(event);
        }

        const setSubscribed = () => {
            if (!!props.refId) {
                markRefIdShown(props.refId);
            }
        }

        const processed = processWebViewMessage(event, {
            api: props,
            ref: ref as RefObject<WebView>,
            navigation,
            dispatchMainButton,
            setLoaded,
            toaster,
            onEnroll,
            dispatchNavigationOptions,
            updateLocalStorageStatus,
            authContext,
            isTestnet,
            address,
            safelyOpenUrl,
            onClose,
            setSubscribed
        });

        if (processed) {
            return;
        }

        try {
            const parsed = JSON.parse(event.nativeEvent.data);
            const data = parsed.data;
            const id = parsed.id;

            // Execute
            (async () => {
                if (!!injectionEngine && !!ref) {
                    let res: { type: 'error', message: string } | { type: 'ok', data: any } = { type: 'error', message: 'Unknown error' };
                    try {
                        res = await injectionEngine.execute(data);
                    } catch {
                        warn('Failed to execute inject engine operation');
                    }
                    if (injectionEngine.name === 'tonhub-bridge') {
                        let data: (
                            {
                                type: 'error',
                                error: {
                                    code: number,
                                    message: string,
                                    data?: string
                                }
                            }
                            | {
                                type: 'success',
                                result: string
                            }
                        ) = {
                            type: 'error',
                            error: {
                                code: 100,
                                message: 'Unknown error'
                            }
                        }
                        if (res.type === 'ok') {
                            if (res.data.state === 'sent') {
                                data = {
                                    type: 'success',
                                    result: res.data.result
                                }
                            } else {
                                data = {
                                    type: 'error',
                                    error: {
                                        code: 300,
                                        message: 'Transaction rejected'
                                    }
                                }
                            }
                        }

                        dispatchTonhubBridgeResponse(ref as RefObject<WebView>, { id, data });
                    } else {
                        dispatchResponse(ref as RefObject<WebView>, { id, data: res });
                    }
                }
            })();
        } catch (error) {
            warn(`Failed to execute inject engine operation: ${error}`);
        }
    }, [
        navigation, toaster, authContext, isTestnet,
        useMainButton, useStatusBar, useToaster, useEmitter, useAuthApi, useWalletAPI, useDappClient, useSupportAPI,
        dispatchMainButton,
        dispatchNavigationOptions,
        setLoaded, onMessage, onClose, onEnroll, safelyOpenUrl, updateLocalStorageStatus, markRefIdShown
    ]);

    const onHardwareBackPress = useCallback(() => {
        if (navigationOptions.backPolicy === 'lock') {
            return true;
        }
        if (navigationOptions.backPolicy === 'back') {
            (ref as RefObject<WebView>)?.current?.goBack();
            return true;
        }
        if (navigationOptions.backPolicy === 'close') {
            if (loaded) {
                onClose?.();
                navigation.goBack();
                return true;
            } else {
                // if WebView is in initial loading state we need to wait for it to 
                // be loaded because fast going back on Android will lead to bugs
                return true;
            }
        }
        return false;
    }, [navigationOptions.backPolicy, onClose, loaded]);

    useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
        return () => {
            BackHandler.removeEventListener('hardwareBackPress', onHardwareBackPress);
        }
    }, [onHardwareBackPress]);

    const onErrorComponentReload = useCallback(() => {
        if (!!onContentProcessDidTerminate) {
            onContentProcessDidTerminate();
            return;
        }

        if (!!ref) {
            (ref as RefObject<WebView>).current?.reload();
        }

    }, [onContentProcessDidTerminate, ref]);

    const _injectedJavaScriptBeforeContentLoaded = useMemo(() => {

        const adjustedSafeArea = Platform.select({
            ios: safeArea,
            android: { ...safeArea, bottom: 16 }
        }) as EdgeInsets;

        return `
        ${useMainButton ? mainButtonAPI : ''}
        ${useStatusBar ? statusBarAPI({ ...adjustedSafeArea, ...defaultSafeArea }) : ''}
        ${useToaster ? toasterAPI : ''}
        ${useEmitter ? emitterAPI : ''}
        ${useAuthApi ? authAPI({
            lastAuthTime: getLastAuthTimestamp(),
            isSecured: getLockAppWithAuthState()
        }) : ''}
        ${useWalletAPI ? dappWalletAPI : ''}
        ${useDappClient ? dappClientAPI : ''}
        ${useSupportAPI ? supportAPI : ''}
        ${injectedJavaScriptBeforeContentLoaded ?? ''}
        (() => {
            if (!window.tonhub) {
                window['tonhub'] = (() => {
                    const obj = {};
                    Object.freeze(obj);
                    return obj;
                })();
            }
        })();
        true;
        `
    }, [
        injectedJavaScriptBeforeContentLoaded,
        useMainButton, useStatusBar, useToaster, useEmitter, useAuthApi, useWalletAPI, useDappClient, useSupportAPI,
        safeArea, defaultSafeArea
    ]);

    const _onContentProcessDidTerminate = useCallback(() => {
        // show custom loader (it will be dismissed with onLoadEnd)
        setLoaded(false);
        dispatchMainButton({ type: 'hide' });
        onContentProcessDidTerminate?.();
    }, [onContentProcessDidTerminate]);

    const onLoadEnd = useCallback(() => {
        if (props.useEmitter) {
            return;
        }
        try {
            const powerState = DeviceInfo.getPowerStateSync();
            const biggerDelay = powerState.lowPowerMode || (powerState.batteryLevel ?? 0) <= 0.2;
            setTimeout(() => setLoaded(true), biggerDelay ? 300 : 200);
        } catch {
            setTimeout(() => setLoaded(true), 200);
        }
    }, []);

    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.backgroundPrimary,
            // add padding for status bar if content shoudln't be under it
            paddingTop: useStatusBar ? undefined : safeArea.top
        }}>
            {shouldShowHeaderNavigation && (
                <Animated.View
                    entering={FadeInDown}
                    exiting={FadeOutDown}
                    style={{ height: 88 }}
                >
                    <ScreenHeader
                        style={{ paddingTop: 32, paddingHorizontal: 16 }}
                        onBackPressed={() => {
                            if (!!ref) {
                                (ref as RefObject<WebView>).current?.goBack();
                            }
                        }}
                    />
                </Animated.View>
            )}
            <WebView
                ref={ref}
                style={[
                    {
                        backgroundColor: theme.surfaceOnBg,
                        flexGrow: 1, flexBasis: 0, height: '100%',
                        alignSelf: 'stretch'
                    },
                    Platform.select({ android: { marginTop: 8 } })
                ]}
                injectedJavaScript={checkLocalStorageScript}
                startInLoadingState={true}
                autoManageStatusBarEnabled={false}
                allowFileAccessFromFileURLs={false}
                allowUniversalAccessFromFileURLs={false}
                decelerationRate={'normal'}
                allowsInlineMediaPlayback={true}
                keyboardDisplayRequiresUserAction={false}
                bounces={false}
                contentInset={{ top: 0, bottom: 0 }}
                scrollEnabled={!navigationOptions.lockScroll}
                //
                // Passed down props
                //
                {...props}

                //
                // Overriding passed props
                //
                onLoadProgress={(event) => {
                    if (Platform.OS === 'android' && event.nativeEvent.progress === 1) {
                        // Searching for supported query
                        onNavigation(event.nativeEvent.url);
                    }
                }}
                onNavigationStateChange={(event: WebViewNavigation) => {
                    console.log('onNavigationStateChange', event.url);
                    setCurrentUrl(event.url);
                    onNavigationStateChange?.(event);
                    // Searching for supported query
                    onNavigation(event.url);
                }}
                onLoadEnd={onLoadEnd}
                injectedJavaScriptBeforeContentLoaded={_injectedJavaScriptBeforeContentLoaded}
                // In case of iOS blank WebView
                onContentProcessDidTerminate={_onContentProcessDidTerminate}
                // In case of Android blank WebView
                onRenderProcessGone={_onContentProcessDidTerminate}
                onMessage={handleWebViewMessage}
                renderError={(errorDomain, errorCode, errorDesc) => {
                    return (
                        <WebViewErrorComponent
                            onReload={onErrorComponentReload}
                            errorDomain={errorDomain}
                            errorCode={errorCode}
                            errorDesc={errorDesc}
                        />
                    )
                }}
                setSupportMultipleWindows={false}
                hideKeyboardAccessoryView={!navigationOptions.showKAV}
            />
            <KeyboardAvoidingView
                style={{ position: 'absolute', bottom: safeArea.bottom, left: 0, right: 0 }}
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                pointerEvents={mainButton.isVisible ? undefined : 'none'}
                contentContainerStyle={{
                    marginHorizontal: 16,
                    marginBottom: 16
                }}
            >
                {mainButton && mainButton.isVisible && (
                    <Animated.View
                        style={Platform.select({ android: { marginHorizontal: 16, marginBottom: 16 } })}
                        entering={FadeInDown}
                        exiting={FadeOutDown.duration(100)}
                    >
                        <DappMainButton {...mainButton} />
                    </Animated.View>
                )}
            </KeyboardAvoidingView>
            {!!loader ? loader({ loaded }) : <WebViewLoader loaded={loaded} />}
        </View>
    );
}));
