import React, { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { Address } from "ton";
import { AddressComponent } from "./AddressComponent";
import { Avatar } from "../Avatar";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import Animated from "react-native-reanimated";
import { AddressSearchItem } from "./AddressSearch";

export const AddressSearchItemView = memo(({ item, onPress }: { item: AddressSearchItem, onPress?: (address: Address) => void }) => {
    const { Theme, AppConfig } = useAppConfig();
    const { animatedStyle, onPressIn, onPressOut } = useAnimatedPressedInOut();

    return (
        <Pressable
            onPress={() => onPress ? onPress(item.address) : undefined}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
        >
            <Animated.View style={[{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }, animatedStyle]}>
                <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0, marginRight: 12 }}>
                    <Avatar
                        address={item.address.toFriendly({ testOnly: AppConfig.isTestnet })}
                        id={item.address.toFriendly({ testOnly: AppConfig.isTestnet })}
                        size={46}
                        borderWith={0}
                    />
                </View>
                <View style={{ flexGrow: 1, justifyContent: 'center' }}>
                    <Text
                        style={{ color: Theme.textColor, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                        ellipsizeMode={'tail'}
                        numberOfLines={1}
                    >
                        {item.title}
                    </Text>
                    <Text
                        style={{ color: Theme.textSecondary, fontSize: 15, lineHeight: 20, fontWeight: '400' }}
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