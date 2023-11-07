import { View, ScrollView } from "react-native";
import { useCallback, useMemo } from "react";
import { setStatusBarStyle } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { fragment } from "../../fragment";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useDomainKey, useHoldersAccountStatus, useNetwork, useSelectedAccount, useStakingApy, useTheme } from "../../engine/hooks";
import { extractDomain } from "../../engine/utils/extractDomain";
import { HoldersAccountState, holdersUrl } from "../../engine/api/holders/fetchAccountState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { t } from "../../i18n/t";
import { ProductBanner } from "../../components/products/ProductBanner";

export const ProductsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const network = useNetwork();
    const apy = useStakingApy()?.apy;
    const seleted = useSelectedAccount();
    const status = useHoldersAccountStatus(seleted!.address).data;

    const apyWithFee = useMemo(() => {
        if (!!apy) {
            return (apy - apy * (5 / 100)).toFixed(2)
        }
    }, [apy]);

    const domain = extractDomain(holdersUrl);
    const domainKey = useDomainKey(domain);

    const needsEnrolment = useMemo(() => {
        try {
            if (!domain) {
                return; // Shouldn't happen
            }
            if (!domainKey) {
                return true;
            }
            if (status?.state === HoldersAccountState.NeedEnrollment) {
                return true;
            }
        } catch (error) {
            return true;
        }
        return false;
    }, [status, domainKey]);

    const onHolders = useCallback(
        () => {
            if (needsEnrolment) {
                navigation.navigate(
                    'HoldersLanding',
                    {
                        endpoint: holdersUrl,
                        onEnrollType: { type: 'account' }
                    }
                );
                return;
            }
            navigation.navigate('Holders', { type: 'account' });
        },
        [needsEnrolment],
    );

    useFocusEffect(() => {
        setTimeout(() => {
            setStatusBarStyle(theme.style === 'dark' ? 'light' : 'dark');
        }, 10);
    });

    return (
        <View style={{ backgroundColor: theme.background, flexGrow: 1 }}>
            <ScreenHeader
                style={{ paddingTop: 32, paddingHorizontal: 16 }}
                title={t('products.addNew')}
                statusBarStyle={theme.style === 'dark' ? 'light' : 'dark'}
                onBackPressed={navigation.goBack}
            />
            <ScrollView style={{ marginTop: 24 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {network.isTestnet && (
                    <ProductBanner
                        title={t('products.holders.card.defaultTitle')}
                        subtitle={t('products.holders.card.defaultSubtitle')}
                        reverse
                        onPress={onHolders}
                        illustration={require('@assets/banners/banner-holders.png')}
                    />
                )}
                <View style={{ marginTop: network.isTestnet ? 16 : 0 }}>
                    <ProductBanner
                        onPress={() => navigation.replace('StakingPools')}
                        reverse
                        title={t('products.staking.title')}
                        subtitle={network.isTestnet ? t('products.staking.subtitle.devPromo') : t("products.staking.subtitle.join", { apy: apyWithFee ?? '8' })}
                        illustration={require('@assets/banners/banner-staking.png')}
                    />
                </View>
            </ScrollView>
        </View>
    );
});