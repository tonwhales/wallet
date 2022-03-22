import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../components/AndroidToolbar";
import { CloseButton } from "../components/CloseButton";
import { PasscodeComponent } from "../components/PasscodeComponent";
import { fragment } from "../fragment";
import { Settings } from "../storage/settings";
import { Theme } from "../Theme";
import { useTypedNavigation } from "../utils/useTypedNavigation";

export const SecurityFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const { t } = useTranslation();
    const navigation = useTypedNavigation();

    const [usePasscode, setUsePasscode] = useState(Settings.usePasscode());
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
                        Settings.markUsePasscode(true);
                        setUsePasscode(true);
                    }
                });
                return;
            }
            setPasscodeState({
                type: 'confirm',
                onSuccess: () => {
                    setPasscodeState(undefined);
                    Settings.markUsePasscode(false);
                    Settings.clearPasscode();
                    setUsePasscode(false);
                }
            });
        },
        [passcodeState],
    );


    return (
        <View style={{
            flexGrow: 1,
            paddingHorizontal: 16,
        }}>
            <AndroidToolbar style={{ marginTop: safeArea.top }} pageTitle={t('settings.security')} />
            <StatusBar style="dark" />
            {Platform.OS === 'ios' && (
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: Theme.textColor, fontWeight: '600', fontSize: 17, marginTop: 12 }}>
                        {t('security.title')}
                    </Text>
                </View>
            )}
            <View style={{
                flexGrow: 1,
                justifyContent: 'space-between',
                flexDirection: 'row',
                width: '100%',
                marginTop: 32
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
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={navigation.goBack}
                />
            )}
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