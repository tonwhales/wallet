import React from "react";
import { useRoute } from "@react-navigation/native";
import { Platform, ScrollView, Text, View, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";
import { systemFragment } from "../../systemFragment";
import { useTheme } from '../../engine/hooks';
import { useDimensions } from "@react-native-community/hooks";
import { ScreenHeader } from "../../components/ScreenHeader";
import { getBackup, markAddressSecured } from "../../storage/appState";

export const BackupIntroFragment = systemFragment(() => {
    const theme = useTheme();
    const dimensions = useDimensions();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const route = useRoute();

    return (
        <View style={{
            flexGrow: 1,
            alignSelf: 'stretch', alignItems: 'center',
            backgroundColor: theme.backgroundPrimary,
            paddingTop: Platform.OS === 'android' ? safeArea.top : 16,
        }}>
            <ScreenHeader />
            <ScrollView style={{ width: '100%', height: dimensions.window.height - (Platform.OS === 'android' ? safeArea.top : 32) - 224 }}>
                <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                    <Text style={{
                        fontSize: 32, lineHeight: 38,
                        fontWeight: '600',
                        textAlign: 'center',
                        color: theme.textPrimary,
                        marginBottom: 12, marginTop: 16
                    }}>
                        {t('backupIntro.title')}
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
                        {t('backupIntro.subtitle')}
                    </Text>
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        aspectRatio: 0.92,
                        width: dimensions.screen.width - 32,
                    }}>
                        <Image
                            resizeMode={'contain'}
                            style={{ width: dimensions.screen.width - 32 }}
                            source={theme.style === 'dark' ? require('@assets/banner_backup_dark.webp') : require('@assets/banner_backup.webp')}
                        />
                    </View>
                </View>
            </ScrollView>
            <View style={{ flexGrow: 1 }} />
            <View style={[{ paddingHorizontal: 16, width: '100%', gap: 16 }, Platform.select({ android: { paddingBottom: 16 } })]}>
                <RoundButton
                    title={t('backupIntro.saved')}
                    onPress={() => {
                        const address = getBackup();
                        markAddressSecured(address.address);
                        navigation.navigateAndReplaceAll('Home');
                    }}
                />
                <RoundButton
                    title={t('backupIntro.goToBackup')}
                    onPress={() => {
                        navigation.replace('WalletBackupInit');
                    }}
                    display={'secondary'}
                />
            </View>
        </View>
    );
});