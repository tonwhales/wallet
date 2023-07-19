import { View, Text, ScrollView } from "react-native";
import { fragment } from "../fragment";
import { CloseButton } from "../components/CloseButton";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { t } from "../i18n/t";
import { ProductBanner } from "../components/products/ProductBanner";
import { useEngine } from "../engine/Engine";
import { useAppConfig } from "../utils/AppConfigContext";
import { useCallback, useMemo } from "react";
import { extractDomain } from "../engine/utils/extractDomain";
import { holdersUrl } from "../engine/corp/HoldersProduct";
import { BN } from "bn.js";

export const ProductsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const { AppConfig } = useAppConfig();
    const engine = useEngine();
    const totalStaked = engine.products.whalesStakingPools.useStaking().total;
    const apy = engine.products.whalesStakingPools.useStakingApy()?.apy;
    const apyWithFee = useMemo(() => {
        if (!!apy) {
            return (apy - apy * (5 / 100)).toFixed(2)
        }
    }, [apy]);

    const status = engine.products.holders.useStatus();

    const needsEnrolment = useMemo(() => {
        try {
            let domain = extractDomain(holdersUrl);
            if (!domain) {
                return; // Shouldn't happen
            }
            let domainKey = engine.products.keys.getDomainKey(domain);
            if (!domainKey) {
                return true;
            }
            if (status.state === 'need-enrolment') {
                return true;
            }
        } catch (error) {
            return true;
        }
        return false;
    }, [status]);

    const onHolders = useCallback(
        () => {
            if (needsEnrolment) {
                navigation.replace(
                    'ZenPayLanding',
                    {
                        endpoint: holdersUrl,
                        onEnrollType: { type: 'account' }
                    }
                );
                return;
            }
            navigation.replace('ZenPay', { type: 'account' });
        },
        [needsEnrolment],
    );

    return (
        <View style={{ backgroundColor: 'white', flexGrow: 1 }}>
            <View style={{ height: 64 }} />
            <Text style={{ marginHorizontal: 16, fontSize: 32, fontWeight: '600', lineHeight: 38, flexShrink: 1 }}>
                {t('products.addNew')}
            </Text>
            <ScrollView style={{ marginTop: 24 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {AppConfig.isTestnet && (
                    <ProductBanner
                        title={t('products.zenPay.card.defaultTitle')}
                        subtitle={t('products.zenPay.card.defaultSubtitle')}
                        reverse
                        onPress={onHolders}
                        illustration={require('../../assets/banner-holders.png')}
                    />
                )}
                <View style={{ marginTop: AppConfig.isTestnet ? 16 : 0 }}>
                    <ProductBanner
                        onPress={() => navigation.replace('StakingPools')}
                        reverse
                        title={t('products.staking.title')}
                        subtitle={AppConfig.isTestnet ? t('products.staking.subtitle.devPromo') : t("products.staking.subtitle.join", { apy: apyWithFee ?? '8' })}
                        illustration={require('../../assets/banner-staking.png')}
                    />
                </View>
            </ScrollView>
            <CloseButton style={{ position: 'absolute', top: 22, right: 16 }} />
        </View>
    );
});