import React from "react"
import { Platform, View, ScrollView, Image, AppState, Text } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ItemButton } from "../components/ItemButton"
import { fragment } from "../fragment"
import { t } from "../i18n/t"
import { BiometricsState, PasscodeState } from "../storage/secureStorage"
import { useTypedNavigation } from "../utils/useTypedNavigation"
import { useSelectedAccount, useTheme } from '../engine/hooks';
import { useEffect, useMemo, useState } from "react"
import { DeviceEncryption, getDeviceEncryption } from "../storage/getDeviceEncryption"
import { Ionicons } from '@expo/vector-icons';
import { ItemSwitch } from "../components/Item"
import { useKeysAuth } from "../components/secure/AuthWalletKeys"
import { warn } from "../utils/log"
import { usePasscodeState } from '../engine/hooks'
import { useBiometricsState } from '../engine/hooks'
import { useSetBiometricsState } from "../engine/hooks/appstate/useSetBiometricsState"
import { ScreenHeader } from "../components/ScreenHeader"
import { useAppAuthMandatory, useLockAppWithAuthState } from "../engine/hooks/settings"
import { StatusBar } from "expo-status-bar"

import TouchAndroid from '@assets/ic_touch_and.svg';
import FaceIos from '@assets/ic_face_id.svg';
import { Typography } from "../components/styles"

export const SecurityFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const authContext = useKeysAuth();
    const theme = useTheme();
    const passcodeState = usePasscodeState();
    const biometricsState = useBiometricsState();
    const setBiometricsState = useSetBiometricsState();
    const [mandatoryAuth,] = useAppAuthMandatory();
    const [deviceEncryption, setDeviceEncryption] = useState<DeviceEncryption>();
    const [lockAppWithAuthState, setLockAppWithAuthState] = useLockAppWithAuthState();

    const canToggleAppAuth = !(mandatoryAuth && lockAppWithAuthState);

    const biometricsProps = useMemo(() => {
        if (passcodeState !== PasscodeState.Set) {
            return null;
        }

        let icon: any | undefined;
        let buttonText: string | undefined;
        switch (deviceEncryption) {
            case 'face':
                icon = Platform.OS === 'ios'
                    ? <FaceIos width={20} height={20} color={theme.iconNav} />
                    : <TouchAndroid width={20} height={20} color={theme.iconNav} />
                buttonText = Platform.OS === 'ios'
                    ? t('secure.protectFaceID')
                    : t('secure.protectBiometrics');
                break;
            case 'biometric':
            case 'fingerprint':
                icon = <Image style={{ height: 24, width: 24 }} source={require('@assets/ic-touch-id.png')} />
                buttonText = Platform.OS === 'ios'
                    ? t('secure.protectTouchID')
                    : t('secure.protectBiometrics');
                break;
            case 'passcode':
            case 'secret':
                icon = <Ionicons
                    name={'keypad'}
                    size={20}
                    color={theme.iconNav}
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
        }

    }, [deviceEncryption, passcodeState]);

    const useBiometrics = (biometricsState === BiometricsState.InUse || biometricsState === null);
    const [biometricsToggleValue, setBiometricsToggleValue] = useState<boolean>(useBiometrics);

    useEffect(() => {
        const updateDeviceEncryption = () => {
            (async () => {
                const encryption = await getDeviceEncryption();
                setDeviceEncryption(encryption);
            })();
        };

        let sub = AppState.addEventListener('change', updateDeviceEncryption);
        updateDeviceEncryption();

        return () => sub.remove();
    }, []);

    // Update toggle if outer value updated
    useEffect(() => {
        setBiometricsToggleValue(biometricsState === BiometricsState.InUse);
    }, [biometricsState]);


    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
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
                    backgroundColor: theme.surfaceOnElevation,
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
                    backgroundColor: theme.surfaceOnElevation,
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
                            leftIcon={require('@assets/ic-change-passcode.png')}
                            title={t('security.passcodeSettings.setupTitle')}
                            onPress={() => navigation.navigate('PasscodeSetup')}
                        />
                    )}
                </View>
                <View style={{
                    marginBottom: 16,
                    backgroundColor: theme.surfaceOnElevation,
                    borderRadius: 20,
                    justifyContent: 'center',
                }}>
                    {biometricsProps && (
                        <>
                            {biometricsState !== BiometricsState.NotSet && (
                                <ItemSwitch
                                    title={biometricsProps.buttonText}
                                    value={biometricsToggleValue}
                                    // we can't disable biometrics if passcode is not set
                                    disabled={passcodeState !== PasscodeState.Set}
                                    leftIconComponent={deviceEncryption === 'face' ? undefined : biometricsProps.icon}
                                    leftIcon={deviceEncryption === 'face' ? require('@assets/ic-secure-face.png') : undefined}
                                    onChange={async (newValue: boolean) => {
                                        let oldValue = biometricsToggleValue;
                                        try {
                                            setBiometricsToggleValue(newValue);
                                            if (newValue) {
                                                await authContext.authenticateWithPasscode({ cancelable: true, backgroundColor: theme.elevation });
                                            } else {
                                                await authContext.authenticate({ cancelable: true, backgroundColor: theme.elevation });
                                            }
                                            setBiometricsState(newValue ? BiometricsState.InUse : BiometricsState.DontUse);
                                        } catch (e) {
                                            setBiometricsToggleValue(oldValue);
                                            warn('Failed to authenticate with passcode');
                                        }
                                    }}
                                />
                            )}
                            {(biometricsState === BiometricsState.NotSet) && (
                                <ItemButton
                                    leftIconComponent={deviceEncryption === 'face' ? undefined : biometricsProps.icon}
                                    leftIcon={deviceEncryption === 'face' ? require('@assets/ic-secure-face.png') : undefined}
                                    title={biometricsProps.buttonText}
                                    onPress={() => navigation.navigate('BiometricsSetup')}
                                />
                            )}
                        </>
                    )}
                </View>
                <View style={{
                    marginBottom: 4,
                    backgroundColor: theme.surfaceOnElevation,
                    borderRadius: 20,
                    justifyContent: 'center',
                }}>
                    <ItemSwitch
                        leftIcon={require('@assets/ic-block-app.png')}
                        title={t('secure.lockAppWithAuth')}
                        value={lockAppWithAuthState}
                        onChange={(newValue: boolean) => {
                            (async () => {
                                try {
                                    await authContext.authenticate({ cancelable: true, backgroundColor: theme.elevation })
                                    setLockAppWithAuthState(newValue);
                                } catch {
                                    // ignore
                                }
                            })();
                        }}
                        disabled={!canToggleAppAuth}
                    />
                </View>
                {!canToggleAppAuth && (
                    <Text style={[Typography.regular15_20, { color: theme.textSecondary, marginLeft: 20 }]}>
                        {t('mandatoryAuth.settingsDescription')}
                    </Text>
                )}
            </ScrollView>
        </View>
    )
})