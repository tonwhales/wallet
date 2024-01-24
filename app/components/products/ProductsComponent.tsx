import React, { ReactElement, memo, useCallback, useMemo } from "react"
import { Pressable, Text, View, Image } from "react-native"
import { AnimatedProductButton } from "../../fragments/wallet/products/AnimatedProductButton"
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated"
import { useAccountLite, useHoldersAccountStatus, useHoldersAccounts, useNetwork, useOldWalletsBalances, usePrice, useStaking, useTheme } from "../../engine/hooks"
import { useTypedNavigation } from "../../utils/useTypedNavigation"
import { HoldersProductComponent } from "./HoldersProductComponent"
import { t } from "../../i18n/t"
import { StakingProductComponent } from "./StakingProductComponent"
import { JettonsProductComponent } from "./JettonsProductComponent"
import { HoldersHiddenAccounts } from "./HoldersHiddenCards"
import { JettonsHiddenComponent } from "./JettonsHiddenComponent"
import { SelectedAccount } from "../../engine/types"
import { DappsRequests } from "../../fragments/wallet/products/DappsRequests"
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut"
import { ValueComponent } from "../ValueComponent"
import { PriceComponent } from "../PriceComponent"
import { ProductBanner } from "./ProductBanner"
import { HoldersAccountState, holdersUrl } from "../../engine/api/holders/fetchAccountState"
import { getDomainKey } from "../../engine/state/domainKeys"
import { extractDomain } from "../../engine/utils/extractDomain"
import { PendingTransactions } from "../../fragments/wallet/views/PendingTransactions"
import { Typography } from "../styles"
import { useBanners } from "../../engine/hooks/banners"
import { ProductAd } from "../../engine/api/fetchBanners"
import { MixpanelEvent, trackEvent } from "../../analytics/mixpanel"
import { usePermissions } from "expo-notifications"

import OldWalletIcon from '@assets/ic_old_wallet.svg';
import IcTonIcon from '@assets/ic-ton-acc.svg';

export const ProductsComponent = memo(({ selected }: { selected: SelectedAccount }) => {
    const theme = useTheme();
    const [, currency] = usePrice();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const oldWalletsBalance = useOldWalletsBalances().total;
    const totalStaked = useStaking().total;
    const balance = useAccountLite(selected.address)?.balance ?? 0n;
    const holdersAccounts = useHoldersAccounts(selected!.address).data;
    const holdersAccStatus = useHoldersAccountStatus(selected!.address).data;
    const banners = useBanners().data;
    const [pushPemissions,] = usePermissions();

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

    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    const onTonPress = useCallback(() => {
        navigation.navigate('SimpleTransfer');
    }, []);

    const onHoldersPress = useCallback(() => {
        const domain = extractDomain(holdersUrl);
        const domainKey = getDomainKey(domain);
        if (needsEnrolment || !domainKey) {
            navigation.navigate(
                'HoldersLanding',
                {
                    endpoint: holdersUrl,
                    onEnrollType: { type: 'create' }
                }
            );
            return;
        }
        navigation.navigateHolders({ type: 'create' });
    }, [needsEnrolment]);

    const tonItem = useMemo(() => {
        return (
            <Pressable
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={({ pressed }) => {
                    return { flex: 1, paddingHorizontal: 16, marginBottom: 16, opacity: pressed ? 0.8 : 1 }
                }}
                onPress={onTonPress}
            >
                <Animated.View style={[
                    {
                        flexDirection: 'row', flexGrow: 1,
                        alignItems: 'center',
                        padding: 20,
                        backgroundColor: theme.surfaceOnBg,
                        borderRadius: 20,
                        overflow: 'hidden'
                    },
                    animatedStyle
                ]}>
                    <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                        <IcTonIcon width={46} height={46} />
                        <View style={{
                            justifyContent: 'center', alignItems: 'center',
                            height: 20, width: 20, borderRadius: 10,
                            position: 'absolute', right: -2, bottom: -2,
                            backgroundColor: theme.surfaceOnBg
                        }}>
                            <Image
                                source={require('@assets/ic-verified.png')}
                                style={{ height: 20, width: 20 }}
                            />
                        </View>
                    </View>
                    <View style={{ marginLeft: 12, flexShrink: 1 }}>
                        <Text
                            style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                            ellipsizeMode="tail"
                            numberOfLines={1}
                        >
                            {'TON'}
                        </Text>
                        <Text
                            numberOfLines={1}
                            ellipsizeMode={'tail'}
                            style={{ fontSize: 15, fontWeight: '400', lineHeight: 20, color: theme.textSecondary }}
                        >
                            {'The Open Network'}
                        </Text>
                    </View>
                    <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                            <ValueComponent value={balance} precision={2} centFontStyle={{ color: theme.textSecondary }} />
                            <Text style={{ color: theme.textSecondary, fontSize: 15 }}>{' TON'}</Text>
                        </Text>
                        <PriceComponent
                            amount={balance}
                            style={{
                                backgroundColor: 'transparent',
                                paddingHorizontal: 0, paddingVertical: 0,
                                alignSelf: 'flex-end',
                                height: undefined,
                            }}
                            textStyle={{ color: theme.textSecondary, fontWeight: '400', fontSize: 15, lineHeight: 20 }}
                            theme={theme}
                        />
                    </View>
                </Animated.View>
            </Pressable>
        )
    }, [theme, balance, onPressIn, onPressOut, animatedStyle, onTonPress]);

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

    }, [selected, currency, theme, pushPemissions]);

    return (
        <View>
            <View style={{
                backgroundColor: theme.backgroundPrimary,
            }}>
                <DappsRequests />
                <PendingTransactions />
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between', alignItems: 'center',
                    marginTop: 20,
                    paddingVertical: 12,
                    marginBottom: 4,
                    paddingHorizontal: 16
                }}>
                    <Text style={[{ color: theme.textPrimary, }, Typography.semiBold20_28]}>
                        {t('common.products')}
                    </Text>
                    {!(holdersAccounts?.accounts?.length === 0 && totalStaked === 0n) && (
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    opacity: pressed ? 0.5 : 1
                                }
                            }}
                            onPress={() => navigation.navigate('Products')}
                        >
                            <Text style={{
                                fontSize: 15,
                                fontWeight: '500',
                                lineHeight: 20,
                                color: theme.accent,
                            }}>
                                {t('products.addNew')}
                            </Text>
                        </Pressable>
                    )}
                </View>

                {!!banners?.product && (
                    <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                        <ProductBanner
                            title={banners.product.title}
                            subtitle={banners.product.description}
                            onPress={() => onProductBannerPress(banners.product!)}
                            illustration={{ uri: banners.product.image }}
                            reverse
                        />
                    </View>
                )}

                {(holdersAccounts?.accounts?.length ?? 0) === 0 && isTestnet && (
                    <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                        <ProductBanner
                            title={t('products.holders.card.defaultTitle')}
                            subtitle={t('products.holders.card.defaultSubtitle')}
                            onPress={onHoldersPress}
                            illustration={require('@assets/banners/banner-holders.webp')}
                            reverse
                        />
                    </View>
                )}

                {tonItem}

                <HoldersProductComponent key={'holders'} />

                <StakingProductComponent key={'pool'} />

                <JettonsProductComponent key={'jettons'} />

                <HoldersHiddenAccounts key={'holders-hidden'} />

                <JettonsHiddenComponent key={'jettons-hidden'} />
            </View>
        </View>
    );
})