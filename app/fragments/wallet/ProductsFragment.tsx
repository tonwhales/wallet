import { View, Platform, Text, Pressable } from "react-native";
import { useCallback, useMemo } from "react";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useHoldersAccountStatus, useIsConnectAppReady, useNetwork, useSelectedAccount, useStakingApy, useTheme } from "../../engine/hooks";
import { HoldersAccountState, holdersUrl } from "../../engine/api/holders/fetchAccountState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { t } from "../../i18n/t";
import { ProductBanner } from "../../components/products/ProductBanner";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ProductsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const network = useNetwork();
    const safeArea = useSafeAreaInsets();
    const apy = useStakingApy()?.apy;
    const seleted = useSelectedAccount();
    const status = useHoldersAccountStatus(seleted!.address).data;
    const isHoldersReady = useIsConnectAppReady(holdersUrl);

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

            <View style={{
                flexShrink: Platform.OS === 'ios' ? 1 : undefined,
                flexGrow: Platform.OS === 'ios' ? 0 : 1,
                backgroundColor: theme.elevation,
                borderTopEndRadius: Platform.OS === 'android' ? 0 : 20,
                borderTopStartRadius: Platform.OS === 'android' ? 0 : 20,
                paddingHorizontal: 16,
                paddingTop: Platform.OS === 'android' ? 0 : 40,
                paddingBottom: safeArea.bottom + 32
            }}>
                <Text
                    style={{
                        fontSize: 32,
                        fontWeight: '600',
                        marginBottom: 24,
                        color: theme.textPrimary
                    }}
                >
                    {t('products.addNew')}
                </Text>
                {network.isTestnet && (
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
                <View style={{ marginTop: network.isTestnet ? 16 : 0 }}>
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