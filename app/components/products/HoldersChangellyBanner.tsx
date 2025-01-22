import { memo } from "react";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { useHoldersAccounts, useHoldersAccountStatus, useIsConnectAppReady, useNetwork, useTheme } from "../../engine/hooks";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Pressable, useWindowDimensions, View, Text } from "react-native";
import { useHiddenBanners, useMarkBannerHidden } from "../../engine/hooks/banners";
import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { Image } from 'expo-image';
import { Typography } from "../styles";
import { t } from "../../i18n/t";
import { Address } from "@ton/core";
import { MixpanelEvent, trackEvent } from "../../analytics/mixpanel";
import { HoldersUserState, holdersUrl } from "../../engine/api/holders/fetchUserState";
import { HoldersAppParams, HoldersAppParamsType } from "../../fragments/holders/HoldersAppFragment";

const bannerId = 'holders-changelly-banner';

export const HoldersChangellyBanner = memo(({ address }: { address: Address }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const accounts = useHoldersAccounts(address).data?.accounts ?? [];
    const holdersAccStatus = useHoldersAccountStatus(address).data;
    const dimentions = useWindowDimensions();
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
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
        >
            <Pressable
                onPress={onPress}
                style={({ pressed }) => ({
                    opacity: pressed ? 0.5 : 1,
                    height: 106,
                    backgroundColor: theme.surfaceOnBg,
                    borderRadius: 20,
                    overflow: 'hidden',
                    marginHorizontal: 16, marginTop: 16
                })}
            >
                <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
                    <Canvas style={{ flexGrow: 1 }}>
                        <Rect
                            x={0} y={0}
                            width={dimentions.width - 32}
                            height={106}
                        >
                            <LinearGradient
                                start={vec(0, 0)}
                                end={vec(dimentions.width - 32, 0)}
                                colors={['#77818B', '#444647']}
                            />
                        </Rect>
                    </Canvas>
                </View>
                <View style={{
                    flexDirection: 'row', flexGrow: 1,
                    alignItems: 'center', justifyContent: 'space-between',
                    paddingLeft: 20
                }}>
                    <View style={{ flex: 1 }}>
                        <Text style={[{ color: theme.textUnchangeable }, Typography.semiBold15_20]}>
                            {t('changelly.bannerTitle')}
                        </Text>
                        <Text style={[{ color: theme.textUnchangeable, opacity: 0.8 }, Typography.regular15_20]}>
                            {t('changelly.bannerDescription')}
                        </Text>
                    </View>
                    <Image
                        style={{
                            height: 96, width: 120,
                            alignSelf: 'flex-end'
                        }}
                        source={require('@assets/holders-changelly-banner.png')}
                    />
                </View>
                <Pressable
                    style={() => ({
                        position: 'absolute',
                        top: 10, right: 10,
                    })}
                    onPress={markHidden}
                >
                    <Image
                        style={{
                            tintColor: theme.iconUnchangeable,
                            height: 24, width: 24
                        }}
                        source={require('@assets/ic-close.png')}
                    />
                </Pressable>
            </Pressable>
        </Animated.View>
    );
})