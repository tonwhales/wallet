import React, { useState } from "react";
import { Platform } from "react-native";
import WebView, { WebViewProps } from "react-native-webview";
import { OfflineErrorComponent } from "./OfflineErrorComponent";

export type AWebViewRef = {
    injectJavaScript: (script: string) => void;
    reload: () => void;
    goBack: () => void;
}

export const OfflineWebView = React.memo(React.forwardRef((
    props: Omit<WebViewProps, "source">
        & {
            uri: string,
            baseUrl: string,
            initialRoute?: string
        },
    ref: React.ForwardedRef<AWebViewRef>
) => {
    const tref = React.useRef<WebView>(null);
    React.useImperativeHandle(ref, () => ({
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

    return (
        <>
            {Platform.OS === 'android' && (
                <WebView
                    ref={tref}
                    {...props}
                    source={renderedOnce ? { // some wierd android bug with file:// protocol
                        uri: props.uri,
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
            )}
            {Platform.OS === 'ios' && (
                <WebView
                    ref={tref}
                    {...props}
                    source={{
                        uri: props.uri,
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
            )}
        </>
    );
}));

OfflineWebView.displayName = 'OfflineWebView';