import { StatusBar } from "expo-status-bar"
import { Platform, View, Text, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { CloseButton } from "../components/CloseButton"
import { ItemButton } from "../components/ItemButton"
import { fragment } from "../fragment"
import { t } from "../i18n/t"
import { BiometricsState, PasscodeState } from "../storage/secureStorage"
import { useTypedNavigation } from "../utils/useTypedNavigation"
import { useAppConfig } from "../utils/AppConfigContext"
import { useEngine } from "../engine/Engine"
import { AndroidToolbar } from "../components/topbar/AndroidToolbar"
import { useEffect, useMemo, useState } from "react"
import { DeviceEncryption, getDeviceEncryption } from "../storage/getDeviceEncryption"
import { Ionicons } from '@expo/vector-icons';
import TouchIos from '../../assets/ic_touch_ios.svg';
import TouchAndroid from '../../assets/ic_touch_and.svg';
import FaceIos from '../../assets/ic_face_id.svg';
import { ItemSwitch } from "../components/Item"
import { useKeysAuth } from "../components/secure/AuthWalletKeys"
import { warn } from "../utils/log"
import { ItemGroup } from "../components/ItemGroup"

export const SecurityFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const settings = engine.products.settings;
    const authContext = useKeysAuth();
    const { Theme } = useAppConfig();
    const passcodeState = settings.usePasscodeState();
    const biometricsState = settings.useBiometricsState();
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
                    ? <FaceIos width={20} height={20} color={'#000'} />
                    : <TouchAndroid width={20} height={20} color={'#000'} />
                buttonText = Platform.OS === 'ios'
                    ? t('secure.protectFaceID')
                    : t('secure.protectBiometrics');
                break;
            case 'biometric':
            case 'fingerprint':
                icon = Platform.OS === 'ios'
                    ? <TouchIos width={20} height={20} color={'#000'} />
                    : <TouchAndroid width={20} height={20} color={'#000'} />
                buttonText = Platform.OS === 'ios'
                    ? t('secure.protectTouchID')
                    : t('secure.protectBiometrics');
                break;
            case 'passcode':
            case 'secret':
                icon = <Ionicons
                    name={'keypad'}
                    size={20}
                    color={'#000'}
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

    useEffect(() => {
        (async () => {
            const encryption = await getDeviceEncryption();
            setDeviceEncryption(encryption);
        })();
    }, []);

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('security.title')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 17,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('security.title')}
                    </Text>
                </View>
            )}
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                style={{
                    flexGrow: 1,
                    backgroundColor: Theme.background,
                    paddingHorizontal: 16,
                    flexBasis: 0,
                    marginBottom: 52 + safeArea.bottom
                }}
            >
                <View style={{
                    marginBottom: 16, marginTop: 17,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    {passcodeState === PasscodeState.Set && (
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton
                                leftIcon={require('../../assets/ic_passcode.png')}
                                title={t('security.passcodeSettings.changeTitle')}
                                onPress={() => navigation.navigate('PasscodeChange')}
                            />
                        </View>
                    )}
                    {(!passcodeState || passcodeState === PasscodeState.NotSet) && (
                        <View style={{ marginHorizontal: 16, width: '100%' }}>
                            <ItemButton
                                leftIcon={require('../../assets/ic_passcode.png')}
                                title={t('security.passcodeSettings.setupTitle')}
                                onPress={() => navigation.navigate('PasscodeSetup')}
                            />
                        </View>
                    )}
                    {biometricsProps && (
                        <>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 + 24 }} />
                            <View style={{ marginHorizontal: 16, width: '100%' }}>
                                <ItemGroup>
                                    {!!biometricsProps.state && biometricsProps.state !== BiometricsState.NotSet && (
                                        <ItemSwitch
                                            title={biometricsProps.buttonText}
                                            value={biometricsProps.state === BiometricsState.InUse}
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
                                </ItemGroup>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
            <CloseButton style={{ position: 'absolute', top: 22, right: 16 }} />
        </View>
    )
})