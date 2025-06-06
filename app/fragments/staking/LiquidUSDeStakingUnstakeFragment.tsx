import { Platform, View, Text } from "react-native"
import { fragment } from "../../fragment"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useNetwork, useTheme } from "../../engine/hooks";
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "../../components/ScreenHeader";
import { Typography } from "../../components/styles";

export const LiquidUSDeStakingUnstakeFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const { isTestnet } = useNetwork();

    const onUnstake = () => {
        navigation.navigate('LiquidUSDeStakingTransfer', { action: 'unstake' });
    }

    const onSwap = () => {
        navigation.replace('DAppWebView', {
            url: 'https://dedust.io/swap/EQDQ5UUyPHrLcQJlPAczd_fjxn8SLrlNQwolBznxCdSlfQwr/EQAIb6KmdfdDR7CN1GBqVJuP25iCnLKCvBlJ07Evuu2dzP5f',
            header: {
                title: { type: 'params', params: { title: 'DeDust.io', domain: 'dedust.io' } },
                onClose: navigation.goBack
            },
            engine: 'ton-connect',
            useStatusBar: true,
            defaultQueryParamsState: { lockScroll: false }
        });
    }

    return (
        <View style={{
            flexGrow: 1,
            justifyContent: 'flex-end',
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            paddingBottom: safeArea.bottom === 0 ? 32 : safeArea.bottom,
            backgroundColor: Platform.OS === 'android' ? theme.backgroundPrimary : undefined,
        }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            {Platform.OS === 'android' ? (
                <ScreenHeader
                    onClosePressed={navigation.goBack}
                />
            ) : (
                <View style={{ flexGrow: 1 }} />
            )}
            <View style={[
                {
                    flexShrink: Platform.OS === 'ios' ? 1 : undefined,
                    flexGrow: Platform.OS === 'ios' ? 0 : 1,
                    backgroundColor: Platform.OS === 'android' ? theme.backgroundPrimary : theme.elevation,
                    borderTopEndRadius: Platform.OS === 'android' ? 0 : 20,
                    borderTopStartRadius: Platform.OS === 'android' ? 0 : 20,
                    padding: 16,
                    paddingBottom: safeArea.bottom + 16,
                },
                Platform.select({ android: { flexGrow: 1 } })
            ]}>
                <Text style={[{
                    color: theme.textPrimary,
                    marginBottom: 12,
                    marginTop: Platform.OS === 'ios' ? 16 : 0,
                }, Typography.semiBold32_38]}>
                    {t('products.staking.unstakeLiquidUsde.title')}
                </Text>
                <Text style={[{
                    color: theme.textSecondary,
                    marginBottom: 36,
                }, Typography.regular17_24]}>
                    {t('products.staking.unstakeLiquidUsde.message')}
                    <Text style={{ color: theme.accent }}>
                        {'DeDust.io'}
                    </Text>
                </Text>
                {Platform.OS === 'android' && (
                    <View style={{ flexGrow: 1 }} />
                )}
                {!isTestnet && (
                    <RoundButton
                        style={{ marginBottom: 16 }}
                        title={t('products.staking.actions.swap')}
                        onPress={onSwap}
                    />
                )}
                <RoundButton
                    style={{ marginBottom: 16 }}
                    title={t('products.staking.actions.withdraw')}
                    display={'secondary'}
                    onPress={onUnstake}
                />
            </View>
        </View>
    );
});