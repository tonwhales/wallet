import { ForwardedRef, RefObject, forwardRef, memo, useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { KeyboardAvoidingView, Platform, View, StyleSheet, ActivityIndicator, BackHandler } from "react-native";
import WebView, { WebViewMessageEvent, WebViewNavigation, WebViewProps } from "react-native-webview";
import { useTheme } from "../../engine/hooks";
import { WebViewErrorComponent } from "./WebViewErrorComponent";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DappMainButton, processMainButtonMessage, reduceMainButton } from "../DappMainButton";
import Animated, { FadeInDown, FadeOut, FadeOutDown } from "react-native-reanimated";
import { dispatchMainButtonResponse, dispatchResponse, mainButtonAPI, statusBarAPI, toasterAPI } from "../../fragments/apps/components/inject/createInjectSource";
import { warn } from "../../utils/log";
import { extractDomain } from "../../engine/utils/extractDomain";
import { openWithInApp } from "../../utils/openWithInApp";
import { InjectEngine } from "../../fragments/apps/components/inject/InjectEngine";
import { processStatusBarMessage } from "./utils/processStatusBarMessage";
import { setStatusBarBackgroundColor, setStatusBarStyle } from "expo-status-bar";
import { processToasterMessage, useToaster } from "../toast/ToastProvider";
import { QueryParamsState, extractWebViewQueryAPIParams } from "./utils/extractWebViewQueryAPIParams";
import { useMarkBannerHidden } from "../../engine/hooks/banners/useHiddenBanners";
import { isSafeDomain } from "./utils/isSafeDomain";
import DeviceInfo from 'react-native-device-info';

export type DAppWebViewProps = WebViewProps & {
    useMainButton?: boolean;
    useStatusBar?: boolean;
    useToaster?: boolean;
    useQueryAPI?: boolean;
    injectionEngine?: InjectEngine;
    onContentProcessDidTerminate?: () => void;
    onClose?: () => void;
    loader?: (props: WebViewLoaderProps<{}>) => JSX.Element;
    refId?: string;
    defaultQueryParamsState?: QueryParamsState;
    onEnroll?: () => void;
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
            <ActivityIndicator size="large" color={theme.accent} />
        </Animated.View>
    );
};

export const DAppWebView = memo(forwardRef((props: DAppWebViewProps, ref: ForwardedRef<WebView>) => {
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const toaster = useToaster();
    const markRefIdShown = useMarkBannerHidden();

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

    const [queryAPIParams, setQueryAPIParams] = useState<QueryParamsState>(
        props.defaultQueryParamsState ?? {
            backPolicy: 'back',
            showKeyboardAccessoryView: false,
            lockScroll: false
        }
    );

    const safelyOpenUrl = useCallback((url: string) => {
        try {
            let pageDomain = extractDomain(url);
            if (isSafeDomain(pageDomain)) {
                openWithInApp(url);
                return;
            }
        } catch { }
    }, []);

    const onNavigation = useCallback((url: string) => {
        if (!props.useQueryAPI) {
            return;
        }
        const params = extractWebViewQueryAPIParams(url);

        if ((params.markAsShown || params.subscribed) && !!props.refId) {
            markRefIdShown(props.refId);
        }

        if (params.closeApp) {
            props.onClose?.();
            navigation.goBack();
            return;
        }

        if (params.openEnrollment) {
            props.onEnroll?.();
            return;
        }

        setQueryAPIParams((prev) => {
            const newValue = {
                ...prev,
                ...Object.fromEntries(
                    Object.entries(params).filter(([, value]) => value !== undefined)
                )
            }
            return newValue;
        });

        if (!!params.openUrl) {
            safelyOpenUrl(params.openUrl);
        }
    }, [
        setQueryAPIParams, props.useQueryAPI,
        markRefIdShown, props.refId,
        props.onClose, props.onEnroll
    ]);

    const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
        if (props.onMessage) {
            props.onMessage(event);
            return;
        }
        const nativeEvent = event.nativeEvent;

        // Resolve parameters
        let data: any;
        let id: number;
        try {
            let parsed = JSON.parse(nativeEvent.data);
            let processed = false;

            // Main button API
            if (props.useMainButton && ref) {
                processed = processMainButtonMessage(
                    parsed,
                    dispatchMainButton,
                    dispatchMainButtonResponse,
                    ref as RefObject<WebView>
                );
            }

            // Header StatusBar API
            if (props.useStatusBar && !processed) {
                processed = processStatusBarMessage(
                    parsed,
                    setStatusBarStyle,
                    setStatusBarBackgroundColor
                );
            }

            // Toaster API
            if (props.useToaster && !processed) {
                processed = processToasterMessage(parsed, toaster);
            }

            if (processed) {
                return;
            }

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

        // Basic open url
        if (data.name === 'openUrl' && data.args.url) {
            try {
                let pageDomain = extractDomain(data.args.url);
                if (isSafeDomain(pageDomain)) {
                    openWithInApp(data.args.url);
                    return;
                }
            } catch {
                warn('Failed to open url');
                return;
            }
        }

        // Basic close app
        if (data.name === 'closeApp') {
            props.onClose?.();
            navigation.goBack();
            return;
        }

        if (data.name === 'openEnrollment') {
            props.onEnroll?.();
            return;
        }

        // Execute
        (async () => {
            if (!!props.injectionEngine && !!ref) {
                let res = { type: 'error', message: 'Unknown error' };
                try {
                    res = await props.injectionEngine.execute(data);
                } catch {
                    warn('Failed to execute inject engine operation');
                }
                dispatchResponse(ref as RefObject<WebView>, { id, data: res });
            }
        })();
    }, [
        props.useMainButton, props.useStatusBar, props.injectionEngine,
        props.onMessage,
        ref,
        navigation, toaster,
        props.onClose, props.onEnroll,
    ]);

    const onHardwareBackPress = useCallback(() => {
        if (queryAPIParams.backPolicy === 'lock') {
            return true;
        }
        if (queryAPIParams.backPolicy === 'back') {
            if (!!ref) {
                (ref as RefObject<WebView>)?.current?.goBack();
            }
            return true;
        }
        if (queryAPIParams.backPolicy === 'close') {
            props.onClose?.();
            navigation.goBack();
            return true;
        }
        return false;
    }, [queryAPIParams.backPolicy, props.onClose]);

    useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
        return () => {
            BackHandler.removeEventListener('hardwareBackPress', onHardwareBackPress);
        }
    }, [onHardwareBackPress]);

    const onErrorComponentReload = useCallback(() => {
        if (!!props.onContentProcessDidTerminate) {
            props.onContentProcessDidTerminate();
            return;
        }

        if (!!ref) {
            (ref as RefObject<WebView>).current?.reload();
        }

    }, [props.onContentProcessDidTerminate, ref]);

    const injectedJavaScriptBeforeContentLoaded = useMemo(() => {
        return `
        ${props.useMainButton ? mainButtonAPI : ''}
        ${props.useStatusBar ? statusBarAPI(safeArea) : ''}
        ${props.useToaster ? toasterAPI : ''}
        ${props.injectedJavaScriptBeforeContentLoaded ?? ''}
        window['tonhub'] = (() => {
            const obj = {};
            Object.freeze(obj);
            return obj;
        })();
        true;
        `
    }, [props.injectedJavaScriptBeforeContentLoaded, props.useMainButton, props.useStatusBar, props.useToaster, safeArea]);

    const Loader = props.loader ?? WebViewLoader;

    const onContentProcessDidTerminate = useCallback(() => {
        dispatchMainButton({ type: 'hide' });
        props.onContentProcessDidTerminate?.();
    }, [props.onContentProcessDidTerminate]);

    const onLoadEnd = useCallback(() => {
        try {
            const powerState = DeviceInfo.getPowerStateSync();
            const biggerDelay = powerState.lowPowerMode || (powerState.batteryLevel ?? 0) <= 0.2;
            setTimeout(() => setLoaded(true), biggerDelay ? 180 : 100);
        } catch {
            setTimeout(() => setLoaded(true), 100);
        }
    }, []);

    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.backgroundPrimary,
            // add padding for status bar if content shoudln't be under it
            paddingTop: props.useStatusBar ? undefined : safeArea.top
        }}>
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
                startInLoadingState={true}
                autoManageStatusBarEnabled={false}
                allowFileAccessFromFileURLs={false}
                allowUniversalAccessFromFileURLs={false}
                decelerationRate={'normal'}
                allowsInlineMediaPlayback={true}
                keyboardDisplayRequiresUserAction={false}
                bounces={false}
                contentInset={{ top: 0, bottom: 0 }}
                scrollEnabled={!queryAPIParams.lockScroll}
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
                    // Searching for supported query
                    onNavigation(event.url);
                }}
                onLoadEnd={onLoadEnd}
                injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
                // In case of iOS blank WebView
                onContentProcessDidTerminate={onContentProcessDidTerminate}
                // In case of Android blank WebView
                onRenderProcessGone={onContentProcessDidTerminate}
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
            <Loader loaded={loaded} />
        </View>
    );
}));
