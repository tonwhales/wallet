import React from "react";
import { View } from "react-native";
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { systemFragment } from "../../systemFragment";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { ScreenHeader } from "../../components/ScreenHeader";

export const PrivacyFragment = systemFragment(() => {
    const safeArea = useSafeAreaInsets();
    const { Theme } = useAppConfig();
    const navigation = useTypedNavigation();

    return (
        <View style={{
            flex: 1,
            paddingTop: safeArea.top,
            backgroundColor: Theme.background,
        }}>
            <ScreenHeader
                onBackPressed={navigation.goBack}
                statusBarStyle={Theme.style === 'dark' ? 'light' : 'dark'}
                style={{ paddingLeft: 16 }}
            />
            <WebView source={{ uri: 'https://tonhub.com/legal/privacy' }} />
        </View>
    );
});