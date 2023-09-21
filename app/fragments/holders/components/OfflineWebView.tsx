import React, { ForwardedRef, forwardRef, memo, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import WebView, { WebViewProps } from "react-native-webview";

export type AWebViewRef = {
    injectJavaScript: (script: string) => void;
    reload: () => void;
    goBack: () => void;
}

export const OfflineWebView = memo(forwardRef((
    props: Omit<WebViewProps, "source">
        & {
            uri: string,
            baseUrl: string,
            initialRoute?: string,
            queryParams?: string,
        },
    ref: ForwardedRef<AWebViewRef>
) => {
    const tref = useRef<WebView>(null);
    useImperativeHandle(ref, () => ({
        injectJavaScript: (script: string) => {
            tref.current!.injectJavaScript(script);
        },
        reload: () => {
            tref.current!.reload();
        },
        goBack: () => {
            tref.current!.goBack();
        }
    }));

    const [renderedOnce, setRenderedOnce] = useState(false);

    const injectedJavaScriptBeforeContentLoaded = React.useMemo(() => {
        if (props.initialRoute) {
            return `
            window.initialRoute = '${props.initialRoute}';
            ${props.injectedJavaScriptBeforeContentLoaded ?? ''}
            `;
        }
        return props.injectedJavaScriptBeforeContentLoaded;
    }, []);

    const uri = useMemo(() => {
        if (props.queryParams) {
            return `${props.uri}?${props.queryParams}`;
        }
        return props.uri;
    }, [props.uri, props.queryParams]);

    return (
        <>
            {Platform.OS === 'android' ? (
                <WebView
                    ref={tref}
                    {...props}
                    source={renderedOnce ? { // some wierd android bug with file:// protocol
                        uri: uri,
                        baseUrl: props.baseUrl,
                    } : undefined}
                    onLoad={(e) => {
                        setRenderedOnce(true);
                        if (props.onLoad) {
                            props.onLoad(e);
                        }
                    }}
                    allowFileAccess={true}
                    allowFileAccessFromFileURLs={true}
                    allowUniversalAccessFromFileURLs={true}
                    startInLoadingState={true}
                    originWhitelist={['*']}
                    allowingReadAccessToURL={props.baseUrl}
                    onShouldStartLoadWithRequest={(e) => {
                        if (props.onShouldStartLoadWithRequest && renderedOnce) {
                            return props.onShouldStartLoadWithRequest(e);
                        }
                        return true;
                    }}
                    injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
                />
            ) : (
                Platform.OS === 'ios' && (
                    <WebView
                        ref={tref}
                        {...props}
                        source={{
                            uri: uri,
                            baseUrl: props.baseUrl,
                        }}
                        onLoad={(e) => {
                            if (props.onLoad) {
                                props.onLoad(e);
                            }
                        }}
                        allowFileAccess={true}
                        allowFileAccessFromFileURLs={true}
                        allowUniversalAccessFromFileURLs={true}
                        originWhitelist={['*']}
                        allowingReadAccessToURL={props.baseUrl}
                        onShouldStartLoadWithRequest={(e) => {
                            if (e.url.indexOf(props.baseUrl) !== -1) {
                                return true;
                            }
                            if (props.onShouldStartLoadWithRequest) {
                                return props.onShouldStartLoadWithRequest(e);
                            }
                            return true;
                        }}
                        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
                    />
                )
            )}
        </>
    );
}));