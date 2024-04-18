import { memo, useCallback } from "react";
import { Pressable, View, Image, Text } from "react-native";
import { ThemeType } from "../../engine/state/theme";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import { TypedNavigation } from "../../utils/useTypedNavigation";
import Animated from "react-native-reanimated";
import { ValueComponent } from "../ValueComponent";
import { Typography } from "../styles";
import { PriceComponent } from "../PriceComponent";

import IcTonIcon from '@assets/ic-ton-acc.svg';

export const TonProductComponent = memo(({
    theme,
    navigation,
    balance,
    isLedger
}: {
    theme: ThemeType,
    navigation: TypedNavigation,
    balance: bigint,
    isLedger?: boolean
}) => {
    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    const onTonPress = useCallback(() => {
        navigation.navigate(isLedger ? 'LedgerSimpleTransfer' : 'SimpleTransfer');
    }, []);

    return (
        <Pressable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={({ pressed }) => {
                return { flex: 1, opacity: pressed ? 0.8 : 1 }
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
                <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                    <IcTonIcon width={46} height={46} />
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
                        {'TON'}
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
                        <Text style={{ color: theme.textSecondary, fontSize: 15 }}>{' TON'}</Text>
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
                    />
                </View>
            </Animated.View>
        </Pressable>
    );
});