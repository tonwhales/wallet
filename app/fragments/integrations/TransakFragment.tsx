import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Image, Platform, Pressable, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { AppConfig } from "../../AppConfig";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CheckBox } from "../../components/CheckBox";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { getCurrentAddress } from "../../storage/appState";
import { storage } from "../../storage/storage";
import { Theme } from "../../Theme";
import { openWithInApp } from "../../utils/openWithInApp";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import TransakLogo from '../../../assets/ic_transak_logo.svg'
import { useEngine } from "../../engine/Engine";

export const skipLegalTransak = 'skip_legal_transak';

export const ConfirmLegal = React.memo((
    {
        onOpenBuy
    }: {
        onOpenBuy: () => void
    }
) => {
    const safeArea = useSafeAreaInsets();
    const [accepted, setAccepted] = useState(false);
    const [doNotShow, setDoNotShow] = useState(storage.getBoolean(skipLegalTransak));

    const privacy = 'https://transak.com/privacy-policy';
    const terms = 'https://transak.com/terms-of-service';

    const onDoNotShowToggle = useCallback((newVal) => {
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
            storage.set(skipLegalTransak, doNotShow || false);
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
                    <View style={{
                        height: 200,
                        width: 300,
                    }}>
                        <TransakLogo />
                    </View>
                    <Text style={{
                        fontWeight: '400',
                        fontSize: 16,
                        marginTop: 24,
                    }}>
                        {t('integrations.transak.description')}
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
                                        style={{ color: Theme.linkText }}
                                        onPress={openTerms}
                                    >
                                        {t('legal.termsOfService')}
                                    </Text>
                                    {' ' + t('common.and') + ' '}
                                    <Text
                                        style={{ color: Theme.linkText }}
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
                            text={t('integrations.transak.doNotShow')}
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

const tonwhalesTransakApiKey = 'b4fae368-42b9-409a-bb12-a2654b8372b1';

export const TransakFragment = fragment(() => {
    const engine = useEngine();
    const primaryCurrency = engine.products.price.usePrimaryCurrency();

    if (AppConfig.isTestnet) {
        return (
            <View style={{
                flexGrow: 1,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Text style={{
                    color: Theme.textColor
                }}>
                    {'Transak service availible only on mainnet'}
                </Text>
            </View>
        );
    }

    const address = getCurrentAddress();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const [accepted, setAccepted] = useState(storage.getBoolean(skipLegalTransak));
    const [loading, setloading] = useState(false);

    const queryParams = useMemo(() => new URLSearchParams({
        apiKey: tonwhalesTransakApiKey,
        themeColor: Theme.accent,
        cryptoCurrencyCode: 'TON',
        walletAddressaddress: address.address.toString(),
        // fiatCurrency: primaryCurrency // TODO: add when Transak will support any cyrrency -> TON pair 
        hideMenu: 'true',
    }), []);

    const main = `https://global-stg.transak.com?${queryParams.toString()}`;

    const onOpenBuy = useCallback(() => {
        setAccepted(true);
    }, []);

    return (
        <View style={{
            flex: 1,
            backgroundColor: Theme.item,
            flexGrow: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            {!accepted && (
                <>
                    <AndroidToolbar />
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        {Platform.OS === 'ios' && (
                            <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17, marginTop: 17, lineHeight: 32 }}>
                                {t('integrations.transak.title')}
                            </Text>
                        )}
                    </View>
                    <ConfirmLegal onOpenBuy={onOpenBuy} />
                </>
            )}
            {accepted && (
                <View style={{ flexGrow: 1, paddingTop: 8, paddingBottom: 32 }}>
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