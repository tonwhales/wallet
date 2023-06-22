import { StatusBar } from "expo-status-bar"
import { Platform, View, Text, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { CloseButton } from "../components/CloseButton"
import { ItemButton } from "../components/ItemButton"
import { fragment } from "../fragment"
import { t } from "../i18n/t"
import { PasscodeState } from "../storage/secureStorage"
import { useTypedNavigation } from "../utils/useTypedNavigation"
import { useAppConfig } from "../utils/AppConfigContext"
import { useEngine } from "../engine/Engine"
import { AndroidToolbar } from "../components/topbar/AndroidToolbar"
import { getCurrentAddress } from "../storage/appState"

export const SecurityFragment = fragment(() => {
    const engine = useEngine();
    const settings = engine.products.settings;
    const acc = getCurrentAddress();
    const { Theme } = useAppConfig();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const passcodeState = settings.usePasscodeState(acc.address);

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
                        <>
                            <View style={{ marginHorizontal: 16, width: '100%' }}>
                                <ItemButton
                                    leftIcon={require('../../assets/ic_passcode.png')}
                                    title={t('security.passcodeSettings.changeTitle')}
                                    onPress={() => navigation.navigate('PasscodeChange')}
                                />
                            </View>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 + 24 }} />
                            <View style={{ marginHorizontal: 16, width: '100%' }}>
                                <ItemButton
                                    leftIcon={require('../../assets/ic_reset.png')}
                                    title={t('security.passcodeSettings.resetTitle')}
                                    onPress={() => navigation.navigate('PasscodeReset')}
                                />
                            </View>
                        </>
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
                </View>
            </ScrollView>
            <CloseButton style={{ position: 'absolute', top: 22, right: 16 }} />
        </View>
    )
})