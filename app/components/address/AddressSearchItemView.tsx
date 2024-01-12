import React, { memo } from "react";
import { View, Text, Pressable } from "react-native";
import Animated from "react-native-reanimated";
import { AddressSearchItem } from "./AddressSearch";
import { useNetwork, useTheme } from "../../engine/hooks";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import { Avatar } from "../Avatar";
import { AddressComponent } from "./AddressComponent";

export const AddressSearchItemView = memo(({ item, onPress }: { item: AddressSearchItem, onPress?: (item: AddressSearchItem) => void }) => {
    const theme = useTheme();
    const network = useNetwork();
    const { animatedStyle, onPressIn, onPressOut } = useAnimatedPressedInOut();

    return (
        <Pressable
            onPress={() => onPress ? onPress(item) : undefined}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
        >
            <Animated.View style={[{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }, animatedStyle]}>
                <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0, marginRight: 12 }}>
                    <Avatar
                        address={item.address.toString({ testOnly: network.isTestnet })}
                        id={item.address.toString({ testOnly: network.isTestnet })}
                        size={46}
                        borderWith={0}
                        markContact={item.type === 'contact'}
                        icProps={{
                            isOwn: item.type === 'my-wallets',
                            backgroundColor: theme.elevation
                        }}
                        hash={item.walletSettings?.avatar}
                        theme={theme}
                        isTestnet={network.isTestnet}
                        hashColor
                    />
                </View>
                <View style={{ flexShrink: 1, justifyContent: 'center' }}>
                    <Text
                        style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                        ellipsizeMode={'tail'}
                        numberOfLines={1}
                    >
                        {item.title}
                    </Text>
                    <Text
                        style={{ color: theme.textSecondary, fontSize: 15, lineHeight: 20, fontWeight: '400' }}
                        ellipsizeMode={'middle'}
                        numberOfLines={1}
                    >
                        <AddressComponent address={item.address} />
                    </Text>
                </View>
            </Animated.View>
        </Pressable>
    );
});