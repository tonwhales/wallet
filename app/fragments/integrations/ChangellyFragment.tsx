import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { View, Text, Image, Platform, Pressable, Alert, BackHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useTheme } from '../../engine/hooks';
import { useNetwork } from "../../engine/hooks/network/useNetwork";
import { ScreenHeader } from "../../components/ScreenHeader";
import { StatusBar } from "expo-status-bar";
import { trackScreen } from "../../analytics/mixpanel";
import { ConfirmLegal } from "../../components/ConfirmLegal";
import { sharedStoragePersistence } from "../../storage/storage";
import ChangellyLogo from '../../../assets/changelly.svg';
import { CHANGELLY_PRIVACY_URL, CHANGELLY_TERMS_URL, CHANGELLY_WIDGET_URL } from "../../utils/constants";

const skipLegalChangelly = 'skip_legal_changelly';

export const ChangellyFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();

    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const [accepted, setAccepted] = useState(sharedStoragePersistence.getBoolean(skipLegalChangelly));
    const [loading, setloading] = useState(false);
    const webViewRef = useRef<WebView>(null);
    const [canGoBack, setCanGoBack] = useState(false);

    const queryParams = useMemo(() => new URLSearchParams({
        amount: '11',
        fromDefault: 'ton',
        toDefault: 'usdton',
        merchant_id: 'C3kymBmF0quwHMoK',
        v: '3'
    }), []);

    const main = `${CHANGELLY_WIDGET_URL}?${queryParams.toString()}`;

    const onOpenBuy = useCallback(() => {
        setAccepted(true);
    }, []);

    const handleBackPress = useCallback(() => {
        if (canGoBack) {
            webViewRef.current?.goBack();
            return true;
        }
        return false;
    }, [canGoBack]);

    useEffect(() => {
        if (Platform.OS === 'android') {
            const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
            return () => backHandler.remove();
        }
    }, [handleBackPress]);

    if (isTestnet) {
        return (
            <View style={{
                flexGrow: 1,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Text style={{
                    color: theme.textPrimary
                }}>
                    {'Changelly service availible only on mainnet'}
                </Text>
            </View>
        );
    }

    return (
        <View style={{
            flexGrow: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark', ios: 'light' })} />
            {!accepted ? (
                <>
                    <ScreenHeader onClosePressed={navigation.goBack} title={'Changelly'} />
                    <ConfirmLegal
                        onConfirmed={onOpenBuy}
                        skipKey={skipLegalChangelly}
                        title={t('changelly.title')}
                        description={t('changelly.description')}
                        termsAndPrivacy={t('swap.termsAndPrivacy')}
                        privacyUrl={CHANGELLY_PRIVACY_URL}
                        termsUrl={CHANGELLY_TERMS_URL}
                        dontShowTitle={t('changelly.dontShowTitle')}
                        iconSvg={<ChangellyLogo />}
                    />
                </>
            ) : (
                <View style={{ flexGrow: 1 }}>
                    <WebView
                        ref={webViewRef}
                        source={{ uri: main }}
                        onLoadStart={() => setloading(true)}
                        onLoadEnd={() => setloading(false)}
                        onNavigationStateChange={(navState) => {
                            setCanGoBack(navState.canGoBack);
                        }}
                        setSupportMultipleWindows={false}
                    />
                    {loading && (
                        <LoadingIndicator
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                            simple
                        />
                    )}
                    <Pressable
                        style={{
                            position: 'absolute',
                            top: Platform.OS === 'android' ? 16 : 16,
                            right: 16
                        }}
                        onPress={() => {
                            Alert.alert(t('neocrypto.confirm.title'), t('neocrypto.confirm.message'), [{
                                text: t('common.close'),
                                style: 'destructive',
                                onPress: () => {
                                    navigation.goBack();
                                }
                            }, {
                                text: t('common.cancel'),
                            }]);
                        }}
                    >
                        <Image
                            source={require('@assets/ic_close.png')}
                            style={{ height: 34, width: 34 }}
                        />
                    </Pressable>
                </View>
            )}
        </View>
    );
})