import { memo } from "react";
import { View } from "react-native";
import WebView from "react-native-webview";

export const WebViewPreloader = memo(({ url }: { url: string }) => {
    return (
        <View
            style={{ height: 0, width: 0, opacity: 0 }}
            pointerEvents={"none"}
        >
            <WebView source={{ uri: url }} />
        </View>
    );
});