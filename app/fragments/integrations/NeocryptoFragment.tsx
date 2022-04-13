import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, View, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { AppConfig } from "../../AppConfig";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { getCurrentAddress } from "../../storage/appState";
import { storage } from "../../storage/storage";
import { Theme } from "../../Theme";
import { useParams } from "../../utils/useParams";


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

    const link = `https://demo2.neocrypto.net/buy.html?${queryParams.toString()}`
    console.log(link);

    return (
        <View style={{
            flex: 1,
            backgroundColor: Theme.background,
            paddingTop: Platform.OS === 'android' ? safeArea.top + 24 : undefined,
            paddingHorizontal: 16
        }}>
            <AndroidToolbar />
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                {Platform.OS === 'ios' && (
                    <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17, marginTop: 12 }}>
                        {'Neorcypto'}
                    </Text>
                )}
            </View>
            <View style={{ height: 64, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title={t('common.continue')}
                    onPress={() => {

                    }}
                />
            </View>
        </View>
    );
})