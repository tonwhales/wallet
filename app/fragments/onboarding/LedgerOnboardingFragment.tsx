import React, { useCallback } from "react";
import { Platform, ScrollView, Text, View, Image, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";
import { systemFragment } from "../../systemFragment";
import { useTheme } from '../../engine/hooks';
import { ScreenHeader } from "../../components/ScreenHeader";

import { ledgerImages } from "../ledger/HardwareWalletFragment";
import { Typography } from "../../components/styles";

export const LedgerOnboardingFragment = systemFragment(() => {
    const theme = useTheme();
    const dimensions = useWindowDimensions();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();

    const onContinue = useCallback(() => {
        navigation.navigate('LegalCreate', { ledger: true });
    }, []);

    return (
        <View style={{
            flexGrow: 1,
            alignSelf: 'stretch', alignItems: 'center',
            backgroundColor: theme.backgroundPrimary,
            paddingTop: Platform.OS === 'android' ? safeArea.top : 16,
        }}>
            <ScreenHeader
                style={[{ paddingLeft: 16 }, Platform.select({ ios: { paddingTop: 16 } })]}
                onBackPressed={navigation.goBack}
            />
            <ScrollView style={{ width: '100%', height: dimensions.window.height - (Platform.OS === 'android' ? safeArea.top : 32) - 224 }}>
                <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                    <Text style={[Typography.semiBold32_38, {
                        textAlign: 'center',
                        color: theme.textPrimary,
                        marginBottom: 12, marginTop: 16
                    }]}>
                        {t('ledgerOnboarding.title')}
                    </Text>
                    <Text
                        style={[Typography.regular17_24, {
                            textAlign: 'center',
                            flexShrink: 1,
                            color: theme.textSecondary,
                            marginBottom: 24
                        }]}
                    >
                        {t('ledgerOnboarding.description')}
                    </Text>
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        aspectRatio: 0.92,
                        width: dimensions.width - 32,
                    }}>
                        <Image
                            style={{
                                width: dimensions.width - 32,
                                height: dimensions.width - 32,
                                overflow: 'hidden'
                            }}
                            height={dimensions.width - 32}
                            width={dimensions.width - 32}
                            source={
                                ledgerImages[Platform.OS === 'android' ? 'android' : 'ios'][theme.style]
                            }
                            resizeMode={'contain'}
                        />
                    </View>
                </View>
            </ScrollView>
            <View style={{ flexGrow: 1 }} />
            <View style={[{ paddingHorizontal: 16, width: '100%' }, Platform.select({ android: { paddingBottom: 16 } })]}>
                <RoundButton
                    title={t('ledgerOnboarding.button')}
                    onPress={onContinue}
                />
            </View>
        </View>
    );
});