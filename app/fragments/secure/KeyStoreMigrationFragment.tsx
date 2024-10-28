import { View, Image, Alert, Platform, ScrollView, Text, useWindowDimensions } from "react-native";
import { systemFragment } from "../../systemFragment";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { useCallback, useState } from "react";
import { useNetwork, useTheme } from '../../engine/hooks';
import { t } from "../../i18n/t";
import { PasscodeState, getPasscodeState, migrateAndroidKeyStore } from "../../storage/secureStorage";
import { useKeysAuth } from "../../components/secure/AuthWalletKeys";
import { LoadingIndicator } from "../../components/LoadingIndicator";
import { FragmentMediaContent } from "../../components/FragmentMediaContent";
import { StatusBar } from "expo-status-bar";
import { resolveOnboarding } from "../resolveOnboarding";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import * as KeyStore from "../../storage/modules/KeyStore";

export const KeyStoreMigrationFragment = systemFragment(() => {
    const theme = useTheme();
    const authContext = useKeysAuth();
    const safeArea = useSafeAreaInsets();
    const network = useNetwork();
    const navigation = useTypedNavigation();
    const [state, setState] = useState<'loading' | undefined>();
    const dimensions = useWindowDimensions();

    const onStart = useCallback(async () => {
        setState('loading');
        try {
            const passcodeSet = getPasscodeState() === PasscodeState.Set;
            const securityLevel = await KeyStore.getEnrolledLevelAsync();

            // using only strong biometric encryption
            if (securityLevel !== KeyStore.SecurityLevel.BIOMETRIC) {
                // if no biometry set up, force passcode setup
                if (!passcodeSet) {
                    navigation.navigateAndReplaceAll(
                        'PasscodeSetupInit',
                        { forceSetup: true }
                    );
                    return;
                }
            } else {
                // if passcode is set, mirgate using passcode
                if (passcodeSet) {
                    const res = await authContext.authenticateWithPasscode();
                    await migrateAndroidKeyStore(res.passcode);
                } else {
                    await migrateAndroidKeyStore();
                }
            }

            const route = resolveOnboarding(network.isTestnet, false);
            navigation.navigateAndReplaceAll(route);
        } catch {
            Alert.alert(t('common.error'), t('migrate.failed'));
            setState(undefined);
        }
    }, []);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark' })} />
            <AndroidToolbar style={{ marginTop: safeArea.top }} />
            {state === 'loading' ? (
                <View style={{
                    position: 'absolute', bottom: 0, top: 0, left: 0, right: 0,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <LoadingIndicator simple />
                </View>
            ) : (
                <>
                    <View style={{ flexGrow: 1 }} />
                    <ScrollView style={{ width: '100%', height: dimensions.height - (Platform.OS === 'android' ? safeArea.top : 32) - 224 }}>
                        <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                            <Text style={{
                                fontSize: 32, lineHeight: 38,
                                fontWeight: '600',
                                textAlign: 'center',
                                color: theme.textPrimary,
                                marginBottom: 12, marginTop: 16
                            }}>
                                {t('migrate.keyStoreTitle')}
                            </Text>
                            <Text
                                style={{
                                    textAlign: 'center',
                                    fontSize: 17,
                                    fontWeight: '400',
                                    flexShrink: 1,
                                    color: theme.textSecondary,
                                    marginBottom: 24
                                }}
                            >
                                {t('migrate.keyStoreSubtitle')}
                            </Text>
                            <View style={{
                                justifyContent: 'center', alignItems: 'center',
                                aspectRatio: 0.92,
                                width: dimensions.width - 32,
                            }}>
                                <Image
                                    resizeMode={'contain'}
                                    style={{ width: dimensions.width - 32 }}
                                    source={theme.style === 'dark' ? require('@assets/banner_backup_dark.webp') : require('@assets/banner_backup.webp')}
                                />
                            </View>
                        </View>
                    </ScrollView>
                    <View style={{ flexGrow: 1 }} />
                    <View style={{ marginHorizontal: 16, marginBottom: 16 + safeArea.bottom }}>
                        <RoundButton
                            title={t('common.start')}
                            onPress={onStart}
                            icon={<Image
                                source={require('../../../assets/ic_privacy.png')}
                                style={{ tintColor: theme.surfaceOnBg, height: 24, width: 24 }}
                            />}
                        />
                    </View>
                </>
            )}
        </View>
    );
});