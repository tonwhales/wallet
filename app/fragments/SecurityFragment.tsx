import { Platform, View, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ItemButton } from "../components/ItemButton"
import { fragment } from "../fragment"
import { t } from "../i18n/t"
import { BiometricsState, PasscodeState } from "../storage/secureStorage"
import { useTypedNavigation } from "../utils/useTypedNavigation"
import { useAppConfig } from "../utils/AppConfigContext"
import { useEngine } from "../engine/Engine"
import { AndroidToolbar } from "../components/topbar/AndroidToolbar"
import { useLayoutEffect, useMemo, useState } from "react"
import { DeviceEncryption, getDeviceEncryption } from "../storage/getDeviceEncryption"
import { Ionicons } from '@expo/vector-icons';
import TouchIos from '@assets/ic_touch_ios.svg';
import TouchAndroid from '@assets/ic_touch_and.svg';
import FaceIos from '@assets/ic_face_id.svg';
import { ItemSwitch } from "../components/Item"
import { useKeysAuth } from "../components/secure/AuthWalletKeys"
import { warn } from "../utils/log"
import { ScreenHeader } from "../components/ScreenHeader"

export const SecurityFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const settings = engine.products.settings;
    const authContext = useKeysAuth();
    const { Theme } = useAppConfig();
    const passcodeState = settings.usePasscodeState();
    const biometricsState = settings.useBiometricsState();
    const lockAppWithAuthState = settings.useLockAppWithAuth();
    const [deviceEncryption, setDeviceEncryption] = useState<DeviceEncryption>();

    const biometricsProps = useMemo(() => {
        if (passcodeState !== PasscodeState.Set) {
            return null
        }

        let icon: any | undefined;
        let buttonText: string | undefined;
        switch (deviceEncryption) {
            case 'face':
                icon = Platform.OS === 'ios'
                    ? <FaceIos width={20} height={20} color={Theme.iconPrimary} />
                    : <TouchAndroid width={20} height={20} color={Theme.iconPrimary} />
                buttonText = Platform.OS === 'ios'
                    ? t('secure.protectFaceID')
                    : t('secure.protectBiometrics');
                break;
            case 'biometric':
            case 'fingerprint':
                icon = Platform.OS === 'ios'
                    ? <TouchIos width={20} height={20} color={Theme.iconPrimary} />
                    : <TouchAndroid width={20} height={20} color={Theme.iconPrimary} />
                buttonText = Platform.OS === 'ios'
                    ? t('secure.protectTouchID')
                    : t('secure.protectBiometrics');
                break;
            case 'passcode':
            case 'secret':
                icon = <Ionicons
                    name={'keypad'}
                    size={20}
                    color={Theme.iconPrimary}
                />;
                buttonText = t('secure.protectPasscode');
                break;
            case 'device-passcode':
            case 'device-biometrics':
            case 'none':
                return null;
            default:
                return null;
        }

        return {
            icon,
            buttonText,
            state: biometricsState,
        }

    }, [biometricsState, deviceEncryption, passcodeState]);

    useLayoutEffect(() => {
        (async () => {
            const encryption = await getDeviceEncryption();
            setDeviceEncryption(encryption);
        })();

        if (Platform.OS === 'ios') {
            navigation.setOptions({
                headerShown: true,
                title: t('security.title'),
            });
        }
    }, [navigation]);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <AndroidToolbar
                onBack={navigation.goBack}
                style={{ height: 44, marginTop: 16 }}
                pageTitle={t('security.title')}
            />
            <ScreenHeader
                title={t('security.title')}
                onClosePressed={navigation.goBack}
            />
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                style={{
                    flexGrow: 1,
                    paddingHorizontal: 16,
                    marginTop: Platform.OS === 'android' ? 16 : 0,
                    flexBasis: 0,
                    marginBottom: 52 + safeArea.bottom
                }}
            >
                <View style={{
                    marginTop: 16,
                    backgroundColor: Theme.border,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <ItemButton
                        leftIcon={require('@assets/ic-backup.png')}
                        title={t('settings.backupKeys')}
                        onPress={() => navigation.navigate('WalletBackup', { back: true })}
                    />
                </View>
                <View style={{
                    marginBottom: 16, marginTop: 16,
                    backgroundColor: Theme.border,
                    borderRadius: 20,
                    justifyContent: 'center',
                }}>
                    {passcodeState === PasscodeState.Set && (
                        <ItemButton
                            leftIcon={require('@assets/ic-change-passcode.png')}
                            title={t('security.passcodeSettings.changeTitle')}
                            onPress={() => navigation.navigate('PasscodeChange')}
                        />
                    )}
                    {(!passcodeState || passcodeState === PasscodeState.NotSet) && (
                        <ItemButton
                            leftIcon={require('@assets/ic_passcode.png')}
                            title={t('security.passcodeSettings.setupTitle')}
                            onPress={() => navigation.navigate('PasscodeSetup')}
                        />
                    )}
                    {biometricsProps && (
                        <>
                            {!!biometricsProps.state && biometricsProps.state !== BiometricsState.NotSet && (
                                <ItemSwitch
                                    title={biometricsProps.buttonText}
                                    value={biometricsProps.state === BiometricsState.InUse}
                                    leftIconComponent={biometricsProps.icon}
                                    onChange={async (newValue: boolean) => {
                                        try {
                                            if (newValue) {
                                                await authContext.authenticateWithPasscode({ cancelable: true });
                                            } else {
                                                await authContext.authenticate({ cancelable: true });
                                            }
                                            settings.setBiometricsState(newValue ? BiometricsState.InUse : BiometricsState.DontUse);
                                        } catch (e) {
                                            warn('Failed to authenticate with passcode');
                                        }
                                    }}
                                />
                            )}
                            {(!biometricsProps.state || biometricsProps.state === BiometricsState.NotSet) && (
                                <ItemButton
                                    leftIconComponent={biometricsProps.icon}
                                    title={biometricsProps.buttonText}
                                    onPress={() => navigation.navigate('BiometricsSetup')}
                                />
                            )}
                        </>
                    )}
                </View>
                <View style={{
                    marginBottom: 16,
                    backgroundColor: Theme.border,
                    borderRadius: 20,
                    justifyContent: 'center',
                }}>
                    <ItemSwitch
                        title={
                            t(
                                'secure.lockAppWithAuth',
                                {
                                    method: (!!biometricsProps && biometricsProps.state !== BiometricsState.NotSet)
                                        ? biometricsProps.buttonText
                                        : t('secure.methodPasscode')
                                }
                            )
                        }
                        value={lockAppWithAuthState}
                        onChange={(newValue: boolean) => {
                            engine.sharedPersistence.lockAppWithAuth.item().update(() => newValue);
                        }}
                    />
                </View>
            </ScrollView>
        </View>
    )
})