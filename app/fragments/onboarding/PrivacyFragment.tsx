import React from "react";
import { Platform, View } from "react-native";
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { systemFragment } from "../../systemFragment";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../../engine/hooks";

export const PrivacyFragment = systemFragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const theme = useTheme();

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'ios' ? 32 : safeArea.top,
        }}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
            <ScreenHeader
                onClosePressed={() => navigation.goBack()}
                style={{ paddingBottom: 8 }}
                title={t('legal.privacyPolicy')}
            />
            <WebView source={{ uri: 'https://tonhub.com/legal/privacy' }} />
        </View>
    );
});