import { useFocusEffect } from "@react-navigation/native"
import { StatusBar } from "expo-status-bar"
import { Platform, View, Text, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { AndroidToolbar } from "../components/AndroidToolbar"
import { CloseButton } from "../components/CloseButton"
import { ItemButton } from "../components/ItemButton"
import { fragment } from "../fragment"
import { t } from "../i18n/t"
import { PasscodeState, passcodeStateKey } from "../storage/secureStorage"
import { storage } from "../storage/storage"
import { Theme } from "../Theme"
import { useTypedNavigation } from "../utils/useTypedNavigation"
import { useState } from "react"

export const SecurityFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const [passcodeState, setpasscodeState] = useState(storage.getString(passcodeStateKey));

    useFocusEffect(() => { setpasscodeState(storage.getString(passcodeStateKey)) });

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
                </View>
            </ScrollView>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    )
})