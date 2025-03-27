import { memo, useCallback, useMemo } from "react";
import { Pressable, View, useWindowDimensions, Image, Text } from "react-native";
import { useTheme, useSelectedAccount, useIsConnectAppReady, useHoldersAccountStatus, useNetwork, useHoldersAccounts } from "../../engine/hooks";
import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { Typography } from "../styles";
import { useHiddenBanners, useMarkBannerHidden } from "../../engine/hooks/banners";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";
import { useHoldersIban } from "../../engine/hooks/holders/useHoldersIban";
import { holdersUrl, HoldersUserState } from "../../engine/api/holders/fetchUserState";
import { HoldersAppParams, HoldersAppParamsType } from "../../fragments/holders/HoldersAppFragment";
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";
import { Address } from "@ton/core";
const bannerId = 'iban-promo';

export const IbanBanner = memo(({ isLedger }: { isLedger?: boolean }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const navigation = useTypedNavigation();
    const dimentions = useWindowDimensions();
    const hiddenBanners = useHiddenBanners();
    const markBannerHidden = useMarkBannerHidden();
    const selected = useSelectedAccount();
    const ledgerContext = useLedgerTransport();
    const ledgerAddress = ledgerContext?.addr?.address ? Address.parse(ledgerContext?.addr?.address) : undefined;
    const address = isLedger ? ledgerAddress : selected?.address;
    const url = holdersUrl(isTestnet);
    const holdersAccStatus = useHoldersAccountStatus(address).data;
    const accounts = useHoldersAccounts(address).data?.accounts ?? [];

    const { data: ibanPromo } = useHoldersIban(address);

    const needsEnrollment = useMemo(() => {
        return holdersAccStatus?.state === HoldersUserState.NeedEnrollment;
    }, [holdersAccStatus?.state]);

    const onBannerPress = useCallback(() => {
        if (!accounts[0].id) {
            return;
        }
        const path = `/account/${!accounts[0].id}?iban-open=true`;
        const navParams: HoldersAppParams = { type: HoldersAppParamsType.Path, path, query: {} };

        if (needsEnrollment) {
            if (isLedger && (!ledgerContext.ledgerConnection || !ledgerContext.tonTransport)) {
                ledgerContext.onShowLedgerConnectionError();
                return;
            }
            navigation.navigateHoldersLanding({ endpoint: url, onEnrollType: navParams, isLedger }, isTestnet);
            return;
        }

        navigation.navigateHolders(navParams, isTestnet, isLedger);
    }, [isTestnet, navigation]);

    if (hiddenBanners.includes(`${bannerId}-${address}`) || !ibanPromo?.enabled || accounts.length === 0) {
        return null;
    }

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
        >
            <Pressable
                onPress={onBannerPress}
                style={({ pressed }) => ({
                    opacity: pressed ? 0.5 : 1,
                    height: 80,
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
                            height={80}
                        >
                            <LinearGradient
                                start={vec(0, 0)}
                                end={vec(dimentions.width - 32, 0)}
                                colors={['#BA39E5', '#5245E5']}
                            />
                        </Rect>
                    </Canvas>
                </View>
                <View style={{
                    flexDirection: 'row', flexGrow: 1,
                    alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 20
                }}>
                    <View style={{ flexShrink: 1 }}>
                        <Text style={[{ color: theme.textUnchangeable }, Typography.semiBold15_20]}>
                            {t('iban.banner.title')}
                        </Text>
                        <Text style={[{ color: theme.textUnchangeable, opacity: 0.8 }, Typography.regular15_20]}>
                            {t('iban.banner.description')}
                        </Text>
                    </View>
                    <Image
                        style={{
                            width: 107,
                            height: 77,
                            marginRight: 28
                        }}
                        source={require('@assets/banners/iban-banner.png')}
                    />
                </View>
                <Pressable
                    style={({ pressed }) => ({
                        position: 'absolute',
                        top: 10, right: 10,
                    })}
                    onPress={() => markBannerHidden(`${bannerId}-${address}`)}
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
});
