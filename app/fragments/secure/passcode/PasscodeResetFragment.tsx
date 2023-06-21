import { Platform, View, Text, Alert } from "react-native"
import { fragment } from "../../../fragment"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { CloseButton } from "../../../components/CloseButton";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { t } from "../../../i18n/t";
import React from "react";
import { DeviceEncryption } from "../../../storage/getDeviceEncryption";
import { getCurrentAddress } from "../../../storage/appState";
import { AndroidToolbar } from "../../../components/topbar/AndroidToolbar";
import { useEngine } from "../../../engine/Engine";
import { PasscodeState, passcodeEncKey } from "../../../storage/secureStorage";
import { storage } from "../../../storage/storage";
import { warn } from "../../../utils/log";
import { WalletWordsComponent } from "../../../components/secure/WalletWordsComponent";
import { useKeysAuth } from "../../../components/secure/AuthWalletKeys";

export const PasscodeResetFragment = fragment(() => {
    const authContext = useKeysAuth();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const acc = getCurrentAddress();
    const engine = useEngine();
    const settings = engine?.products?.settings;

    const onWordsComplete = React.useCallback(async (v: {
        mnemonics: string,
        deviceEncryption: DeviceEncryption
    }) => {
        try {
            const walletKeys = await authContext.authenticateWithPasscode();
            if (walletKeys.keys.mnemonics.join(' ') !== v.mnemonics) {
                Alert.alert(t('errors.incorrectWords.title'), t('errors.incorrectWords.message'));
                return;
            }
            storage.delete(`${acc.address.toFriendly({ testOnly: engine.isTestnet })}/${passcodeEncKey}`);
            settings?.setPasscodeState(PasscodeState.NotSet);
            navigation.replace('PasscodeSetup');
        } catch (e) {
            Alert.alert(t('errors.incorrectWords.title'), t('errors.incorrectWords.message'));
            warn('Failed to reset passcode',);
        }
    }, []);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('security.passcodeSettings.resetTitle')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('security.passcodeSettings.resetTitle')}
                    </Text>
                </View>
            )}
            <View style={{ flexGrow: 1, justifyContent: 'center' }}>
                <WalletWordsComponent onComplete={onWordsComplete} />
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
});