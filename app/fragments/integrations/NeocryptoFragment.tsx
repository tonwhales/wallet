import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Image, Platform, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { getCurrentAddress } from "../../storage/appState";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useBounceableWalletFormat, useTheme } from '../../engine/hooks';
import { useNetwork } from "../../engine/hooks/network/useNetwork";
import { ScreenHeader } from "../../components/ScreenHeader";
import { StatusBar } from "expo-status-bar";
import { ConfirmLegal } from "../../components/ConfirmLegal";
import { sharedStoragePersistence } from "../../storage/storage";

const skipLegalNeocrypto = 'skip_legal_neocrypto';
const logo = require('../../../assets/known/neocrypto_logo.png');

export const NeocryptoFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();

    const params = useParams<{
        amount?: string,
        fix_amount?: 'true' | 'false'
    }>();
    const address = getCurrentAddress();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const [accepted, setAccepted] = useState(sharedStoragePersistence.getBoolean(skipLegalNeocrypto));
    const [loading, setloading] = useState(false);
    const [bounceableFormat,] = useBounceableWalletFormat();

    const queryParams = useMemo(() => new URLSearchParams({
        partner: 'tonhub',
        address: address.address.toString({ testOnly: isTestnet, bounceable: bounceableFormat }),
        cur_from: 'USD',
        cur_to: 'TON',
        fix_cur_to: 'true',
        fix_address: 'true',
        ...params
    }), [params, bounceableFormat]);

    const main = `https://buy.neocrypto.net?${queryParams.toString()}`;

    const onOpenBuy = useCallback(() => {
        setAccepted(true);
    }, []);

    useEffect(() => {
        if (accepted) {
            trackScreen('buy', { source: 'neocrypto' });
        }
    }, [accepted]);

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
                    {'Neocrypto service availible only on mainnet'}
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
                    <ScreenHeader onClosePressed={navigation.goBack} title={'Neocrypto'} />
                    <ConfirmLegal
                        onConfirmed={onOpenBuy}
                        skipKey={skipLegalNeocrypto}
                        title={t('neocrypto.title')}
                        description={t('neocrypto.description')}
                        termsAndPrivacy={t('neocrypto.termsAndPrivacy')}
                        privacyUrl={'https://neocrypto.net/policy/privacy.pdf'}
                        termsUrl={'https://neocrypto.net/policy/term-of-use.pdf'}
                        dontShowTitle={t('neocrypto.doNotShow')}
                        icon={logo}
                    />
                </>
            ) : (
                <View style={{ flexGrow: 1 }}>
                    <WebView
                        source={{ uri: main }}
                        onLoadStart={() => setloading(true)}
                        onLoadEnd={() => setloading(false)}
                    />
                    {loading && (
                        <LoadingIndicator
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                            simple
                        />
                    )}
                    <Pressable
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.5 : 1,
                                position: 'absolute',
                                top: Platform.OS === 'android' ? safeArea.top + 16 : 16,
                                right: 16
                            }
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
                            style={{ height: 32, width: 32 }}
                        />
                    </Pressable>
                </View>
            )}
        </View>
    );
})