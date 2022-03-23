import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Switch, Text, View } from "react-native";
import { PasscodeComponent } from "../components/Passcode/PasscodeComponent";
import { fragment } from "../fragment";
import { Settings } from "../storage/settings";
import { Theme } from "../Theme";

export const SecurityFragment = fragment(() => {
    const { t } = useTranslation();
    const baseNavigation = useNavigation();

    const [usePasscode, setUsePasscode] = useState(!!Settings.getPasscode());
    const [passcodeState, setPasscodeState] = useState<{
        type?: 'confirm' | 'new',
        onSuccess?: () => void,
    }>();

    const onUsePasscodeChange = useCallback(
        (newVal: boolean) => {
            if (newVal) {
                setPasscodeState({
                    type: 'new',
                    onSuccess: () => {
                        setPasscodeState(undefined);
                        setUsePasscode(true);
                    }
                });
                return;
            }
            setPasscodeState({
                type: 'confirm',
                onSuccess: () => {
                    setPasscodeState(undefined);
                    Settings.clearPasscode();
                    setUsePasscode(false);
                }
            });
        },
        [passcodeState],
    );

    useLayoutEffect(() => {
        baseNavigation.setOptions({ headerStyle: { backgroundColor: Theme.background }, title: t('security.title') });
    }, []);


    return (
        <View style={{
            flexGrow: 1,
            paddingHorizontal: 16,
        }}>
            <StatusBar style="dark" />
            <View style={{
                marginBottom: 16, marginTop: 17,
                backgroundColor: "white",
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 1,
            }}>
                <View style={{ marginHorizontal: 16, height: 48, width: '100%', flexDirection: 'row' }}>
                    <View style={{ width: 24, height: 24 }} />
                    <Pressable
                        style={({ pressed }) => {
                            return [{
                                flexGrow: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                opacity: pressed ? 0.8 : 1,
                                borderRadius: 8,
                                justifyContent: 'space-between',
                                padding: 6
                            }]
                        }}
                        onPress={() => {
                            onUsePasscodeChange(!usePasscode)
                        }}
                    >
                        <Text style={{
                            fontSize: 17,
                            textAlignVertical: 'center',
                            color: Theme.textColor,
                            marginLeft: 8,
                            lineHeight: 24,
                        }}>
                            {t('security.passcode.use')}
                        </Text>
                        <Switch
                            trackColor={{ false: '#767577', true: '#81b0ff' }}
                            thumbColor={usePasscode ? '#f5dd4b' : '#f4f3f4'}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={onUsePasscodeChange}
                            value={usePasscode}
                        />
                    </Pressable>
                </View>
                {
                    <>
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 + 24 }} />
                        <View style={{ marginHorizontal: 16, padding: 6, height: 48, width: '100%', flexDirection: 'row', }}>
                            <Pressable style={({ pressed }) => {
                                return [{
                                    flexGrow: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    opacity: pressed ? 0.8 : 1,
                                    borderRadius: 8
                                }]
                            }}>
                                <View style={{ width: 24, height: 24 }} />
                                <Text style={{
                                    fontSize: 17,
                                    textAlignVertical: 'center',
                                    color: Theme.textColor,
                                    marginLeft: 8,
                                    lineHeight: 24,
                                }}>
                                    {t('security.passcode.change')}
                                </Text>
                            </Pressable>
                        </View>
                    </>
                }
            </View>
            <PasscodeComponent
                type={passcodeState?.type}
                onSuccess={passcodeState?.onSuccess}
                onCancel={() => {
                    setPasscodeState(undefined);
                }}
            />
        </View>
    );
});