import { memo, useCallback, useMemo } from "react";
import Animated, { FadeOutDown, FadeInUp } from "react-native-reanimated";
import { CardActionBanner } from "./CardActionBanner";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useHoldersAccountStatus, useIsConnectAppReady, useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { t } from "../../i18n/t";
import { Pressable, Text } from "react-native";
import { Typography } from "../styles";
import { Image } from "expo-image";
import { View } from "react-native";
import { useHiddenBanners, useMarkBannerHidden } from "../../engine/hooks/banners";
import { useAppConfig } from "../../engine/hooks/useAppConfig";
import { HoldersAppParamsType } from "../../fragments/holders/HoldersAppFragment";
import { useAppMode } from "../../engine/hooks/appstate/useAppMode";
import { holdersUrl, HoldersUserState } from "../../engine/api/holders/fetchUserState";

const bannerId = 'tonhub-x-dogs-banner';

export const DogsBanner = memo(({ isLedger }: { isLedger?: boolean }) => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const isHidden = useHiddenBanners();
    const markBannerHidden = useMarkBannerHidden();
    const appConfig = useAppConfig();
    const selected = useSelectedAccount();
    const [isWalletMode] = useAppMode(selected?.address, { isLedger });
    const { isTestnet } = useNetwork();
    const url = holdersUrl(isTestnet);
    const isHoldersReady = useIsConnectAppReady(url);
    const holdersAccStatus = useHoldersAccountStatus(selected!.address).data;
    const needsEnrollment = useMemo(() => {
        return holdersAccStatus?.state === HoldersUserState.NeedEnrollment;
    }, [holdersAccStatus?.state]);

    const isEnabled = appConfig.features?.tonhubXDogsBanner;

    const navigateToHoldersProductSelect = useCallback(() => {
        if (needsEnrollment || !isHoldersReady) {
            navigation.navigateHoldersLanding({ endpoint: url, onEnrollType: { type: HoldersAppParamsType.Create } }, isTestnet);
            return;
        }
        navigation.navigateHolders({ type: HoldersAppParamsType.Create }, isTestnet);
    }, [navigation, needsEnrollment, isHoldersReady, isTestnet, url]);

    if (isHidden.includes(bannerId) || !isEnabled || !isWalletMode) {
        return null;
    }

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
            style={{ paddingHorizontal: 16, marginTop: 16 }}
        >
            <CardActionBanner
                onPress={navigateToHoldersProductSelect}
                gradient={true}
                titleComponent={(
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[
                            { color: theme.textUnchangeable },
                            Typography.semiBold20_28,
                            { lineHeight: undefined },
                            { textAlignVertical: 'center' }
                        ]}
                            ellipsizeMode={'tail'}
                            numberOfLines={2}
                        >
                            {"Tonhub"}
                        </Text>
                        <Text style={[{ color: theme.textUnchangeable }, Typography.semiBold32_38]}
                            ellipsizeMode={'tail'}
                            numberOfLines={2}
                        >
                            {" X "}
                        </Text>
                        <Text style={[
                            { color: theme.textUnchangeable },
                            Typography.semiBold20_28,
                            { lineHeight: undefined },
                            { textAlignVertical: 'center' }
                        ]}
                            ellipsizeMode={'tail'}
                            numberOfLines={2}
                        >
                            {"Dogs"}
                        </Text>
                    </View>
                )}
                subtitleComponent={
                    <Text
                        style={[{ flex: 1, flexShrink: 1, color: theme.textUnchangeable, opacity: 0.8, marginBottom: 8 }, Typography.regular15_20]}
                        ellipsizeMode={'tail'}
                        numberOfLines={3}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.95}
                    >
                        {t('products.holders.dogsbanner.subtitle')}
                    </Text>
                }
                actionComponent={
                    <Text style={[{ color: theme.textUnchangeable }, Typography.semiBold17_24]}>
                        {t('products.holders.dogsbanner.action')}
                    </Text>
                }
                imageComponent={
                    <Image
                        source={require('@assets/banners/dogs-banner-icon.webp')}
                        style={{
                            width: 144, height: 132,
                            marginRight: -22, marginTop: -20
                        }}
                    />
                }
                closeComponent={
                    <Pressable
                        style={() => ({
                            position: 'absolute',
                            top: 10, right: 10,
                        })}
                        onPress={() => markBannerHidden(bannerId)}
                    >
                        <Image
                            source={require('@assets/ic-close.png')}
                            style={{ height: 24, width: 24 }}
                        />
                    </Pressable>
                }
            />
        </Animated.View>
    );
});