import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/topbar/AndroidToolbar";
import { RoundButton } from "../../components/RoundButton";
import { FragmentMediaContent } from "../../components/FragmentMediaContent";
import { t } from "../../i18n/t";
import { systemFragment } from "../../systemFragment";
import { doUpgrade } from "../../storage/appState";
import { useReboot } from "../../utils/RebootContext";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useTheme } from '../../engine/hooks/useTheme';

export const WalletUpgradeFragment = systemFragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const safeArea = useSafeAreaInsets();
    const reboot = useReboot();
    const navigation = useTypedNavigation();
    const onUpgrade = React.useCallback(async () => {
        await doUpgrade(isTestnet);
        reboot();
    }, []);
    const onBackup = React.useCallback(() => {
        navigation.navigate('WalletBackup', { back: true });
    }, []);
    return (
        <View style={{
            flexGrow: 1,
            alignSelf: 'stretch', alignItems: 'center',
            backgroundColor: theme.item,
            paddingTop: Platform.OS === 'android' ? safeArea.top : 0,
            paddingBottom: Platform.OS === 'ios' ? (safeArea.bottom ?? 0) + 16 : 0,
        }}>
            <AndroidToolbar pageTitle={t('secure.upgradeTitle')} />
            <View style={{ flexGrow: 1 }} />
            <FragmentMediaContent
                animation={require('../../../assets/animations/lock.json')}
                title={t('secure.upgradeTitle')}
            >
                <Text style={{
                    textAlign: 'center',
                    color: theme.textSubtitle,
                    fontSize: 16,
                    marginTop: 14,
                }}>
                    {t('secure.upgradeMessage')}
                </Text>
            </FragmentMediaContent >
            <View style={{ flexGrow: 1 }} />
            <View style={{ height: 128, marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton title={t('secure.allowUpgrade')} action={onUpgrade} />
                <Pressable
                    onPress={onBackup}
                    style={({ pressed }) => {
                        return {
                            opacity: pressed ? 0.5 : 1,
                            alignSelf: 'center',
                            marginTop: 26,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }
                    }}
                >
                    <Text style={{
                        fontSize: 17,
                        fontWeight: '600',
                        color: theme.accentText
                    }}>
                        {t('secure.backup')}
                    </Text>
                </Pressable>
            </View>
        </View >
    );
});