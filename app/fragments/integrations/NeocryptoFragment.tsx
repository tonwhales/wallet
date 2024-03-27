import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Image, Platform, Pressable, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
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
import { useBounceableWalletFormat, useTheme } from '../../engine/hooks';
import { useNetwork } from "../../engine/hooks/network/useNetwork";
import { ScreenHeader } from "../../components/ScreenHeader";
import { StatusBar } from "expo-status-bar";
import { trackScreen } from "../../analytics/mixpanel";

const Logo = require('../../../assets/known/neocrypto_logo.png');

export const skipLegalNeocrypto = 'skip_legal_neocrypto';

export const ConfirmLegal = memo(({ onOpenBuy }: { onOpenBuy: () => void }) => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const [accepted, setAccepted] = useState(false);
    const [doNotShow, setDoNotShow] = useState(storage.getBoolean(skipLegalNeocrypto));

    const privacy = 'https://neocrypto.net/policy/privacy.pdf';
    const terms = 'https://neocrypto.net/policy/term-of-use.pdf';

    const onDoNotShowToggle = useCallback((newVal: boolean) => { setDoNotShow(newVal) }, []);
    const openTerms = useCallback(() => { openWithInApp(terms) }, []);
    const openPrivacy = useCallback(() => { openWithInApp(privacy) }, []);

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
                        color: theme.textPrimary,
                        marginTop: 16,
                        marginHorizontal: 24
                    }}>
                        {t('neocrypto.title')}
                    </Text>
                    <Text style={{
                        fontWeight: '400',
                        fontSize: 16,
                        marginTop: 24,
                        color: theme.textSecondary
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
                                <Text style={{ color: theme.textSecondary }}>
                                    {t('neocrypto.termsAndPrivacy')}
                                    <Text
                                        style={{ color: theme.accent }}
                                        onPress={openTerms}
                                    >
                                        {t('legal.termsOfService')}
                                    </Text>
                                    {' ' + t('common.and') + ' '}
                                    <Text
                                        style={{ color: theme.accent }}
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
                            text={
                                <Text style={{
                                    fontWeight: '400',
                                    fontSize: 16,
                                    marginLeft: 16,
                                    color: theme.textSecondary
                                }}>
                                    {t('neocrypto.doNotShow')}
                                </Text>
                            }
                            style={{
                                marginTop: 16
                            }}
                        />
                    </View>
                </View>
            </ScrollView>
            <View style={{ height: 64, marginTop: 16, marginBottom: safeArea.bottom === 0 ? 32 : safeArea.bottom, alignSelf: 'stretch', paddingHorizontal: 16 }}>
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

    const params = useParams<{
        amount?: string,
        fix_amount?: 'true' | 'false'
    }>();
    const address = getCurrentAddress();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const [accepted, setAccepted] = useState(storage.getBoolean(skipLegalNeocrypto));
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
            {!accepted && (
                <>
                    <ScreenHeader onClosePressed={navigation.goBack} title={'Neocrypto'} />
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
            )}
        </View>
    );
})