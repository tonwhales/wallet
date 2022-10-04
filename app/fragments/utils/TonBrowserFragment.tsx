import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { systemFragment } from "../../systemFragment";
import { useRoute } from "@react-navigation/native";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { CloseButton } from "../../components/CloseButton";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import axios from "axios";

export const TonBrowserFragment = systemFragment(() => {
    const params: { url?: string } = useRoute().params! as any;
    const [source, setSource] = useState<string>();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    useEffect(() => {
        (async () => {
        })()
    }, []);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            paddingBottom: safeArea.bottom,
        }}>
            <AndroidToolbar />
            <WebView
                source={source ? { html: source } : undefined}
                renderLoading={() => <LoadingIndicator />}
            />
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    );
});