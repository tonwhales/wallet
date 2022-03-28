import React, { useCallback, useState } from "react";
import { Platform, Pressable, View, Text } from "react-native";
import { fragment } from "../../fragment"
import * as LocalAuthentication from 'expo-local-authentication';
import { Settings } from "../../storage/settings";
import { useParams } from "../../utils/useParams";
import { RoundButton } from "../../components/RoundButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { FragmentMediaContent } from "../../components/FragmentMediaContent";
import { Theme } from "../../Theme";

export const SetBiometryFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const params = useParams<{
        onSuccess?: () => void,
        onCancel?: () => void,
        onSkip?: () => void
    }>();

    const onSet = useCallback(
        () => {
            (async () => {
                setLoading(true);
                const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
                const enrolled = await LocalAuthentication.isEnrolledAsync();
                if (types.length > 0 && enrolled) {
                    try {
                        const res = await LocalAuthentication.authenticateAsync();
                        if (res.success) {
                            setLoading(false);
                            Settings.markUseBiometry(true);
                            if (params.onSuccess) params.onSuccess();
                        } else {
                            setLoading(false);
                        }
                    } catch (error) {
                        setLoading(false);
                    }
                }
            })();
        },
        [],
    );

    return (
        <View style={{
            flex: 1,
            backgroundColor: 'white'
        }}>
            <View style={{ flexGrow: 1 }} />
            <FragmentMediaContent
                animation={require('../../../assets/animations/lock.json')}
                title={Platform.OS === 'ios' ? t('secure.protectFaceID') : t('secure.protectBiometrics')}
                text={t('secure.messageNoBiometrics')}
            />
            <View style={{ flexGrow: 1 }} />
            <View style={{ height: 128, marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton
                    onPress={onSet}
                    title={
                        Platform.OS === 'ios'
                            ? t('secure.protectFaceID')
                            : t('secure.protectBiometrics')
                    }
                    loading={loading}
                    iconImage={
                        Platform.OS === 'ios'
                            ? require('../../../assets/ic_face_id.png')
                            : require('../../../assets/ic_and_touch.png')
                    }
                />
                <Pressable
                    onPress={params.onSkip}
                    style={({ pressed }) => {
                        return {
                            opacity: pressed ? 0.5 : 1,
                            alignSelf: 'center',
                            marginTop: 26,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }
                    }}
                >
                    <Text style={{
                        fontSize: 17,
                        fontWeight: '600',
                        color: Theme.accentText
                    }}>
                        {t('common.skip')}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
})