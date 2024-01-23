import { ForwardedRef, RefObject, forwardRef, memo, useCallback, useMemo, useReducer, useState } from "react";
import { KeyboardAvoidingView, Platform, View, StyleSheet, ActivityIndicator } from "react-native";
import WebView, { WebViewMessageEvent, WebViewProps } from "react-native-webview";
import { useTheme } from "../../engine/hooks";
import { WebViewErrorComponent } from "./WebViewErrorComponent";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useKeyboard } from "@react-native-community/hooks";
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

export type DAppWebviewProps = WebViewProps & {
    useMainButton?: boolean;
    useStatusBar?: boolean;
    useToaster?: boolean;
    injectionEngine?: InjectEngine;
    onContentProcessDidTerminate?: () => void;
    loader?: (props: WebViewLoaderProps<{}>) => JSX.Element;
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

export const DAppWebview = memo(forwardRef((props: DAppWebviewProps, ref: ForwardedRef<WebView>) => {
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const keyboard = useKeyboard();
    const bottomMargin = (safeArea.bottom || 32);
    const toaster = useToaster();

    const [loaded, setLoaded] = useState(false);

    const keyboardVerticalOffset = useMemo(() => {
        return Platform.select({ ios: bottomMargin + (keyboard.keyboardShown ? 32 : 0) });
    }, [keyboard.keyboardShown, bottomMargin]);

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
            if (props.useStatusBar) {
                processed = processStatusBarMessage(
                    parsed,
                    setStatusBarStyle,
                    setStatusBarBackgroundColor
                );
            }

            // Toaster API
            if (props.useToaster) {
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
                if (
                    pageDomain.endsWith('tonsandbox.com')
                    || pageDomain.endsWith('tonwhales.com')
                    || pageDomain.endsWith('tontestnet.com')
                    || pageDomain.endsWith('tonhub.com')
                ) {
                    openWithInApp(data.args.url);
                    return;
                }
            } catch {
                warn('Failed to open url');
            }
        }

        // Basic close app
        if (data.name === 'closeApp') {
            navigation.goBack();
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
    }, [props.useMainButton, props.useStatusBar, props.injectionEngine, props.onMessage, ref, navigation]);

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
        true;
        `
    }, [props.injectedJavaScriptBeforeContentLoaded, props.useMainButton, props.useStatusBar, props.useToaster, safeArea]);

    const Loader = props.loader ?? WebViewLoader;

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
                //
                // Passed down props
                //
                {...props}

                //
                // Overriding passed props
                //
                onLoadEnd={() => setTimeout(() => setLoaded(true), 300)}
                injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
                // In case of iOS blank WebView
                onContentProcessDidTerminate={props.onContentProcessDidTerminate}
                // In case of Android blank WebView
                onRenderProcessGone={props.onContentProcessDidTerminate}
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
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                pointerEvents={mainButton.isVisible ? undefined : 'none'}
                contentContainerStyle={{ marginHorizontal: 16, marginBottom: !mainButton.isVisible ? 86 : 0 }}
                keyboardVerticalOffset={keyboardVerticalOffset}
            >
                {mainButton && mainButton.isVisible && (
                    <Animated.View
                        style={Platform.OS === 'android'
                            ? { marginHorizontal: 16, marginBottom: 16 }
                            : { marginBottom: 32 }
                        }
                        entering={FadeInDown}
                        exiting={FadeOutDown}
                    >
                        <DappMainButton {...mainButton} />
                    </Animated.View>
                )}
            </KeyboardAvoidingView>
            <Loader loaded={loaded} />
        </View>
    );
}));