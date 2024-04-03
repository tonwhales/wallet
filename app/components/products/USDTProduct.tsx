import { memo, useCallback } from "react";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import { ThemeType } from "../../engine/state/theme";
import { TypedNavigation } from "../../utils/useTypedNavigation";
import { Pressable, View, Image, Text } from "react-native";
import Animated from "react-native-reanimated";
import { Typography } from "../styles";
import { PriceComponent } from "../PriceComponent";
import { ValueComponent } from "../ValueComponent";
import { Address } from "@ton/core";
import { useJettons } from "../../engine/hooks";
import { USDTMaster } from "../../secure/KnownWallets";

// import IcTonIcon from '@assets/ic-ton-acc.svg';

export const USDTProduct = memo(({
    theme,
    navigation,
    isLedger,
    address,
    testOnly
}: {
    theme: ThemeType,
    navigation: TypedNavigation,
    isLedger?: boolean,
    address: Address,
    testOnly: boolean
}) => {
    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();
    const jettons = useJettons(address.toString({ testOnly }));
    const usdtMaster = USDTMaster(testOnly);
    const usdt = !!usdtMaster
        ? jettons.find(j => j.master.equals(Address.parse(usdtMaster)))
        : null;

    const balance = usdt?.balance ?? 0n;

    const onTonPress = useCallback(() => {
        if (!usdt) {
            return;
        }
        if (isLedger) {
            navigation.navigateLedgerTransfer({

            });
            return;
        }
        navigation.navigateSimpleTransfer({
            amount: null,
            target: null,
            comment: null,
            jetton: usdt.wallet,
            stateInit: null,
            job: null,
            callback: null
        });

    }, [usdt, isLedger]);

    if (!testOnly) {
        return null;
    }

    return (
        <Pressable
            disabled={!usdt}
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
                <View style={{
                    width: 46, height: 46, borderRadius: 23,
                    borderWidth: 0,
                    backgroundColor: theme.ton,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <Text
                        style={[{ color: theme.white }, Typography.medium13_18]}
                        ellipsizeMode="tail"
                        numberOfLines={1}
                    >
                        {'USDT'}
                    </Text>
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
                        {'USDT'}
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
                        <Text style={{ color: theme.textSecondary, fontSize: 15 }}>{' USDT'}</Text>
                    </Text>
                    <PriceComponent
                        amount={balance}
                        style={{
                            backgroundColor: 'transparent',
                            paddingHorizontal: 0, paddingVertical: 0,
                            alignSelf: 'flex-end',
                            height: undefined,
                        }}
                        textStyle={[{ color: theme.textSecondary }, Typography.regular15_20]}
                        theme={theme}
                        priceUSD={1}
                    />
                </View>
            </Animated.View>
        </Pressable>
    );
});