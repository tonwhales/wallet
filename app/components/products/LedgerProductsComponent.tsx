import React, { memo, useCallback } from "react"
import { View } from "react-native"
import { StakingProductComponent } from "./StakingProductComponent";
import { LedgerJettonsProductComponent } from "./LedgerJettonsProductComponent";
import { useHoldersAccounts, useHoldersAccountStatus, useIsConnectAppReady, useTheme } from "../../engine/hooks";
import { Address } from "@ton/core";
import { PendingTransactions } from "../../fragments/wallet/views/PendingTransactions";
import { SavingsProduct } from "./savings/SavingsProduct";
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
import { LedgerWallet, useLedgerTransport } from "../../fragments/ledger/components/TransportContext";
import { HoldersHiddenProductComponent } from "./HoldersHiddenProductComponent";
import { useAppMode } from "../../engine/hooks/appstate/useAppMode";
import { IbanBanner } from "../holders/IbanBanner";
import { LedgerJettonsHiddenComponent } from "./LedgerJettonsHiddenComponent";

export const LedgerProductsComponent = memo(({ wallet, testOnly }: { wallet: LedgerWallet, testOnly: boolean }) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const address = Address.parse(wallet.address);
    const holdersAccounts = useHoldersAccounts(address).data;
    const holdersAccStatus = useHoldersAccountStatus(address).data;
    const banners = useBanners();
    const url = holdersUrl(testOnly);
    const isHoldersReady = useIsConnectAppReady(url);
    const inviteCheck = useIsHoldersInvited(address, testOnly);
    const ledgerContext = useLedgerTransport();
    const [isWalletMode] = useAppMode(address, { isLedger: true });

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
            { product: product.id, address: wallet.address },
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

    }, [wallet.address, testOnly]);

    return (
        <View>
            <View style={{ backgroundColor: theme.backgroundPrimary }}>
                <PendingTransactions address={address.toString({ testOnly })} isLedger={true} />
                {!isWalletMode && (
                    <IbanBanner isLedger={true} />
                )}

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
                {isWalletMode ? (
                    <>
                        <SavingsProduct
                            address={address}
                            isLedger
                            pubKey={wallet.publicKey}
                        />
                        <StakingProductComponent
                            isLedger
                            address={address}
                        />
                        <LedgerJettonsProductComponent
                            address={address}
                            testOnly={testOnly}
                        />
                        <LedgerJettonsHiddenComponent
                            address={address}
                            testOnly={testOnly} />
                    </>
                ) : (
                    <>
                        <HoldersProductComponent
                            holdersAccStatus={holdersAccStatus}
                            isLedger
                        />
                        <HoldersHiddenProductComponent
                            holdersAccStatus={holdersAccStatus}
                            isLedger
                        />
                    </>
                )}
            </View>
        </View>
    );
});