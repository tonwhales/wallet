import React from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { AppConfig } from "../../AppConfig";
import { fragment } from "../../fragment";
import { AndroidToolbar } from "../AndroidToolbar";

export const StakingWebPage = fragment(() => {
    const safeArea = useSafeAreaInsets();

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            paddingBottom: safeArea.bottom,
        }}>
            <AndroidToolbar />
            <WebView source={{ uri: AppConfig.isTestnet ? 'https://test.tonwhales.com/staking' : 'https://tonwhales.com/staking' }} />
        </View>
    );
})