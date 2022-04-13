import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { AppConfig } from "../../AppConfig";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CheckBox } from "../../components/CheckBox";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { getCurrentAddress } from "../../storage/appState";
import { Theme } from "../../Theme";
import { useParams } from "../../utils/useParams";

const Logo = require('../../../assets/known/neocrypto_logo.png');

export const NeocryptoFragment = fragment(() => {

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
    const baseNavigation = useNavigation();
    const safeArea = useSafeAreaInsets();
    const [accepted, setAccepted] = useState(false);

    const { t } = useTranslation();
    const wref = React.useRef<WebView>(null);

    const queryParams = useMemo(() => new URLSearchParams({
        partner: 'tonhub',
        address: address.address.toFriendly({ testOnly: AppConfig.isTestnet }),
        cur_from: 'USD',
        cur_to: 'TON',
        fix_cur_to: 'true',
        fix_address: 'true',
        ...params
    }), [params]);

    useLayoutEffect(() => {
        baseNavigation.setOptions({
            headerStyle: {
                backgroundColor: '#2C3556',
            },
            headerTintColor: 'white'
        });
    }, []);

    const main = `https://neocrypto.net/buywhite.html?${queryParams.toString()}`;
    const privacy = 'https://neocrypto.net/privacypolicy.html';
    const terms = 'https://neocrypto.net/terms.html';

    const openTerms = useCallback(
        () => {

        },
        [],
    );
    const openPrivacy = useCallback(
        () => {

        },
        [],
    );


    return (
        <View style={{
            flex: 1,
            backgroundColor: Theme.background,
            paddingTop: Platform.OS === 'android' ? safeArea.top + 24 : undefined,
            paddingHorizontal: 16,
            justifyContent: 'center', alignItems: 'center'
        }}>
            <AndroidToolbar />
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                {Platform.OS === 'ios' && (
                    <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17, marginTop: 12 }}>
                        {'Neorcypto'}
                    </Text>
                )}
            </View>
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
                color: Theme.textColor,
                marginTop: 16
            }}>
                {t('neocrypto.title')}
            </Text>
            <Text style={{
                fontWeight: '400',
                fontSize: 16,
                marginTop: 24
            }}>
                {t('neocrypto.description')}
            </Text>
            <View style={{ flexGrow: 1 }} />
            <View>
                <CheckBox
                    checked={accepted}
                    onToggle={(newVal) => setAccepted(newVal)}
                    text={
                        <Text>
                            {t('neocrypto.termsAndPrivacy')}

                            <Text
                                style={{ color: '#42A3EB' }}
                                onPress={openTerms}
                            >
                                {t('legal.termsOfService')}
                            </Text>
                            {' ' + t('common.and') + ' '}
                            <Text
                                style={{ color: '#42A3EB' }}
                                onPress={openPrivacy}
                            >
                                {t('legal.privacyPolicy')}
                            </Text>
                        </Text>
                    }
                    style={{
                        marginTop: 16
                    }}
                />
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={{ height: 64, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton
                    disabled={!accepted}
                    title={t('common.continue')}
                    onPress={() => {
                    }}
                />
            </View>
        </View>
    );
})