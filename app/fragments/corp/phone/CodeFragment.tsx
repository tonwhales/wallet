import * as React from 'react';
import { View, Text, Alert } from 'react-native';
import { iOSUIKit } from 'react-native-typography';
import { RoundButton } from '../../../components/RoundButton';
import { Theme } from '../../../Theme';
import { useNumericKeyboardHeight } from '../../../utils/useNumericKeyboardHeight';
import { ATextInput } from '../../../components/ATextInput';
import { useTypedNavigation } from '../../../utils/useTypedNavigation';
import { t } from '../../../i18n/t';
import { fragment } from '../../../fragment';
import { useRoute } from '@react-navigation/native';
import { useEngine } from '../../../engine/Engine';

export const CodeFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const params = useRoute().params as { phoneNumber: string, codeToken: string, token: string };
    const [number, setNumber] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const keyboard = useNumericKeyboardHeight();
    const sendCode = React.useCallback(async () => {
        setLoading(true);
        try {
            let res = await engine.products.corp.completePhoneVerification(params.token, params.codeToken, params.phoneNumber, number);

            // Expired state
            if (res.status === 'expired') {
                Alert.alert(t('errors.title'), t('errors.unknown'));
                navigation.dismiss();
                return;
            }

            // Invalid code
            if (res.status === 'invalid-code') {
                Alert.alert(t('errors.title'), t('errors.codeInvalid'));
                setLoading(false);
                return;
            }

            // Fallback
            if (res.status !== 'ok') {
                Alert.alert(t('errors.title'), t('errors.unknown'));
                setLoading(false);
                return;
            }

            // Dismiss verification page
            navigation.dismiss();
        } catch (e) {
            console.warn(e);
            Alert.alert(t('errors.title'), t('errors.unknown'));
            setLoading(false);
        }
    }, [number]);

    return (
        <View
            style={{ flexDirection: 'column', flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: keyboard }}
        >
            <View style={{ flexGrow: 1 }} />
            <View style={{ paddingBottom: 64, marginHorizontal: 32 }}>
                <Text style={[iOSUIKit.largeTitleEmphasized, { color: Theme.textColor, textAlign: 'center' }]}>{t('auth.codeTitle')}</Text>
                <Text style={[iOSUIKit.subhead, { color: Theme.textColor, textAlign: 'center', marginTop: 10 }]}>{t('auth.codeSubtitle')}<Text style={{ fontWeight: '600' }}>{params.phoneNumber}</Text></Text>
            </View>
            <ATextInput
                style={{
                    width: 240
                }}
                placeholder={t('auth.codeHint')}
                autoCapitalize="none"
                autoComplete="off"
                keyboardType="decimal-pad"
                textContentType="oneTimeCode"
                autoFocus={true}
                value={number}
                onValueChange={setNumber}
            />
            <View style={{ flexGrow: 1 }} />
            <View style={{ height: 64, alignSelf: 'stretch', marginHorizontal: 16, marginTop: 64 }}>
                <RoundButton loading={loading} title={t('common.continue')} onPress={sendCode} />
            </View>
        </View>
    );
});