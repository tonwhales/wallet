import React, { memo, useCallback } from "react"
import { View } from "react-native"
import { StakingProductComponent } from "./StakingProductComponent";
import { LedgerJettonsProductComponent } from "./LedgerJettonsProductComponent";
import { useHoldersAccounts, useHoldersAccountStatus, useIsConnectAppReady, useTheme } from "../../engine/hooks";
import { Address } from "@ton/core";
import { PendingTransactions } from "../../fragments/wallet/views/PendingTransactions";
import { SavingsProduct } from "./SavingsProduct";
import { useBanners } from "../../engine/hooks/banners";
import { holdersUrl, HoldersUserState } from "../../engine/api/holders/fetchUserState";
import { useIsHoldersInvited } from "../../engine/hooks/holders/useIsHoldersInvited";
import { HoldersBannerType } from "./ProductsComponent";
import { ProductBanner } from "./ProductBanner";
import { t } from "../../i18n/t";
import { HoldersBanner } from "./HoldersBanner";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { HoldersAppParamsType } from "../../fragments/holders/HoldersAppFragment";
import { ProductAd } from "../../engine/api/fetchBanners";
import { MixpanelEvent, trackEvent } from "../../analytics/mixpanel";
import { HoldersProductComponent } from "./HoldersProductComponent";
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";
import { HoldersHiddenProductComponent } from "./HoldersHiddenProductComponent";

export const LedgerProductsComponent = memo(({ addr, testOnly }: { addr: string, testOnly: boolean }) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const address = Address.parse(addr);
    const holdersAccounts = useHoldersAccounts(address).data;
    const holdersAccStatus = useHoldersAccountStatus(address).data;
    const banners = useBanners();
    const url = holdersUrl(testOnly);
    const isHoldersReady = useIsConnectAppReady(url);
    const inviteCheck = useIsHoldersInvited(address, testOnly);
    const ledgerContext = useLedgerTransport();

    const hasHoldersAccounts = (holdersAccounts?.accounts?.length ?? 0) > 0;
    const showHoldersBanner = !hasHoldersAccounts && inviteCheck?.allowed;
    const holdersBanner: HoldersBannerType = !!inviteCheck?.banner ? { type: 'custom', banner: inviteCheck.banner } : { type: 'built-in' };
    const holderBannerContent = showHoldersBanner ? holdersBanner : null;

    const needsEnrollment = holdersAccStatus?.state === HoldersUserState.NeedEnrollment;

    const onHoldersPress = useCallback(() => {
        if (needsEnrollment || !isHoldersReady) {
            if (!ledgerContext.ledgerConnection || !ledgerContext.tonTransport) {
                ledgerContext.onShowLedgerConnectionError();
                return;
            }
            navigation.navigateHoldersLanding({ endpoint: url, onEnrollType: { type: HoldersAppParamsType.Create }, isLedger: true }, testOnly);
            return;
        }
        navigation.navigateHolders({ type: HoldersAppParamsType.Create }, testOnly, true);
    }, [needsEnrollment, isHoldersReady, testOnly, ledgerContext]);

    const onProductBannerPress = useCallback((product: ProductAd) => {
        trackEvent(
            MixpanelEvent.ProductBannerClick,
            { product: product.id, address: addr },
            testOnly
        );

        navigation.navigateDAppWebView({
            url: product.url,
            refId: product.id,
            useMainButton: true,
            useStatusBar: false,
            useQueryAPI: true,
            useToaster: true
        });

    }, [address, testOnly]);

    return (
        <View>
            <View style={{ backgroundColor: theme.backgroundPrimary }}>
                <PendingTransactions address={address.toString({ testOnly })} />

                {(!inviteCheck && !!banners?.product) && (
                    <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                        <ProductBanner
                            title={banners.product.title}
                            subtitle={banners.product.description}
                            onPress={() => onProductBannerPress(banners.product!)}
                            illustration={{ uri: banners.product.image }}
                            reverse
                        />
                    </View>
                )}

                {holderBannerContent && (
                    holderBannerContent.type === 'built-in'
                        ? (
                            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                                <ProductBanner
                                    title={t('products.holders.card.defaultTitle')}
                                    subtitle={t('products.holders.card.defaultSubtitle')}
                                    onPress={onHoldersPress}
                                    illustration={require('@assets/banners/banner-holders.webp')}
                                    reverse
                                />
                            </View>
                        ) : (
                            <HoldersBanner
                                onPress={onHoldersPress}
                                address={address}
                                {...holderBannerContent.banner}
                            />
                        )
                )}

                <HoldersProductComponent
                    holdersAccStatus={holdersAccStatus}
                    isLedger
                />

                <SavingsProduct
                    address={address}
                    isLedger
                />

                <View style={{ marginTop: 4 }}>
                    <StakingProductComponent
                        isLedger
                        address={address}
                    />
                </View>
                <LedgerJettonsProductComponent
                    address={address}
                    testOnly={testOnly}
                />
            </View>

            <HoldersHiddenProductComponent
                holdersAccStatus={holdersAccStatus}
                isLedger
            />
        </View>
    );
});