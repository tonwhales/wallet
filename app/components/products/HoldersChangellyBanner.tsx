import { memo } from "react";
import { useHoldersAccounts, useHoldersAccountStatus, useIsConnectAppReady, useNetwork, useTheme } from "../../engine/hooks";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useHiddenBanners, useMarkBannerHidden } from "../../engine/hooks/banners";
import { Address } from "@ton/core";
import { MixpanelEvent, trackEvent } from "../../analytics/mixpanel";
import { HoldersUserState, holdersUrl } from "../../engine/api/holders/fetchUserState";
import { HoldersAppParams, HoldersAppParamsType } from "../../fragments/holders/HoldersAppFragment";
import { ChangellyBanner } from "./ChangellyBanner";
import { View } from "react-native";

const bannerId = 'holders-changelly-banner';

export const HoldersChangellyBanner = memo(({ address, solanaAddress }: { address: Address, solanaAddress?: string }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const accounts = useHoldersAccounts(address, solanaAddress).data?.accounts ?? [];
    const holdersAccStatus = useHoldersAccountStatus(address).data;
    const hiddenBanners = useHiddenBanners();
    const markBannerHidden = useMarkBannerHidden();
    const url = holdersUrl(isTestnet);
    const isHoldersReady = useIsConnectAppReady(url);

    const needsEnrollment = holdersAccStatus?.state === HoldersUserState.NeedEnrollment;
    const USDTacc = accounts
        .filter((acc) => acc.cryptoCurrency.ticker === 'USDT')
        .sort((a, b) => {
            const aCreated = a.createdAt;
            const bCreated = b.createdAt;

            if (!aCreated) {
                return 1;
            }

            if (!bCreated) {
                return -1;
            }

            try {
                const aDate = new Date(aCreated);
                const bDate = new Date(bCreated);

                return bDate.getTime() - aDate.getTime();
            } catch {
                return 0;
            }
        })[0];
        
    const accId = USDTacc?.id;

    const onPress = () => {
        if (!accId) {
            return;
        }

        trackEvent(
            MixpanelEvent.HoldersChangellyBanner,
            { address: address.toString({ testOnly: isTestnet }) },
            true
        );

        const path = `/account/${accId}?deposit-open=true`;
        const navParams: HoldersAppParams = { type: HoldersAppParamsType.Path, path, query: {} };

        if (needsEnrollment || !isHoldersReady) {
            navigation.navigateHoldersLanding(
                { endpoint: url, onEnrollType: navParams },
                isTestnet
            );
            return;
        }

        navigation.navigateHolders(navParams, isTestnet);
    };

    const markHidden = () => {
        markBannerHidden(bannerId);
        trackEvent(
            MixpanelEvent.HoldersChangellyBannerClose,
            { address: address.toString({ testOnly: isTestnet }) },
            true
        );
    };

    if (
        hiddenBanners.includes(bannerId)
        || accounts.length === 0
        || !accId
    ) {
        return null;
    }

    return (
        <View style={{ paddingHorizontal: 16 }}>
            <ChangellyBanner
                onPress={onPress}
                onClose={markHidden}
                theme={theme}
            />
        </View>
    );
})