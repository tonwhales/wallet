import React, { useCallback, useMemo } from "react"
import { View } from "react-native";
import { useEngine } from "../../engine/Engine";
import { ProductBanner } from "./ProductBanner";
import { t } from "../../i18n/t";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { extractDomain } from "../../engine/utils/extractDomain";
import { holdersUrl } from "../../engine/corp/HoldersProduct";

const colorsMap: { [key: string]: string[] } = {
    'minimal-1': ['#8689b5', '#9fa2d1'],
    'minimal-2': ['#000000', '#333333'],
    'minimal-3': ['#dca6c0', '#cda3b7'],
    'minimal-4': ['#93c1a6', '#8da998'],
    'default-1': ['#dec08e', '#b9a88b'],
    'default-2': ['#792AF6', "#954CF9"], // Default
}

export const HoldersProductButton = React.memo(() => {
    const { Theme } = useAppConfig();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const cards = engine.products.holders.useCards();
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

    const onPress = useCallback(
        () => {
            if (needsEnrolment) {
                navigation.navigate(
                    'ZenPayLanding',
                    {
                        endpoint: holdersUrl,
                        onEnrollType: { type: 'account' }
                    }
                );
                return;
            }
            navigation.navigateHolders({ type: 'account' });
        },
        [needsEnrolment],
    );


    if (cards.length === 0) {
        return (
            <ProductBanner
                title={t('products.zenPay.card.defaultTitle')}
                subtitle={t('products.zenPay.card.defaultSubtitle')}
                onPress={onPress}
                illustration={require('../../../assets/banner-cards.png')}
            />
        );
    }

    return (
        <View>

        </View>
    );
})