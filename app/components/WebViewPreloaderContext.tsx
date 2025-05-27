import { createContext, useContext, FC, ReactNode, useRef } from "react";
import { View } from "react-native";
import WebView from "react-native-webview";
import { useNetwork } from "../engine/hooks";
import { holdersUrl } from "../engine/api/holders/fetchUserState";

interface WebViewPreloaderContextType {
    clearWebViewLocalStorage: () => void;
}

export const WebViewPreloaderContext = createContext<WebViewPreloaderContextType | null>(null);

export const useWebViewPreloader = () => {
    const context = useContext(WebViewPreloaderContext);
    if (!context) {
        throw new Error("useWebViewPreloader must be used inside WebViewPreloaderProvider");
    }

    return context;
};

interface WebViewPreloaderProviderProps {
    children: ReactNode;
}

export const WebViewPreloaderProvider = ({ 
    children, 
}: WebViewPreloaderProviderProps) => {
    const webViewRef = useRef<WebView | null>(null);

    const { isTestnet } = useNetwork();

    const clearWebViewLocalStorage = () => {
        webViewRef.current?.injectJavaScript('localStorage.clear(); true;');
    };

    return (
        <WebViewPreloaderContext.Provider value={{ clearWebViewLocalStorage }}>
            {children}
            <View
                style={{ height: 0, width: 0, opacity: 0 }}
                pointerEvents={"none"}
            >
                <WebView 
                    ref={webViewRef}
                    source={{ uri: holdersUrl(isTestnet) }}
                />
            </View>
        </WebViewPreloaderContext.Provider>
    );
}; 