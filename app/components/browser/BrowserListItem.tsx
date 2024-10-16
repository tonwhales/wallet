import { memo, useCallback, useMemo } from "react";
import { BrowserListingItem } from "./BrowserListings";
import { TypedNavigation } from "../../utils/useTypedNavigation";
import { View, Text } from "react-native";
import { ProductButton } from "../../fragments/wallet/products/ProductButton";
import { useDimensions } from "@react-native-community/hooks";
import { MixpanelEvent, trackEvent } from "../../analytics/mixpanel";
import { extractDomain } from "../../engine/utils/extractDomain";
import { Typography } from "../styles";
import { ThemeType } from "../../engine/state/theme";
import { useHoldersAccountStatus, useIsConnectAppReady, useNetwork, useSelectedAccount } from "../../engine/hooks";
import { holdersUrl, HoldersUserState } from "../../engine/api/holders/fetchUserState";
import { HoldersAppParamsType } from "../../fragments/holders/HoldersAppFragment";

export const BrowserListItem = memo(({
    item,
    navigation,
    theme
}: {
    item: BrowserListingItem,
    navigation: TypedNavigation,
    theme: ThemeType
}) => {
    const dimensions = useDimensions();
    const { isTestnet } = useNetwork();
    const selected = useSelectedAccount();
    const url = holdersUrl(isTestnet);
    const isHoldersReady = useIsConnectAppReady(url);
    const holdersAccStatus = useHoldersAccountStatus(selected!.address).data;
    const needsEnrolment = useMemo(() => {
        if (holdersAccStatus?.state === HoldersUserState.NeedEnrollment) {
            return true;
        }
        return false;
    }, [holdersAccStatus]);
    const onHoldersPress = useCallback(() => {
        if (needsEnrolment || !isHoldersReady) {
            navigation.navigateHoldersLanding({ endpoint: url, onEnrollType: { type: HoldersAppParamsType.Create } }, isTestnet);
            return;
        }
        navigation.navigateHolders({ type: HoldersAppParamsType.Create }, isTestnet);
    }, [needsEnrolment, isHoldersReady, isTestnet]);

    const onPress = useCallback(() => {
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

    return (
        <View style={{
            flexGrow: 1,
            height: 56,
            width: '100%',
            maxWidth: dimensions.screen.width - 32,
        }}>
            <ProductButton
                name={item.title ?? ''}
                subtitle={item.description}
                image={item.isHolders ? undefined : item.image_url}
                requireSource={item.isHolders ? require('@assets/ic-holders-accounts.png') : undefined}
                onPress={onPress}
                style={{ marginHorizontal: 0 }}
            />
        </View>
    );
});