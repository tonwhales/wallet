import { View, Text } from "react-native";
import { systemFragment } from "../../systemFragment";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable } from "react-native";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";
import { useNetwork, useTheme } from "../../engine/hooks";
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useCallback } from "react";
import { MixpanelEvent, trackEvent } from "../../analytics/mixpanel";
import { isTermsAccepted } from "../../storage/terms";
import { Typography } from "../../components/styles";

export const WalletImportSelectorFragment = systemFragment(() => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { isTestnet } = useNetwork();

    const onSeedPressed = useCallback(() => {
        trackEvent(MixpanelEvent.WalletImport, undefined, isTestnet, true);
        // Closing bottom sheet on iOS
        Platform.OS === 'ios' && navigation.goBack();
        // Wait for the animation to finish
        setTimeout(() => {
            if (isTermsAccepted()) {
                navigation.navigate('WalletImport');
            } else {
                navigation.navigate('LegalImport');
            }
        });
    }, []);

    const onLedgerPressed = () => {
        Platform.OS === 'ios' && navigation.goBack();
        // Wait for the animation to finish
        setTimeout(() => {
            navigation.navigate('LedgerOnboarding');
        });
    };

    return (
        <View style={{
            flexGrow: 1,
            justifyContent: 'flex-end',
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            paddingBottom: safeArea.bottom
        }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            {Platform.OS === 'android' && (
                <ScreenHeader
                    onClosePressed={navigation.goBack}
                />
            )}
            {Platform.OS === 'ios' && (
                <View style={{ flexGrow: 1 }} />
            )}
            <Pressable
                onPress={navigation.goBack}
                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
            />
            <View style={{
                height: Platform.OS === 'android' ? undefined : 294 + (safeArea.bottom === 0 ? 32 : safeArea.bottom + 16),
                flexGrow: Platform.OS === 'ios' ? 0 : 1,
                backgroundColor: theme.backgroundPrimary,
                borderTopEndRadius: 20, borderTopStartRadius: 20,
                padding: 16,
                paddingBottom: safeArea.bottom === 0 ? 32 : safeArea.bottom + 16
            }}>
                <Text style={[Typography.semiBold32_38, {
                    color: theme.textPrimary,
                    marginTop: 16,
                }]}>
                    {t('walletImportSelector.title')}
                </Text>

                <Text style={[Typography.regular17_24, {
                    color: theme.textSecondary,
                    marginTop: 12,
                }]}>
                    {t('walletImportSelector.description')}
                </Text>
                <View style={{ flexGrow: 1 }} />

                <RoundButton
                    title={t('walletImportSelector.seed')}
                    onPress={onSeedPressed}
                    style={{ height: 56, marginBottom: 16 }}
                />
                <RoundButton
                    title={t('hardwareWallet.actions.connect')}
                    onPress={onLedgerPressed}
                    style={{ height: 56, marginBottom: 16 }}
                    display={'secondary'}
                />
            </View>
        </View>
    );
});