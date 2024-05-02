import { View, Platform, Text, Pressable } from "react-native";
import { useCallback, useMemo } from "react";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useHoldersAccountStatus, useIsConnectAppReady, useNetwork, useSelectedAccount, useStakingApy, useTheme } from "../../engine/hooks";
import { HoldersAccountState, holdersUrl as resolveHoldersUrl } from "../../engine/api/holders/fetchAccountState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { t } from "../../i18n/t";
import { ProductBanner } from "../../components/products/ProductBanner";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsHoldersWhitelisted } from "../../engine/hooks/holders/useIsHoldersWhitelisted";
import { Typography } from "../../components/styles";

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
    const isHoldersWhitelisted = useIsHoldersWhitelisted(selected!.address, network.isTestnet);

    const apyWithFee = useMemo(() => {
        if (!!apy) {
            return (apy - apy * (5 / 100)).toFixed(2)
        }
    }, [apy]);

    const needsEnrolment = useMemo(() => {
        if (status?.state === HoldersAccountState.NeedEnrollment) {
            return true;
        }
        return false;
    }, [status]);

    const onHolders = useCallback(() => {
        // we are not using .replace(...) here because of wierd animation
        navigation.goBack();

        if (needsEnrolment || !isHoldersReady) {
            navigation.navigate(
                'HoldersLanding',
                { endpoint: holdersUrl, onEnrollType: { type: 'create' } }
            );
            return;
        }

        navigation.navigate('Holders', { type: 'create' });
    }, [needsEnrolment, isHoldersReady]);

    return (
        <View style={{ flexGrow: 1, paddingBottom: safeArea.bottom }}>
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark', ios: 'light' })} />
            {Platform.OS === 'android' ? (
                <ScreenHeader
                    onBackPressed={navigation.goBack}
                    style={{ paddingTop: safeArea.top, paddingHorizontal: 16 }}
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
                {isHoldersWhitelisted && (
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
                <View style={{ marginTop: isHoldersWhitelisted ? 16 : 0 }}>
                    <ProductBanner
                        onPress={() => {
                            navigation.goBack();
                            navigation.navigate('StakingPools');
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