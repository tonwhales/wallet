import { memo, useCallback } from "react";
import { Pressable, View, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { resolveUrl } from "../../../utils/resolveUrl";
import { useNetwork, useTheme } from '../../../engine/hooks';
import { useLedgerTransport } from "./TransportContext";
import { Address } from "@ton/core";
import { useAppMode } from "../../../engine/hooks/appstate/useAppMode";
import Animated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { ScrollView } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { SelectedWallet } from "../../../components/wallet/SelectedWallet";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const LedgerWalletHeader = memo(({ address, height, walletCardHeight, scrollOffsetSv }: { address: Address, height: number, walletCardHeight: number, scrollOffsetSv: SharedValue<number> }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const ledgerContext = useLedgerTransport();
    const [isWalletMode] = useAppMode(address);

    const onQRCodeRead = useCallback((src: string) => {
        try {
            let res = resolveUrl(src, isTestnet);

            if (res && (res.type === 'jetton-transaction' || res.type === 'transaction')) {
                const bounceable = res.isBounceable === false ? false : true;
                if (res.type === 'transaction') {
                    if (res.payload) {
                        // TODO: implement
                        // navigation.navigateLedgerSignTransfer({
                        //     order: {
                        //         target: res.address.toString({ testOnly: network.isTestnet }),
                        //         amount: res.amount || 0n,
                        //         amountAll: false,
                        //         stateInit: res.stateInit,
                        //         payload: {
                        //             type: 'unsafe',
                        //             message: new CellMessage(res.payload),
                        //         },
                        //     },
                        //     text: res.comment
                        // });
                    } else {
                        navigation.navigateSimpleTransfer({
                            target: res.address.toString({ testOnly: isTestnet, bounceable }),
                            comment: res.comment,
                            amount: res.amount,
                            stateInit: res.stateInit,
                            jetton: null,
                            callback: null
                        }, { ledger: true });
                    }
                    return;
                }

                navigation.navigateSimpleTransfer({
                    target: res.address.toString({ testOnly: isTestnet, bounceable }),
                    comment: res.comment,
                    amount: res.amount,
                    stateInit: null,
                    jetton: res.jettonMaster,
                    callback: null
                }, { ledger: true });
            }
        } catch {
            // Ignore
        }
    }, []);
    const openScanner = () => navigation.navigateScanner({ callback: onQRCodeRead });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: scrollOffsetSv.value < 0 ? 0 : -scrollOffsetSv.value
            }
        ],
        opacity: scrollOffsetSv.value <= 0 ? 0 : 1,

    }))

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        backgroundColor: scrollOffsetSv.value <= 0 ? 'transparent' : theme.backgroundUnchangeable,
    }))


    return (
        <Animated.View
            style={[containerAnimatedStyle, {
                paddingTop: safeArea.top + (Platform.OS === 'ios' ? 0 : 16),
                position: 'absolute',
                top: 0,
                zIndex: 1,
                width: '100%',
            }]}
            collapsable={false}
        >
            <ScrollView
                scrollEnabled={false}
                style={{ position: 'absolute', height, width: '100%' }}
                contentContainerStyle={[{ height: walletCardHeight }]}
            >
                <AnimatedLinearGradient
                    style={[animatedStyle, {
                        height: walletCardHeight,
                        width: '100%',
                        opacity: 0,
                    }]}
                    colors={[isWalletMode ? theme.backgroundUnchangeable : theme.cornflowerBlue, theme.backgroundUnchangeable]}
                    start={[1, 0]}
                    end={[1, 1]}
                />
            </ScrollView>
            <View style={{
                height: 48,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 6,
                paddingHorizontal: 16,
            }}>
                <SelectedWallet ledgerName={ledgerContext.ledgerName} />
                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                    {isWalletMode && (
                        <Pressable
                            style={({ pressed }) => ({
                                opacity: pressed ? 0.5 : 1,
                                backgroundColor: theme.style === 'light' ? theme.surfaceOnDark : theme.surfaceOnBg,
                                height: 32, width: 32, justifyContent: 'center', alignItems: 'center',
                                borderRadius: 16
                            })}
                            onPress={openScanner}
                        >
                            <Image
                                source={require('@assets/ic-scan-main.png')}
                                style={{
                                    height: 22,
                                    width: 22,
                                    tintColor: theme.iconUnchangeable
                                }}
                            />
                        </Pressable>
                    )}
                </View>
            </View>
        </Animated.View>
    );
});