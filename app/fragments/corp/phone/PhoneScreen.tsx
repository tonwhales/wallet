import * as React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { iOSUIKit } from 'react-native-typography';
import { RoundButton } from '../../../components/RoundButton';
import { Theme } from '../../../Theme';
import { t } from '../../../i18n/t';
// import { useDefaultCountry } from '../../utils/useDefaultCountry';
// import { fragment } from '../fragment';
import { ATextInput } from '../../../components/ATextInput';
import * as WebBrowser from 'expo-web-browser';
import { useNumericKeyboardHeight } from '../../../utils/useNumericKeyboardHeight';
import { parsePhoneNumber } from 'libphonenumber-js';
import { countries } from '../../../utils/countries';
import { Country } from '../../../utils/Country';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
// import { authStart } from '../../modules/api/auth';
import { fragment } from '../../../fragment';
import { useEngine } from '../../../engine/Engine';

export const PhoneFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const defaultCountry: Country = { value: "+1", shortname: "US", label: "United States", emoji: '🇺🇸' };
    const [country, setCountry] = React.useState(defaultCountry);
    const [number, setNumberValue] = React.useState('');
    const setNumber = React.useCallback((src: string) => {
        try {
            const parsed = parsePhoneNumber(src);
            if (parsed && parsed.countryCallingCode) {
                let ex: Country | undefined;
                if ('+' + parsed.countryCallingCode === defaultCountry.value) {
                    ex = defaultCountry;
                } else if (parsed.countryCallingCode === '1') {
                    ex = countries.find((v) => v.shortname === 'US');
                } else if (parsed.countryCallingCode === '7') {
                    ex = countries.find((v) => v.shortname === 'RU');
                } else {
                    ex = countries.find((v) => v.value === '+' + parsed.countryCallingCode);
                }
                if (ex) {
                    const formatted = parsed.formatNational();
                    setCountry(ex);
                    setNumberValue(formatted);
                    return;
                }
            }
        } catch (e) {
            // Ignore
        }

        setNumberValue(src);
    }, []);
    const [loading, setLoading] = React.useState(false);
    const keyboardHeight = useNumericKeyboardHeight();
    const sendCode = React.useCallback(async () => {
        let val = country.value + ' ' + number;
        setLoading(true);
        try {
            let response = await engine.products.corp.beginPhoneVerification(val);
            //     let response = await authStart(val);
            if (response.status === 'invalid-number') {
                Alert.alert(t('errors.title'), t('errors.invalidNumber'));
                setLoading(false);
                return;
            }
            if (response.status === 'try-again-later') {
                Alert.alert(t('errors.title'), t('errors.invalidNumber'));
                setLoading(false);
                return;
            }
            if (response.status === 'already-verified') {
                navigation.goBack(); // Exit modal screen
                return;
            }
            if (response.status !== 'ok') {
                Alert.alert(t('errors.title'), t('errors.unknown'));
                setLoading(false);
                return;
            }

            // Navigate to code validation
            navigation.navigate('Code', { phoneNumber: response.phoneNumber, token: response.token, codeToken: response.codeToken });
        } catch (e) {
            console.warn(e);
            Alert.alert(t('errors.title'), t('errors.unknown'));
            setLoading(false);
        }
    }, [country, number]);
    const openTermsOfService = React.useCallback(() => {
        WebBrowser.openBrowserAsync('https://tonhub.com/legal/terms', { enableDefaultShareMenuItem: false, showInRecents: false });
    }, []);
    const openPrivacyPolicy = React.useCallback(() => {
        WebBrowser.openBrowserAsync('https://tonhub.com/legal/privacy', { enableDefaultShareMenuItem: false, showInRecents: false });
    }, []);

    return (
        <View
            style={{
                flexDirection: 'column',
                flexGrow: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingBottom: keyboardHeight,
                backgroundColor: Theme.background
            }}
        >
            <View style={{ flexGrow: 1 }} />
            <View style={{ paddingBottom: 64, marginHorizontal: 32 }}>
                <Text style={[iOSUIKit.largeTitleEmphasized, { color: Theme.textColor, textAlign: 'center' }]}>{t('auth.phoneTitle')}</Text>
                <Text style={[iOSUIKit.subhead, { color: Theme.textColor, textAlign: 'center', marginTop: 10 }]}>{t('auth.phoneSubtitle')}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginHorizontal: 16 }}>
                <Pressable style={(props) => ({ opacity: props.pressed ? 0.6 : 1 })} onPress={() => navigation.navigate('Country', { onPicked: setCountry })}>
                    <View style={{
                        backgroundColor: '#F2F2F2',
                        height: 48,
                        borderRadius: 12,
                        padding: 16,
                        marginRight: 16
                    }}>
                        <Text style={{ color: Theme.textColor, fontSize: 15, includeFontPadding: false }}>{country.value} {country.emoji}</Text>
                    </View>
                </Pressable>
                <ATextInput
                    style={{ flexGrow: 1 }}
                    placeholder={t('auth.phoneNumber')}
                    value={number}
                    autoCapitalize="none"
                    autoComplete="tel"
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                    autoFocus={true}
                    onValueChange={setNumber}
                />
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={{ marginHorizontal: 24, marginTop: 16 }}>
                <Text style={{ textAlign: 'center', color: Theme.textSecondary, fontSize: 15, lineHeight: 20, fontWeight: '400' }}>
                    {t('auth.consent')}{' '}
                    <Text style={{ fontWeight: 'bold' }} onPress={openTermsOfService}>
                        {t('common.termsOfService')}
                    </Text>
                    {' '}{t('common.and')}{' '}
                    <Text style={{ fontWeight: 'bold' }} onPress={openPrivacyPolicy}>
                        {t('common.privacyPolicy')}
                    </Text>
                </Text>
            </View>
            <View style={{ height: 64, alignSelf: 'stretch', marginHorizontal: 16, marginTop: 32 }}>
                <RoundButton loading={loading} title={t('common.continue')} action={sendCode} />
            </View>
        </View>
    );
});