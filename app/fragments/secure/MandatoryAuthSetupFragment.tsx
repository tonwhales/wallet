import { Platform, View, Text, Image } from "react-native";
import { fragment } from "../../fragment";
import { AuthRejectReason, useKeysAuth } from "../../components/secure/AuthWalletKeys";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../../engine/hooks";
import { ScreenHeader } from "../../components/ScreenHeader";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useParams } from "../../utils/useParams";
import { Typography } from "../../components/styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDimensions } from "@react-native-community/hooks";
import { CheckBox } from "../../components/CheckBox";
import { useCallback, useEffect, useState } from "react";
import { ScrollView } from "react-native-gesture-handler";
import { RoundButton } from "../../components/RoundButton";
import { useAppAuthMandatory, useLockAppWithAuthState } from "../../engine/hooks/settings";
import { useToaster } from "../../components/toast/ToastProvider";

import WarningIcon from '@assets/ic-warning-banner.svg';

export type MandatoryAuthSetupParams = { callback?: (ok: boolean) => void };

export const MandatoryAuthSetupFragment = fragment(() => {
    const dimensions = useDimensions();
    const authContext = useKeysAuth();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const toaster = useToaster();
    const theme = useTheme();
    const { callback } = useParams<MandatoryAuthSetupParams>();
    const [secured, setSecured] = useState(false);
    const [mandatoryAuth, setMandatoryAuth] = useAppAuthMandatory();
    const [lockAppWithAuth, setLockAppWithAuth] = useLockAppWithAuthState();

    const onCallback = (ok: boolean) => {
        navigation.goBack();
        callback?.(ok);
    };

    const turnAuthOn = useCallback(async () => {
        try {
            // authenticate and switch mandatory auth on
            if (!lockAppWithAuth) {
                await authContext.authenticate({ cancelable: true, backgroundColor: theme.elevation });
                setLockAppWithAuth(true);
            }

            setMandatoryAuth(true);
            onCallback(true);

        } catch (reason) {
            if (reason === AuthRejectReason.Canceled) {
                toaster.show({ message: t('security.auth.canceled.title'), type: 'default' });
            } else if (typeof reason !== 'string') {
                toaster.show({ message: t('products.tonConnect.errors.unknown'), type: 'default' });
            }
        }
    }, [mandatoryAuth, lockAppWithAuth]);

    return (
        <View style={{
            alignItems: 'center',
            flexGrow: 1
        }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                onBackPressed={() => onCallback(false)}
                style={[Platform.select({ android: { marginTop: safeArea.top } }), { paddingHorizontal: 16 }]}
            />
            <ScrollView
                style={{ flexBasis: 0, width: '100%' }}
                contentContainerStyle={{ alignItems: 'center' }}
                horizontal={false}
            >
                <View style={{ paddingHorizontal: 16, gap: 12 }}>
                    <Text style={[{ color: theme.textPrimary, textAlign: 'center' }, Typography.semiBold32_38]}>
                        {t('mandatoryAuth.title')}
                    </Text>
                    <Text style={[{ color: theme.textSecondary, textAlign: 'center' }, Typography.regular17_24]}>
                        {t('mandatoryAuth.description')}
                    </Text>
                </View>
                <View style={{
                    padding: 20, marginTop: 16, marginHorizontal: 16,
                    borderRadius: 20, borderWidth: 1, borderColor: theme.warning,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 16
                }}>
                    <WarningIcon height={48} width={48} />
                    <Text style={[{ color: theme.textSecondary, textAlign: 'left', flexShrink: 1 }, Typography.regular17_24]}>
                        {t('mandatoryAuth.alert')}
                    </Text>
                </View>
                <View style={{
                    justifyContent: 'center', alignItems: 'center',
                    aspectRatio: 1,
                    width: dimensions.screen.width - 128,
                    marginTop: -16
                }}>
                    <Image
                        resizeMode={'contain'}
                        style={{ width: dimensions.screen.width - 128 }}
                        source={theme.style === 'dark' ? require('@assets/banner_backup_dark.webp') : require('@assets/banner_backup.webp')}
                    />
                </View>
            </ScrollView>
            <View style={{
                paddingLeft: 16,
                paddingRight: 62,
                marginBottom: 24,
                width: '100%'
            }}>
                <CheckBox
                    checked={secured}
                    onToggle={setSecured}
                    text={
                        <Text style={{ marginLeft: 16, color: theme.textSecondary }}>
                            {t('mandatoryAuth.confirmDescription')}
                        </Text>
                    }
                    style={{ marginTop: 16 }}
                />
            </View>
            <View style={[{
                paddingHorizontal: 16,
                height: 128,
                gap: 8,
                alignSelf: 'stretch',
            }, Platform.select({
                ios: { marginBottom: safeArea.bottom === 0 ? 40 : safeArea.bottom + 8 }
            })]}>
                <RoundButton
                    disabled={!secured}
                    title={t('mandatoryAuth.action')}
                    action={turnAuthOn}
                />
                <RoundButton
                    display={'secondary'}
                    title={t('settings.backupKeys')}
                    onPress={() => navigation.navigate('WalletBackup', { back: true })}
                />
            </View>
        </View>
    );
})