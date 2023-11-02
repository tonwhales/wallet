import { View, Image, Alert } from "react-native";
import { systemFragment } from "../../systemFragment";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { useCallback, useState } from "react";
import { useTheme } from '../../engine/hooks/theme/useTheme';
import { t } from "../../i18n/t";
import { PasscodeState, getPasscodeState, migrateAndroidKeyStore } from "../../storage/secureStorage";
import { useKeysAuth } from "../../components/secure/AuthWalletKeys";
import { useReboot } from "../../utils/RebootContext";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { FragmentMediaContent } from "../../components/FragmentMediaContent";

export const KeyStoreMigrationFragment = systemFragment(() => {
    const theme = useTheme();
    const authContext = useKeysAuth();
    const safeArea = useSafeAreaInsets();
    const reboot = useReboot();
    const [state, setState] = useState<'loading' | undefined>()

    const onStart = useCallback(async () => {
        setState('loading');
        try {
            const passcodeSet = getPasscodeState() === PasscodeState.Set;
            if (passcodeSet) {
                const res = await authContext.authenticateWithPasscode();
                await migrateAndroidKeyStore(res.passcode);
            } else {
                await migrateAndroidKeyStore();
            }
            reboot();
        } catch {
            Alert.alert(t('common.error'), t('migrate.failed'));
            setState(undefined);
        }
    }, []);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={'dark'} />
            <AndroidToolbar style={{ marginTop: safeArea.top }} />
            {state === 'loading' && (
                <View style={{
                    position: 'absolute', bottom: 0, top: 0, left: 0, right: 0,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <LoadingIndicator simple />
                </View>
            )}
            {state !== 'loading' && (
                <>
                    <View style={{ flexGrow: 1 }} />
                    <FragmentMediaContent
                        animation={require('../../../assets/animations/lock.json')}
                        title={t('migrate.keyStoreTitle')}
                        text={t('migrate.keyStoreSubtitle')}
                    />
                    <View style={{ flexGrow: 1 }} />
                    <View style={{ marginHorizontal: 16, marginBottom: 16 + safeArea.bottom }}>
                        <RoundButton
                            title={t('common.start')}
                            onPress={onStart}
                            icon={<Image
                                source={require('../../../assets/ic_privacy.png')}
                                style={{ tintColor: theme.item, height: 24, width: 24 }}
                            />}
                        />
                    </View>
                </>
            )}
        </View>
    );
});