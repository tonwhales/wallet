import { View, Text, useWindowDimensions } from "react-native";
import { systemFragment } from "../../systemFragment";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useNetwork, useTheme } from "../../engine/hooks";
import { StatusBar } from "expo-status-bar";
import { Typography } from "../../components/styles";
import { Canvas, RadialGradient, Rect, vec } from "@shopify/react-native-skia";
import { t } from "../../i18n/t";
import { RoundButton } from "../../components/RoundButton";
import { setDogsInvShown } from "../../engine/holders/dogsUtils";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { resolveOnboarding } from "../resolveOnboarding";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const DogsInviteFragment = systemFragment(() => {
    const { isTestnet } = useNetwork();
    const theme = useTheme();
    const dimentions = useWindowDimensions();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();

    const onContinue = () => {
        setDogsInvShown(true);
        const route = resolveOnboarding(isTestnet, false);
        navigation.navigateAndReplaceAll(route);
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar style={'light'} />
            <View style={{
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginTop: 90,
                height: 242,
                overflow: 'hidden',
            }}>
                <View style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 112,
                    flexDirection: 'row',
                }}>
                    <Canvas style={{ flexGrow: 1 }}>
                        <Rect
                            x={0} y={0}
                            width={dimentions.width} height={112}
                        >
                            <RadialGradient
                                c={vec(dimentions.width / 2, dimentions.width / 2)}
                                r={dimentions.width * 0.7}
                                colors={['rgba(255, 255, 255, 1)', 'transparent']}
                            />
                        </Rect>
                    </Canvas>
                </View>
                <View style={[
                    {
                        width: 280,
                        height: 177,
                        borderRadius: 20,
                        overflow: 'hidden',
                        borderWidth: 1.25,
                        borderColor: '#292929',
                        marginBottom: -16,
                    },
                    {
                        transform: [
                            {
                                rotate: '-15deg',
                            }
                        ]
                    }
                ]}>
                    <Image
                        source={require('@assets/banners/dogs-card-banner.webp')}
                        style={{
                            width: 280,
                            height: 177,
                        }}
                    />
                </View>
                <View style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    flexDirection: 'row',
                }}>
                    <LinearGradient
                        colors={['transparent', 'rgba(255, 255, 255, 0.4)']}
                        start={{ x: -1, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                            height: 2,
                            width: '50%',
                        }}
                    />
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0.4)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 2, y: 0 }}
                        style={{
                            height: 2,
                            width: '50%',
                        }}
                    />
                </View>
            </View>
            <View style={{
                flex: 1,
                marginTop: 56,
                alignItems: 'center',
                paddingHorizontal: 16,
                gap: 16,
            }}>
                <Text style={[{ color: theme.white, textAlign: 'center' }, Typography.semiBold27_32]}>
                    {t('products.holders.dogsInvite.title')}
                </Text>
                <Text style={[{ color: theme.white, textAlign: 'center' }, Typography.regular17_24]}>
                    {t('products.holders.dogsInvite.subtitle')}
                </Text>
            </View>
            <View style={{ marginBottom: safeArea.bottom, marginHorizontal: 16 }}>
                <RoundButton
                    title={t('common.continue')}
                    onPress={onContinue}
                />
            </View>
        </View>
    );
});