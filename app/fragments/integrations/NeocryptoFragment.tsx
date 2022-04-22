import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { AppConfig } from "../../AppConfig";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CheckBox } from "../../components/CheckBox";
import { CloseButton } from "../../components/CloseButton";
import { RoundButton } from "../../components/RoundButton";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { getCurrentAddress } from "../../storage/appState";
import { storage } from "../../storage/storage";
import { Theme } from "../../Theme";
import { openWithInApp } from "../../utils/openWithInApp";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

const Logo = require('../../../assets/known/neocrypto_logo.png');
export const skipLegalNeocrypto = 'skip_legal_neocrypto';

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
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const [accepted, setAccepted] = useState(false);
    const [doNotShow, setDoNotShow] = useState(storage.getBoolean(skipLegalNeocrypto));

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

    const main = `https://neocrypto.net/buywhite.html?${queryParams.toString()}`;
    const privacy = 'https://neocrypto.net/privacypolicy.html';
    const terms = 'https://neocrypto.net/terms.html';

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

    const onOpenBuy = useCallback(() => {
        if (accepted) {
            storage.set(skipLegalNeocrypto, doNotShow);
            navigation.goBack();
            openWithInApp(main);
        }
    }, [accepted, doNotShow]);

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
                    <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17, marginTop: 12, lineHeight: 32 }}>
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
            <View style={{ height: 64, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton
                    disabled={!accepted}
                    title={t('common.continue')}
                    onPress={onOpenBuy}
                />
            </View>
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
})