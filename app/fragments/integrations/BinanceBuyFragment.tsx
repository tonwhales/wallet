import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Platform, Pressable, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { getCurrentAddress } from "../../storage/appState";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import Animated, { FadeOut } from "react-native-reanimated";
import { extractDomain } from "../../engine/utils/extractDomain";
import { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { useNetwork, useTheme } from '../../engine/hooks';

export const BinanceBuyFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();

    const params = useParams<{
        amount?: string,
        reverse?: string,
    }>();
    const address = getCurrentAddress();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const [loading, setloading] = useState(false);

    const wref = React.useRef<WebView>(null);

    const queryParams = useMemo(() => new URLSearchParams({
        address: address.address.toString({ testOnly: isTestnet }),
        // reverse: 'true',
        // amount: '100',
        ...params
    }), [params]);

    const main = `https://app-dev.mass-network.com?${queryParams.toString()}`;

    const loadWithRequest = useCallback((event: ShouldStartLoadRequest): boolean => {
        if (extractDomain(event.url) === extractDomain(main)) {
            return true;
        }

        // Open links in external browser
        Linking.openURL(event.url);
        return false;
    }, [main]);

    if (!isTestnet) {
        return (
            <View style={{
                flexGrow: 1,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Text style={{
                    color: theme.textPrimary
                }}>
                    {'Binance Pay service availible only on testnet'}
                </Text>
            </View>
        );
    }

    return (
        <View style={{
            flex: 1,
            backgroundColor: 'white',
            flexGrow: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <View style={{ width: '100%', flexDirection: 'row' }}>
                <View style={{ flexGrow: 1 }} />
                <Pressable
                    onPress={() => {
                        navigation.goBack();
                    }}
                    style={{
                        marginTop: Platform.OS === 'android' ? 22 + safeArea.top : 22,
                        marginBottom: 16,
                        marginRight: 16
                    }}
                >
                    <Text style={{ color: theme.accent, fontWeight: '500', fontSize: 17 }}>
                        {t('common.close')}
                    </Text>
                </Pressable>
            </View>
            <View style={{ flexGrow: 1 }}>
                <WebView
                    ref={wref}
                    source={{ uri: main }}
                    onLoadStart={() => setloading(true)}
                    onLoadEnd={() => setloading(false)}
                    autoManageStatusBarEnabled={false}
                    onShouldStartLoadWithRequest={loadWithRequest}
                />
                {loading && (
                    <Animated.View
                        style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'white',
                            justifyContent: 'center', alignItems: 'center'
                        }}
                        exiting={FadeOut}
                    >
                        <LoadingIndicator simple />
                    </Animated.View>
                )}
            </View>
        </View>
    );
})