import React, { ReactElement, memo, useCallback, useMemo } from "react"
import { Pressable, Text, View } from "react-native"
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
import { HoldersAccountState, holdersUrl } from "../../engine/api/holders/fetchAccountState"
import { PendingTransactions } from "../../fragments/wallet/views/PendingTransactions"
import { Typography } from "../styles"
import { useBanners } from "../../engine/hooks/banners"
import { ProductAd } from "../../engine/api/fetchBanners"
import { MixpanelEvent, trackEvent } from "../../analytics/mixpanel"
import { AddressFormatUpdate } from "./AddressFormatUpdate"
import { TonProductComponent } from "./TonProductComponent"
import { SpecialJettonProduct } from "./SpecialJettonProduct"
import { useIsHoldersWhitelisted } from "../../engine/hooks/holders/useIsHoldersWhitelisted"

import OldWalletIcon from '@assets/ic_old_wallet.svg';

export const ProductsComponent = memo(({ selected, tonBalance }: { selected: SelectedAccount, tonBalance: bigint }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const oldWalletsBalance = useOldWalletsBalances().total;
    const totalStaked = useStaking().total;
    const holdersAccounts = useHoldersAccounts(selected!.address).data;
    const holdersAccStatus = useHoldersAccountStatus(selected!.address).data;
    // const jettons = useJettons(selected!.addressString);
    const banners = useBanners();
    const url = holdersUrl(isTestnet);
    const isHoldersReady = useIsConnectAppReady(url);
    const isHoldersWhitelisted = useIsHoldersWhitelisted(selected!.address, isTestnet);
    const showHoldersBuiltInBanner = (holdersAccounts?.accounts?.length ?? 0) === 0 && isHoldersWhitelisted;

    const needsEnrolment = useMemo(() => {
        if (holdersAccStatus?.state === HoldersAccountState.NeedEnrollment) {
            return true;
        }
        return false;
    }, [holdersAccStatus]);

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
        if (needsEnrolment || !isHoldersReady) {
            navigation.navigateHoldersLanding({ endpoint: url, onEnrollType: { type: 'create' } });
            return;
        }
        navigation.navigateHolders({ type: 'create' });
    }, [needsEnrolment, isHoldersReady]);

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

    const showAddNewProduct = !(holdersAccounts?.accounts?.length === 0 && totalStaked === 0n);

    return (
        <View>
            <View style={{
                backgroundColor: theme.backgroundPrimary,
            }}>
                <AddressFormatUpdate />
                <DappsRequests />
                <PendingTransactions />

                {(!isHoldersWhitelisted && !!banners?.product) && (
                    <View style={{ paddingHorizontal: 16, marginVertical: 16 }}>
                        <ProductBanner
                            title={banners.product.title}
                            subtitle={banners.product.description}
                            onPress={() => onProductBannerPress(banners.product!)}
                            illustration={{ uri: banners.product.image }}
                            reverse
                        />
                    </View>
                )}

                {showHoldersBuiltInBanner && (
                    <View style={{
                        paddingHorizontal: 16, marginBottom: 16,
                        marginTop: (!isHoldersWhitelisted && !!banners?.product) ? 0 : 16
                    }}>
                        <ProductBanner
                            title={t('products.holders.card.defaultTitle')}
                            subtitle={t('products.holders.card.defaultSubtitle')}
                            onPress={onHoldersPress}
                            illustration={require('@assets/banners/banner-holders.webp')}
                            reverse
                        />
                    </View>
                )}

                <View style={{
                    marginHorizontal: 16, marginBottom: 16,
                    marginTop: (showHoldersBuiltInBanner || (!isHoldersWhitelisted && !!banners?.product)) ? 0 : 16
                }}>
                    <Text style={[{ color: theme.textPrimary, }, Typography.semiBold20_28]}>
                        {t('common.balances')}
                    </Text>
                    <View style={{
                        backgroundColor: theme.surfaceOnBg,
                        borderRadius: 20, marginTop: 8
                    }}>
                        <TonProductComponent
                            key={'ton-native'}
                            balance={tonBalance}
                            theme={theme}
                            navigation={navigation}
                            address={selected.address}
                            testOnly={isTestnet}
                        />

                        <SpecialJettonProduct
                            key={'special-jettton'}
                            theme={theme}
                            navigation={navigation}
                            address={selected.address}
                            testOnly={isTestnet}
                            divider={'top'}
                        />
                    </View>
                </View>

                <Pressable
                    style={({ pressed }) => (
                        {
                            flexDirection: 'row',
                            justifyContent: 'space-between', alignItems: 'center',
                            padding: 16,
                            opacity: showAddNewProduct && pressed ? 0.5 : 1
                        }
                    )}
                    disabled={!showAddNewProduct}
                    onPress={() => navigation.navigate('Products')}
                >
                    <Text style={[{ color: theme.textPrimary, }, Typography.semiBold20_28]}>
                        {t('common.products')}
                    </Text>
                    {showAddNewProduct && (
                        <Text style={[{ color: theme.accent }, Typography.medium15_20]}>
                            {t('products.addNew')}
                        </Text>
                    )}
                </Pressable>

                <StakingProductComponent
                    key={'pool'}
                    address={selected.address}
                />

                <HoldersProductComponent holdersAccStatus={holdersAccStatus} key={'holders'} />

                <JettonsProductComponent owner={selected.address} key={'jettons'} />

                <HoldersHiddenProductComponent holdersAccStatus={holdersAccStatus} key={'holders-hidden'} />

                <JettonsHiddenComponent owner={selected.address} key={'jettons-hidden'} />
            </View>
        </View>
    );
});
ProductsComponent.displayName = 'ProductsComponent';