import { ForwardedRef, RefObject, forwardRef, memo, useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { KeyboardAvoidingView, Platform, View, StyleSheet, ActivityIndicator, BackHandler, Linking } from "react-native";
import WebView, { WebViewMessageEvent, WebViewNavigation, WebViewProps } from "react-native-webview";
import { useNetwork, useTheme } from "../../engine/hooks";
import { WebViewErrorComponent } from "./WebViewErrorComponent";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";
import { DappMainButton, processMainButtonMessage, reduceMainButton } from "../DappMainButton";
import Animated, { FadeInDown, FadeOut, FadeOutDown } from "react-native-reanimated";
import { authAPI, dappWalletAPI, dispatchAuthResponse, dispatchLastAuthTimeResponse, dispatchLockAppWithAuthResponse, dispatchMainButtonResponse, dispatchResponse, dispatchTonhubBridgeResponse, dispatchWalletResponse, emitterAPI, mainButtonAPI, statusBarAPI, toasterAPI } from "../../fragments/apps/components/inject/createInjectSource";
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
import { processEmitterMessage } from "./utils/processEmitterMessage";
import { getLastAuthTimestamp, useKeysAuth } from "../secure/AuthWalletKeys";
import { getLockAppWithAuthState } from "../../engine/state/lockAppWithAuthState";
import WalletService, { addCardRequestSchema } from "../../modules/WalletService";
import { getHoldersToken } from "../../engine/hooks/holders/useHoldersAccountStatus";
import { getCurrentAddress } from "../../storage/appState";
import { WebViewSourceUri } from "react-native-webview/lib/WebViewTypes";
import { holdersUrl } from "../../engine/api/holders/fetchUserState";

export type DAppWebViewProps = WebViewProps & {
    useMainButton?: boolean;
    useStatusBar?: boolean;
    useToaster?: boolean;
    useAuthApi?: boolean;
    useEmitter?: boolean;
    useQueryAPI?: boolean;
    useWalletAPI?: boolean;
    injectionEngine?: InjectEngine;
    onContentProcessDidTerminate?: () => void;
    onClose?: () => void;
    loader?: (props: WebViewLoaderProps<{}>) => JSX.Element;
    refId?: string;
    defaultQueryParamsState?: QueryParamsState;
    onEnroll?: () => void;
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
    const safeArea = useSafeAreaInsets();
    const authContext = useKeysAuth();
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
            const scheme = new URL(url).protocol.replace(':', '');
            const sourceUrl = (props.source as WebViewSourceUri)?.uri;

            if (
                scheme === 'tg'
                && !!sourceUrl
                && sourceUrl.startsWith(holdersUrl(isTestnet))
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
    }, [props.source]);

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
        }
        const nativeEvent = event.nativeEvent;

        // Resolve parameters
        let data: any;
        let id: number;
        try {
            let parsed = JSON.parse(nativeEvent.data);
            let processed = false;

            if (!parsed?.data?.name) {
                return;
            }

            // Auth API
            if (props.useAuthApi && parsed.data.name.startsWith('auth')) {
                const method = parsed.data.name.split('.')[1];

                if (method === 'getLastAuthTime') {
                    dispatchLastAuthTimeResponse(ref as RefObject<WebView>, getLastAuthTimestamp() || 0);
                } else if (method === 'authenticate') {
                    (async () => {
                        let isAuthenticated = false;
                        let lastAuthTime: number | undefined;
                        // wait for auth to complete
                        try {
                            await authContext.authenticate({ cancelable: true, paddingTop: 32 });
                            isAuthenticated = true;
                            lastAuthTime = getLastAuthTimestamp();
                        } catch {
                            warn('Failed to authenticate');
                        }
                        // Dispatch response
                        dispatchAuthResponse(ref as RefObject<WebView>, { isAuthenticated, lastAuthTime });
                    })();
                } else if (method === 'lockAppWithAuth') {
                    const callback = (isSecured: boolean) => {
                        const lastAuthTime = getLastAuthTimestamp();
                        dispatchLockAppWithAuthResponse(ref as RefObject<WebView>, { isSecured, lastAuthTime });
                    }
                    navigation.navigateMandatoryAuthSetup({ callback });
                }

                return;
            }

            // Wallet API
            if (props.useWalletAPI && parsed.data.name.startsWith('wallet.')) {
                if (Platform.OS !== 'ios') {
                    warn('Wallet API is only available on iOS');
                    return;
                }
                const method = parsed.data.name.split('.')[1] as 'isEnabled' | 'checkIfCardIsAlreadyAdded' | 'canAddCard' | 'addCardToWallet';

                switch (method) {
                    case 'isEnabled':
                        (async () => {
                            try {
                                const result = await WalletService.isEnabled();
                                dispatchWalletResponse(ref as RefObject<WebView>, { result });
                            } catch {
                                warn('Failed to check if wallet is enabled');
                                dispatchWalletResponse(ref as RefObject<WebView>, { result: false });
                            }
                        })();
                        break;
                    case 'checkIfCardIsAlreadyAdded':
                        const primaryAccountNumberSuffix = parsed.data.args.primaryAccountNumberSuffix;
                        if (!primaryAccountNumberSuffix) {
                            warn('Invalid primaryAccountNumberSuffix');
                            dispatchWalletResponse(ref as RefObject<WebView>, { result: false });
                            return;
                        }
                        (async () => {
                            try {
                                const result = await WalletService.checkIfCardIsAlreadyAdded(primaryAccountNumberSuffix);
                                dispatchWalletResponse(ref as RefObject<WebView>, { result });
                            } catch {
                                warn('Failed to check if card is already added');
                                dispatchWalletResponse(ref as RefObject<WebView>, { result: false });
                            }
                        })();
                        break;
                    case 'canAddCard':
                        const cardId = parsed.data.args.cardId;
                        if (!cardId) {
                            warn('Invalid cardId');
                            dispatchWalletResponse(ref as RefObject<WebView>, { result: false });
                            return;
                        }

                        (async () => {
                            try {
                                const result = await WalletService.canAddCard(cardId);
                                dispatchWalletResponse(ref as RefObject<WebView>, { result });
                            } catch (error) {
                                warn('Failed to check if card can be added');
                                // return true so that the user can try to add the card and get the error message on the native side
                                dispatchWalletResponse(ref as RefObject<WebView>, { result: true });
                            }
                        })();
                        break;
                    case 'addCardToWallet':
                        const request = addCardRequestSchema.safeParse(parsed.data.args);

                        if (!request.success) {
                            warn('Invalid addCardToWallet request');
                            dispatchWalletResponse(ref as RefObject<WebView>, { result: false });
                            return;
                        }

                        const token = getHoldersToken(getCurrentAddress().address.toString({ testOnly: isTestnet }));

                        if (!token) {
                            warn('User token not found');
                            dispatchWalletResponse(ref as RefObject<WebView>, { result: false });
                            return;
                        }

                        (async () => {
                            try {
                                const result = await WalletService.addCardToWallet({ ...request.data, token, isTestnet });
                                dispatchWalletResponse(ref as RefObject<WebView>, { result });
                            } catch {
                                warn('Failed to add card to wallet');
                                dispatchWalletResponse(ref as RefObject<WebView>, { result: false });
                            }
                        })();
                        break;
                }

                return;
            }

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

            if (props.useEmitter && !processed) {
                processed = processEmitterMessage(parsed, setLoaded);
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
                safelyOpenUrl(data.args.url);
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
                let res: { type: 'error', message: string } | { type: 'ok', data: any } = { type: 'error', message: 'Unknown error' };
                try {
                    res = await props.injectionEngine.execute(data);
                } catch {
                    warn('Failed to execute inject engine operation');
                }
                if (props.injectionEngine.name === 'tonhub-bridge') {
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
    }, [
        props.useMainButton, props.useStatusBar,
        props.useToaster, props.useEmitter,
        props.injectionEngine, props.useAuthApi,
        props.useWalletAPI,
        props.onMessage,
        ref,
        navigation, toaster,
        props.onClose, props.onEnroll
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

        const adjustedSafeArea = Platform.select({
            ios: safeArea,
            android: { ...safeArea, bottom: 16 }
        }) as EdgeInsets;

        return `
        ${props.useMainButton ? mainButtonAPI : ''}
        ${props.useStatusBar ? statusBarAPI({ ...adjustedSafeArea, ...props.defaultSafeArea }) : ''}
        ${props.useToaster ? toasterAPI : ''}
        ${props.useEmitter ? emitterAPI : ''}
        ${props.useAuthApi ? authAPI({
            lastAuthTime: getLastAuthTimestamp(),
            isSecured: getLockAppWithAuthState()
        }) : ''}
        ${props.useWalletAPI ? dappWalletAPI : ''}
        ${props.injectedJavaScriptBeforeContentLoaded ?? ''}
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
        props.injectedJavaScriptBeforeContentLoaded,
        props.useMainButton, props.useStatusBar, props.useToaster, props.useEmitter, props.useAuthApi,
        safeArea
    ]);

    const onContentProcessDidTerminate = useCallback(() => {
        // show custom loader (it will be dismissed with onLoadEnd)
        setLoaded(false);
        dispatchMainButton({ type: 'hide' });
        props.onContentProcessDidTerminate?.();
    }, [props.onContentProcessDidTerminate]);

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
            {!!props.loader ? props.loader({ loaded }) : <WebViewLoader loaded={loaded} />}
        </View>
    );
}));
