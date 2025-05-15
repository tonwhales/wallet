import { View, Platform, Text, Pressable } from "react-native";
import { useCallback, useMemo } from "react";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useHoldersAccountStatus, useIsConnectAppReady, useNetwork, useSelectedAccount, useStakingApy, useTheme } from "../../engine/hooks";
import { HoldersUserState, holdersUrl as resolveHoldersUrl } from "../../engine/api/holders/fetchUserState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { t } from "../../i18n/t";
import { ProductBanner } from "../../components/products/ProductBanner";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsHoldersInvited } from "../../engine/hooks/holders/useIsHoldersInvited";
import { Typography } from "../../components/styles";
import { HoldersAppParamsType } from "../holders/HoldersAppFragment";

export const ProductsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const network = useNetwork();
    const safeArea = useSafeAreaInsets();
    const apy = useStakingApy()?.apy;
    const selected = useSelectedAccount();
    const status = useHoldersAccountStatus(selected!.address).data;
    const holdersUrl = resolveHoldersUrl(network.isTestnet);
    const isHoldersReady = useIsConnectAppReady(holdersUrl);
    const inviteCheck = useIsHoldersInvited(selected!.address, network.isTestnet);

    const apyWithFee = useMemo(() => {
        if (!!apy) {
            return (apy - apy * (5 / 100)).toFixed(2)
        }
    }, [apy]);

    const needsEnrolment = useMemo(() => {
        if (status?.state === HoldersUserState.NeedEnrollment) {
            return true;
        }
        return false;
    }, [status]);

    const onHolders = useCallback(() => {
        // we are not using .replace(...) here because of wierd animation
        navigation.goBack();

        if (needsEnrolment || !isHoldersReady) {
            navigation.navigateHoldersLanding({ endpoint: holdersUrl, onEnrollType: { type: HoldersAppParamsType.Create } }, network.isTestnet);
            return;
        }

        navigation.navigateHolders({ type: HoldersAppParamsType.Create }, network.isTestnet);
    }, [needsEnrolment, isHoldersReady, network.isTestnet]);

    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark', ios: 'light' })} />
            {Platform.OS === 'android' ? (
                <ScreenHeader
                    onBackPressed={navigation.goBack}
                    style={{ paddingTop: safeArea.top, paddingHorizontal: 16, backgroundColor: theme.elevation }}
                />
            ) : (
                <Pressable onPress={Platform.select({ ios: navigation.goBack })} style={{ flexGrow: 1 }} />
            )}

            <View style={[
                {
                    backgroundColor: theme.elevation,
                    paddingHorizontal: 16,
                    paddingBottom: safeArea.bottom + 32
                },
                Platform.select({
                    ios: {
                        flexShrink: 1,
                        flexGrow: 0,
                        borderTopEndRadius: 20,
                        borderTopStartRadius: 20,
                        paddingTop: 40
                    },
                    android: { flexGrow: 1 }
                })
            ]}>
                <Text style={[{ marginBottom: 24, color: theme.textPrimary }, Typography.semiBold32_38]}>
                    {t('products.addNew')}
                </Text>
                {inviteCheck?.allowed && (
                    <ProductBanner
                        title={t('products.holders.card.defaultTitle')}
                        subtitle={t('products.holders.card.defaultSubtitle')}
                        reverse
                        onPress={onHolders}
                        illustration={require('@assets/banners/banner-holders.webp')}
                        style={{ backgroundColor: theme.surfaceOnElevation }}
                        illustrationStyle={{ backgroundColor: theme.elevation }}
                    />
                )}
                <View style={{ marginTop: inviteCheck?.allowed ? 16 : 0 }}>
                    <ProductBanner
                        onPress={() => {
                            navigation.goBack();
                            navigation.navigateStakingPools()
                        }}
                        reverse
                        title={t('products.staking.title')}
                        subtitle={network.isTestnet ? t('products.staking.subtitle.devPromo') : t("products.staking.subtitle.join", { apy: apyWithFee ?? '8' })}
                        illustration={require('@assets/banners/banner-staking.webp')}
                        style={{ backgroundColor: theme.surfaceOnElevation }}
                        illustrationStyle={{ backgroundColor: theme.elevation }}
                    />
                </View>
            </View>
        </View>
    );
});