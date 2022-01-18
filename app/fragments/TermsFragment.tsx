import React from "react";
import { Platform, View } from "react-native";
import { fragment } from "../fragment";
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../components/AndroidToolbar";

export const TermsFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            paddingBottom: safeArea.bottom,
        }}>
            <AndroidToolbar />
            <WebView
                source={{ uri: 'https://tonhub.com/legal/terms' }}
                onLoadEnd={(res) => console.log('[TermsFragment]', res)}
            />
        </View>
    );
});