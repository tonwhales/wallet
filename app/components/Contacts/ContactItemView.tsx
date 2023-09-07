import React, { useCallback, useMemo } from "react";
import { useWindowDimensions, View, Text, Pressable } from "react-native";
import { Address } from "ton";
import { AddressContact } from "../../engine/products/SettingsProduct";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { AddressComponent } from "../address/AddressComponent";
import { Avatar } from "../Avatar";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import Animated from "react-native-reanimated";

export const ContactItemView = React.memo(({ addr, contact }: { addr: string, contact: AddressContact }) => {
    const { Theme } = useAppConfig();
    const address = useMemo(() => Address.parse(addr), [addr])
    const dimentions = useWindowDimensions();
    const navigation = useTypedNavigation();

    const { animatedStyle, onPressIn, onPressOut } = useAnimatedPressedInOut();

    const lastName = useMemo(() => {
        if (contact.fields) {
            return contact.fields.find((f) => f.key === 'lastName')?.value;
        }
    }, [contact]);

    const onPress = useCallback(() => {
        navigation.navigate('Contact', { address: addr });
    }, [addr]);

    return (
        <Pressable
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
        >
            <Animated.View style={[{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }, animatedStyle]}>
                <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0, marginRight: 12 }}>
                    <Avatar
                        address={addr}
                        id={addr}
                        size={46}
                        borderWith={0}
                    />
                </View>
                <View style={{ flexGrow: 1, justifyContent: 'center' }}>
                    <Text
                        style={{ color: Theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                        ellipsizeMode={'tail'}
                        numberOfLines={1}
                    >
                        {contact.name + (lastName ? ` ${lastName}` : '')}
                    </Text>
                    <Text
                        style={{ color: Theme.textSecondary, fontSize: 15, lineHeight: 20, fontWeight: '400' }}
                        ellipsizeMode={'middle'}
                        numberOfLines={1}
                    >
                        <AddressComponent address={address} />
                    </Text>
                </View>
            </Animated.View>
        </Pressable>
    );
});