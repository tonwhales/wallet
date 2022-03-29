import React, { useCallback, useEffect, useState } from "react"
import { Pressable, View, Image, Text, Switch, Platform, Alert } from "react-native"
import { Settings } from "../../storage/settings";
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from "react-i18next";
import { Theme } from "../../Theme";

export const BiometryComponent = React.memo(() => {
    const { t } = useTranslation();
    const [hasBiometry, setHasBiometry] = useState(false);
    const [useBiometry, setUseBiometry] = useState(Settings.useBiometry());

    useEffect(() => {
        (async () => {
            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();

            if (types.length > 0 && enrolled) {
                setHasBiometry(true);
            }
        })();

    }, []);

    const onChange = useCallback(
        (newVal: boolean) => {
            if (!newVal) {
                Alert.alert(
                    t('confirm.biometry.turnOff.title', { type: Platform.OS === 'ios' ? t('common.faceID') : t('confirm.biometry.turnOff.typeBiometry') }),
                    t('confirm.biometry.turnOff.message'),
                    [{
                        text: t('confirm.biometry.turnOff.positive', { type: Platform.OS === 'ios' ? t('common.faceID') : t('confirm.biometry.turnOff.typeBiometry') }), style: 'destructive', onPress: () => {
                            LocalAuthentication
                                .authenticateAsync()
                                .then(() => {
                                    Settings.markUseBiometry(newVal);
                                    setUseBiometry(newVal);
                                });
                        }
                    }, { text: t('common.cancel') }]);
                return;
            }

            LocalAuthentication
                .authenticateAsync()
                .then(() => {
                    Settings.markUseBiometry(newVal);
                    setUseBiometry(newVal);
                });
        },
        [],
    );

    if (!hasBiometry) return null;

    return (
        <>
            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 + 24 }} />
            <View style={{ marginHorizontal: 16, height: 48, width: '100%', flexDirection: 'row', }}>
                <Pressable
                    style={({ pressed }) => {
                        return [{
                            flexGrow: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            opacity: pressed ? 0.3 : 1,
                            borderRadius: 8,
                            padding: 6
                        }]
                    }}
                    onPress={() => onChange(!useBiometry)}
                >
                    <Image
                        style={{ height: 24, width: 24 }}
                        source={
                            Platform.OS === 'ios'
                                ? require('../../../assets/face_id.png')
                                : require('../../../assets/ic_and_touch_black.png')
                        } />
                    <View style={{
                        flexDirection: 'row',
                        flexGrow: 1,
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Text style={{
                            fontSize: 17,
                            textAlignVertical: 'center',
                            color: Theme.textColor,
                            marginLeft: 8,
                            lineHeight: 24,
                        }}>
                            {t('security.biometry')}
                        </Text>
                        <Switch
                            trackColor={{ false: '#f4f3f4', true: Platform.OS === 'android' ? Theme.accent : '#4FAE42' }}
                            thumbColor={'white'}
                            ios_backgroundColor={useBiometry ? '#4FAE42' : "#f4f3f4"}
                            onValueChange={() => onChange(!useBiometry)}
                            value={useBiometry}
                        />
                    </View>
                </Pressable>
            </View>
        </>
    );
})