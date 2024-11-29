import { memo, useCallback, useMemo } from "react";
import { BrowserListingItem } from "./BrowserListings";
import { TypedNavigation } from "../../utils/useTypedNavigation";
import { View, Text, useWindowDimensions, Platform } from "react-native";
import { ProductButton } from "../../fragments/wallet/products/ProductButton";
import { MixpanelEvent, trackEvent } from "../../analytics/mixpanel";
import { extractDomain } from "../../engine/utils/extractDomain";
import { Typography } from "../styles";
import { ThemeType } from "../../engine/state/theme";
import { useHoldersAccountStatus, useIsConnectAppReady, useNetwork, useSelectedAccount } from "../../engine/hooks";
import { holdersUrl, HoldersUserState } from "../../engine/api/holders/fetchUserState";
import { HoldersAppParamsType } from "../../fragments/holders/HoldersAppFragment";
import { useModalAlert } from "../ModalAlert";
import { useAppConfig } from "../../engine/hooks/useAppConfig";
import i18n from 'i18next';
import { t } from "../../i18n/t";

export const BrowserListItem = memo(({
    item,
    navigation,
    theme
}: {
    item: BrowserListingItem,
    navigation: TypedNavigation,
    theme: ThemeType
}) => {
    const dimensions = useWindowDimensions();
    const { isTestnet } = useNetwork();
    const selected = useSelectedAccount();
    const url = holdersUrl(isTestnet);
    const isHoldersReady = useIsConnectAppReady(url);
    const holdersAccStatus = useHoldersAccountStatus(selected!.address).data;
    const modal = useModalAlert();
    const appConfig = useAppConfig();
    const lang = i18n.language === 'ru' ? 'ru' : 'en';

    const needsEnrollment = useMemo(() => {
        return holdersAccStatus?.state === HoldersUserState.NeedEnrollment;
    }, [holdersAccStatus?.state]);

    const onHoldersPress = useCallback(() => {
        if (needsEnrollment || !isHoldersReady) {
            navigation.navigateHoldersLanding({ endpoint: url, onEnrollType: { type: HoldersAppParamsType.Create } }, isTestnet);
            return;
        }
        navigation.navigateHolders({ type: HoldersAppParamsType.Create }, isTestnet);
    }, [needsEnrollment, isHoldersReady, isTestnet]);

    const openProduct = useCallback(() => {
        trackEvent(MixpanelEvent.ProductBannerClick, {
            id: item.id,
            product_url: item.product_url,
            type: 'list'
        });

        if (item.isHolders) {
            onHoldersPress();
            return;
        }

        const domain = extractDomain(item.product_url);
        const titleComponent = (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ marginRight: 8 }}>
                    <View style={{
                        width: 24, height: 24,
                        borderRadius: 12,
                        backgroundColor: theme.accent,
                        justifyContent: 'center', alignItems: 'center'
                    }}>
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold15_20]}>
                            {domain.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                </View>
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    {item.title && (
                        <Text style={[{ color: theme.textPrimary }, Typography.semiBold15_20]}>
                            {item.title}
                        </Text>
                    )}
                    <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                        {domain}
                    </Text>
                </View>
            </View>
        );

        navigation.navigateDAppWebView({
            lockNativeBack: true,
            safeMode: true,
            url: item.product_url,
            title: item.title ?? undefined,
            header: { titleComponent },
            useStatusBar: true,
            engine: 'ton-connect',
            refId: `browser-banner-${item.id}`,
            controlls: {
                refresh: true,
                share: true,
                back: true,
                forward: true
            }
        })
    }, [item, onHoldersPress]);

    const onBannerPress = useCallback(() => {
        if (Platform.OS === 'android' || item.isHolders) {
            openProduct();
            return;
        }

        const configText = appConfig.browserAlerTexts?.[lang]?.message;
        const message = configText ?? t('browser.alertModal.message');

        modal.current?.showWithProps({
            title: item.title,
            message,
            icon: item.icon_url,
            buttons: [
                {
                    text: t('common.cancel'),
                    display: 'text_secondary'
                },
                {
                    text: t('browser.alertModal.action'),
                    onPress: openProduct,
                    display: 'text'
                }
            ]
        });
    }, [
        modal, openProduct, appConfig.browserAlerTexts, lang, 
        item.title, item.icon_url,
        item.isHolders
    ]);

    return (
        <View style={{
            flexGrow: 1,
            height: 56,
            width: '100%',
            maxWidth: dimensions.width - 32,
        }}>
            <ProductButton
                name={item.title ?? ''}
                subtitle={item.description}
                image={item.isHolders ? undefined : item.image_url}
                requireSource={item.isHolders ? require('@assets/ic-holders-accounts.png') : undefined}
                onPress={onBannerPress}
                style={{ marginHorizontal: 0 }}
            />
        </View>
    );
});