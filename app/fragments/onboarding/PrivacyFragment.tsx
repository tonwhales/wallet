import React from "react";
import { Platform, View } from "react-native";
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { fragment } from "../../fragment";
import { systemFragment } from "../../systemFragment";

export const PrivacyFragment = systemFragment(() => {
    const safeArea = useSafeAreaInsets();

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            paddingBottom: safeArea.bottom,
        }}>
            <AndroidToolbar />
            <WebView source={{ uri: 'https://tonhub.com/legal/privacy' }} />
        </View>
    );
});