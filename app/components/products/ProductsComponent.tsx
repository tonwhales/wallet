import React, { ReactElement, memo, useCallback } from "react"
import { View } from "react-native"
import { AnimatedProductButton } from "../../fragments/wallet/products/AnimatedProductButton"
import { FadeInUp, FadeOutDown } from "react-native-reanimated"
import { useHoldersAccountStatus, useHoldersAccounts, useIsConnectAppReady, useNetwork, useOldWalletsBalances, useStaking, useTheme } from "../../engine/hooks"
import { useTypedNavigation } from "../../utils/useTypedNavigation"
import { HoldersProductComponent } from "./HoldersProductComponent"
import { t } from "../../i18n/t"
import { StakingProductComponent } from "./StakingProductComponent"
import { JettonsProductComponent } from "./JettonsProductComponent"
import { HoldersHiddenProductComponent } from "./HoldersHiddenProductComponent"
import { JettonsHiddenComponent } from "./JettonsHiddenComponent"
import { SelectedAccount } from "../../engine/types"
import { DappsRequests } from "../../fragments/wallet/products/DappsRequests"
import { ProductBanner } from "./ProductBanner"
import { HoldersUserState, holdersUrl } from "../../engine/api/holders/fetchUserState"
import { PendingTransactions } from "../../fragments/wallet/views/PendingTransactions"
import { useBanners } from "../../engine/hooks/banners"
import { ProductAd } from "../../engine/api/fetchBanners"
import { MixpanelEvent, trackEvent } from "../../analytics/mixpanel"
import { AddressFormatUpdate } from "./AddressFormatUpdate"
import { useIsHoldersInvited } from "../../engine/hooks/holders/useIsHoldersInvited"
import { HoldersAppParamsType } from "../../fragments/holders/HoldersAppFragment"
import { W5Banner } from "./W5Banner"
import { HoldersCustomBanner } from "../../engine/api/holders/fetchAddressInviteCheck"
import { HoldersBanner } from "./HoldersBanner"
import { SavingsProduct } from "./savings/SavingsProduct"
import { PaymentOtpBanner } from "../holders/PaymentOtpBanner"
import { HoldersChangellyBanner } from "./HoldersChangellyBanner"
import { useAppMode } from "../../engine/hooks/appstate/useAppMode"
import { IbanBanner } from "../holders/IbanBanner"

import OldWalletIcon from '@assets/ic_old_wallet.svg';

export type HoldersBannerType = { type: 'built-in' } | { type: 'custom', banner: HoldersCustomBanner };

export const ProductsComponent = memo(({ selected }: { selected: SelectedAccount }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const oldWalletsBalance = useOldWalletsBalances().total;
    const totalStaked = useStaking().total;
    const holdersAccounts = useHoldersAccounts(selected!.address).data;
    const holdersAccStatus = useHoldersAccountStatus(selected!.address).data;
    const banners = useBanners();
    const url = holdersUrl(isTestnet);
    const isHoldersReady = useIsConnectAppReady(url);
    const inviteCheck = useIsHoldersInvited(selected!.address, isTestnet);
    const [isWalletMode] = useAppMode(selected!.address);

    const hasHoldersAccounts = (holdersAccounts?.accounts?.length ?? 0) > 0;
    const showHoldersBanner = !hasHoldersAccounts && inviteCheck?.allowed;
    const holdersBanner: HoldersBannerType = !!inviteCheck?.banner ? { type: 'custom', banner: inviteCheck.banner } : { type: 'built-in' };
    const holderBannerContent = showHoldersBanner ? holdersBanner : null;

    const needsEnrollment = holdersAccStatus?.state === HoldersUserState.NeedEnrollment;

    // Resolve accounts
    let accounts: ReactElement[] = [];
    if (oldWalletsBalance > 0n) {
        accounts.push(
            <AnimatedProductButton
                entering={FadeInUp}
                exiting={FadeOutDown}
                key={'old-wallets'}
                name={t('products.oldWallets.title')}
                subtitle={t("products.oldWallets.subtitle")}
                icon={OldWalletIcon}
                value={oldWalletsBalance}
                onPress={() => navigation.navigate('Migration')}
                style={{ marginVertical: 4 }}
            />
        );
    }

    const onHoldersPress = useCallback(() => {
        if (needsEnrollment || !isHoldersReady) {
            navigation.navigateHoldersLanding({ endpoint: url, onEnrollType: { type: HoldersAppParamsType.Create } }, isTestnet);
            return;
        }
        navigation.navigateHolders({ type: HoldersAppParamsType.Create }, isTestnet);
    }, [needsEnrollment, isHoldersReady, isTestnet]);

    const onProductBannerPress = useCallback((product: ProductAd) => {
        trackEvent(
            MixpanelEvent.ProductBannerClick,
            { product: product.id, address: selected.addressString },
            isTestnet
        );

        navigation.navigateDAppWebView({
            url: product.url,
            refId: product.id,
            useMainButton: true,
            useStatusBar: false,
            useQueryAPI: true,
            useToaster: true
        });

    }, [selected, isTestnet]);

    return (
        <View>
            <View style={{ backgroundColor: theme.backgroundPrimary }}>
                <PendingTransactions />
                <PaymentOtpBanner address={selected.address} />
                {isWalletMode ? (
                    <>
                        <AddressFormatUpdate />
                        <W5Banner />
                    </>
                ) : (
                    <IbanBanner />
                )}
                <DappsRequests />

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
                                address={selected.address}
                                {...holderBannerContent.banner}
                            />
                        )
                )}

                {isWalletMode ? (
                    <>
                        <SavingsProduct
                            address={selected.address}
                            pubKey={selected.publicKey}
                        />
                        <StakingProductComponent
                            key={'pool'}
                            address={selected.address}
                        />
                        <JettonsProductComponent owner={selected.address} key={'jettons'} />
                        <JettonsHiddenComponent owner={selected.address} key={'jettons-hidden'} />
                    </>
                ) : (
                    <>
                        <HoldersChangellyBanner address={selected.address} />
                        <HoldersProductComponent holdersAccStatus={holdersAccStatus} key={'holders'} />
                        <HoldersHiddenProductComponent holdersAccStatus={holdersAccStatus} key={'holders-hidden'} />
                    </>
                )}

            </View>
        </View>
    );
});
ProductsComponent.displayName = 'ProductsComponent';