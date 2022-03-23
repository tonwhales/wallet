import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../components/AndroidToolbar";
import { CloseButton } from "../components/CloseButton";
import { PasscodeComponent } from "../components/Passcode/PasscodeComponent";
import { fragment } from "../fragment";
import { Settings } from "../storage/settings";
import { Theme } from "../Theme";
import { useTypedNavigation } from "../utils/useTypedNavigation";

export const SecurityFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const { t } = useTranslation();
    const baseNavigation = useNavigation();
    const navigation = useTypedNavigation();

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
                <View style={{ marginHorizontal: 16, width: '100%' }}>
                    <View style={{
                        flexGrow: 1,
                        justifyContent: 'space-between',
                        flexDirection: 'row',
                        width: '100%',
                        alignItems: 'center'
                    }}>
                        <Text>
                            {'Use passcode'}
                        </Text>
                        <Switch
                            trackColor={{ false: '#767577', true: '#81b0ff' }}
                            thumbColor={usePasscode ? '#f5dd4b' : '#f4f3f4'}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={onUsePasscodeChange}
                            value={usePasscode}
                        />
                    </View>
                </View>
                {
                    <>
                        <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 + 24 }} />
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <Pressable style={{
                                flexGrow: 1,
                                justifyContent: 'space-between',
                                flexDirection: 'row',
                                width: '100%',
                                marginTop: 32
                            }}>
                                <Text>
                                    {'Change passcode'}
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