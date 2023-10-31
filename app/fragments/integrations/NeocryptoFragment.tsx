import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Image, Platform, Pressable, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { CheckBox } from "../../components/CheckBox";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { getCurrentAddress } from "../../storage/appState";
import { storage } from "../../storage/storage";
import { openWithInApp } from "../../utils/openWithInApp";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useTheme } from '../../engine/hooks/useTheme';
import { useNetwork } from "../../engine/hooks/useNetwork";

const Logo = require('../../../assets/known/neocrypto_logo.png');
export const skipLegalNeocrypto = 'skip_legal_neocrypto';

export const ConfirmLegal = React.memo((
    {
        onOpenBuy
    }: {
        onOpenBuy: () => void
    }
) => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const [accepted, setAccepted] = useState(false);
    const [doNotShow, setDoNotShow] = useState(storage.getBoolean(skipLegalNeocrypto));

    const privacy = 'https://neocrypto.net/privacypolicy.html';
    const terms = 'https://neocrypto.net/terms.html';

    const onDoNotShowToggle = useCallback((newVal: boolean) => {
        setDoNotShow(newVal);
    }, []);

    const openTerms = useCallback(
        () => {
            openWithInApp(terms);
        },
        [],
    );
    const openPrivacy = useCallback(
        () => {
            openWithInApp(privacy)
        },
        [],
    );

    const onOpen = useCallback(() => {
        if (accepted) {
            storage.set(skipLegalNeocrypto, doNotShow || false);
            onOpenBuy();
        }
    }, [accepted, doNotShow]);

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: safeArea.bottom }}
                alwaysBounceVertical={false}
            >
                <View style={{ flexGrow: 1, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ flexGrow: 1 }} />
                    <Image
                        style={{
                            width: 100,
                            height: 100,
                            overflow: 'hidden'
                        }}
                        source={Logo}
                    />
                    <Text style={{
                        fontWeight: '800',
                        fontSize: 24,
                        textAlign: 'center',
                        color: theme.textColor,
                        marginTop: 16,
                        marginHorizontal: 24
                    }}>
                        {t('neocrypto.title')}
                    </Text>
                    <Text style={{
                        fontWeight: '400',
                        fontSize: 16,
                        marginTop: 24,
                    }}>
                        {t('neocrypto.description')}
                    </Text>
                    <View style={{ flexGrow: 1 }} />
                    <View style={{
                        paddingRight: 62,
                        marginBottom: 24,
                        width: '100%'
                    }}>
                        <CheckBox
                            checked={accepted}
                            onToggle={(newVal) => setAccepted(newVal)}
                            text={
                                <Text>
                                    {t('neocrypto.termsAndPrivacy')}

                                    <Text
                                        style={{ color: theme.linkText }}
                                        onPress={openTerms}
                                    >
                                        {t('legal.termsOfService')}
                                    </Text>
                                    {' ' + t('common.and') + ' '}
                                    <Text
                                        style={{ color: theme.linkText }}
                                        onPress={openPrivacy}
                                    >
                                        {t('legal.privacyPolicy')}
                                    </Text>
                                </Text>
                            }
                        />
                        <CheckBox
                            checked={doNotShow}
                            onToggle={onDoNotShowToggle}
                            text={t('neocrypto.doNotShow')}
                            style={{
                                marginTop: 16
                            }}
                        />
                    </View>
                </View>
            </ScrollView>
            <View style={{ height: 64, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch', paddingHorizontal: 16 }}>
                <RoundButton
                    disabled={!accepted}
                    title={t('common.continue')}
                    onPress={onOpen}
                />
            </View>
        </View>
    );
});

export const NeocryptoFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();

    if (isTestnet) {
        return (
            <View style={{
                flexGrow: 1,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Text style={{
                    color: theme.textColor
                }}>
                    {'Neocrypto service availible only on mainnet'}
                </Text>
            </View>
        );
    }

    const params = useParams<{
        amount?: string,
        fix_amount?: 'true' | 'false'
    }>();
    const address = getCurrentAddress();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const [accepted, setAccepted] = useState(storage.getBoolean(skipLegalNeocrypto));
    const [loading, setloading] = useState(false);

    const wref = React.useRef<WebView>(null);

    const queryParams = useMemo(() => new URLSearchParams({
        partner: 'tonhub',
        address: address.address.toString({ testOnly: isTestnet }),
        cur_from: 'USD',
        cur_to: 'TON',
        fix_cur_to: 'true',
        fix_address: 'true',
        ...params
    }), [params]);

    const main = `https://neocrypto.net/tonhub.html?${queryParams.toString()}`;

    const onOpenBuy = useCallback(() => {
        setAccepted(true);
    }, []);

    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.background,
            flexGrow: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            {!accepted && (
                <>
                    <AndroidToolbar />
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        {Platform.OS === 'ios' && (
                            <Text style={{ color: theme.textColor, fontWeight: '600', fontSize: 17, marginTop: 12, lineHeight: 32 }}>
                                {'Neorcypto'}
                            </Text>
                        )}
                    </View>
                    <ConfirmLegal onOpenBuy={onOpenBuy} />
                </>
            )}
            {accepted && (
                <View style={{ flexGrow: 1 }}>
                    <WebView
                        source={{ uri: main }}
                        onLoadStart={() => setloading(true)}
                        onLoadEnd={() => setloading(false)}
                    />
                    {loading && <LoadingIndicator simple style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0
                    }} />}
                </View>
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
                <Image source={require('../../../assets/ic_close.png')} style={{
                    height: 32, width: 32
                }} />
            </Pressable>
        </View>
    );
})