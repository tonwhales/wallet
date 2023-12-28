import React from "react";
import { Platform, View } from "react-native";
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { systemFragment } from "../../systemFragment";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";

export const TermsFragment = systemFragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'ios' ? 32 : safeArea.top,
        }}>
            <ScreenHeader
                onClosePressed={() => navigation.goBack()}
                style={{ paddingBottom: 8 }}
                title={t('legal.termsOfService')}
            />
            <WebView
                source={{ uri: 'https://tonhub.com/legal/terms' }}
            />
        </View>
    );
});