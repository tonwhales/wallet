import { memo } from "react";
import { useHiddenBanners, useMarkBannerHidden } from "../../engine/hooks/banners";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { Pressable } from "react-native-gesture-handler";
import { View, Text, useWindowDimensions, Linking } from "react-native";
import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { Image } from "expo-image";
import { useIsLedgerRoute, useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { Typography } from "../styles";
import { t } from "../../i18n/t";
import { Address } from "@ton/core";
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";

const bannerId = 'ethena-points-banner';

export const EthenaPointsBanner = memo(() => {
    const hiddenBanners = useHiddenBanners();
    const markBannerHidden = useMarkBannerHidden();
    const { isTestnet } = useNetwork();
    const selected = useSelectedAccount();
    const ledgerContext = useLedgerTransport();
    const ledgerAddress = ledgerContext?.addr?.address ? Address.parse(ledgerContext?.addr?.address) : undefined;
    const isLedger = useIsLedgerRoute();
    const address = isLedger ? ledgerAddress : selected?.address;
    const addressString = address?.toString({ testOnly: isTestnet });
    const dimentions = useWindowDimensions();
    const theme = useTheme();

    const isHidden = hiddenBanners.includes(`${bannerId}-${addressString}`);

    const onPress = () => {
        Linking.openURL('https://t.me/id_app/start?startapp=6bDa6xupJKTs38B8vSMyGSM5AUFkKPxZWEeAiMSk')
    }

    if (isHidden) {
        return null;
    }

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
            style={{ marginBottom: 16 }}
        >
            <Pressable
                onPress={onPress}
                style={({ pressed }) => ({
                    opacity: pressed ? 0.5 : 1,
                    backgroundColor: theme.surfaceOnBg,
                    borderRadius: 20,
                    overflow: 'hidden'
                })}
            >
                <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden', borderRadius: 20 }}>
                    <Canvas style={{ flexGrow: 1 }}>
                        <Rect
                            x={0} y={0}
                            width={dimentions.width - 32}
                            height={106 + 20}
                        >
                            <LinearGradient
                                start={vec(0, 0)}
                                end={vec(dimentions.width - 32, 0)}
                                positions={[0, 1]}
                                colors={['#372DC8', '#478CF3']}
                            />
                        </Rect>
                    </Canvas>
                </View>
                <View style={{
                    flexDirection: 'row', flexGrow: 1,
                    alignItems: 'center', justifyContent: 'space-between',
                    paddingLeft: 20
                }}>
                    <View style={{ flexShrink: 1 }}>
                        <Text style={[{ color: theme.textUnchangeable }, Typography.semiBold15_20]}>
                            {t('products.staking.pools.ethenaPoints')}
                        </Text>
                        <Text style={[{ color: theme.textUnchangeable, opacity: 0.8 }, Typography.regular15_20]}>
                            {t('products.staking.pools.ethenaPointsDescription')}
                        </Text>
                    </View>
                    <Image
                        style={{
                            width: 106,
                            height: 106,
                            marginRight: 24
                        }}
                        source={require('@assets/banners/ethena-banner.webp')}
                    />
                </View>
                <Pressable
                    style={{
                        position: 'absolute',
                        top: 10, right: 10
                    }}
                    onPress={() => markBannerHidden(`${bannerId}-${addressString}`)}
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