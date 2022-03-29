import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";
import WebView from "react-native-webview";
import { AppConfig } from "../../AppConfig";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { fragment } from "../../fragment";
import { getCurrentAddress } from "../../storage/appState";
import { storage } from "../../storage/storage";
import { useParams } from "../../utils/useParams";


export const NeocryptoFragment = fragment(() => {
    const params = useParams<{
        amount?: string,
        fix_amount?: 'true' | 'false'
    }>();
    const [showTip, setShowTip] = useState(storage.getBoolean('hide_neocrypto_tip'))
    const address = getCurrentAddress();
    const baseNavigation = useNavigation();
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

    useEffect(() => {
        if (showTip) {
            Alert.alert(t('neocrypto.alert.title'), t('neocrypto.alert.message'), [{
                onPress: () => {
                    storage.set('hide_neocrypto_tip', true);
                },
            }])
        }
    }, []);

    const link = `https://demo2.neocrypto.net/buy.html?${queryParams.toString()}`
    console.log(link);

    return (
        <View style={{
            flex: 1,
            backgroundColor: '#2C3556'
        }}>
            <AndroidToolbar />
            <WebView
                ref={wref}
                source={{
                    uri: link
                }}
                onError={(e) => console.log(e, link)}
                style={{
                    backgroundColor: '#2C3556'
                }}
            />
        </View>
    );
})