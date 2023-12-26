import React, { memo, useCallback, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { AddressComponent } from "../address/AddressComponent";
import { Avatar } from "../Avatar";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import Animated from "react-native-reanimated";
import { t } from "../../i18n/t";
import { useNetwork, useTheme } from "../../engine/hooks";
import { Address } from "@ton/core";

export const ContactTransactionView = memo(({ address }: { address: Address }) => {
    const theme = useTheme();
    const network = useNetwork();
    const navigation = useTypedNavigation();

    const { animatedStyle, onPressIn, onPressOut } = useAnimatedPressedInOut();

    const addressFriendly = useMemo(() => {
        return address.toString({ testOnly: network.isTestnet });
    }, [address]);

    const onPress = useCallback(() => {
        navigation.navigate('Contact', { address: addressFriendly });
    }, [addressFriendly]);

    return (
        <Pressable
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}

        >
            <Animated.View style={[
                {
                    flex: 1,
                    paddingVertical: 10,
                    flexDirection: 'row', alignItems: 'center',
                    overflow: 'hidden',
                },
                animatedStyle
            ]}>
                <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0, marginRight: 12 }}>
                    <Avatar
                        address={addressFriendly}
                        id={addressFriendly}
                        size={46}
                        borderWith={0}
                        theme={theme}
                        isTestnet={network.isTestnet}
                        hashColor
                    />
                </View>
                <View style={{ flexGrow: 1, justifyContent: 'center', flexShrink: 1 }}>
                    <Text
                        style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                        ellipsizeMode={'tail'}
                        numberOfLines={1}
                    >
                        {t('contacts.unknown')}
                    </Text>
                    <Text
                        style={{ color: theme.textSecondary, fontSize: 15, lineHeight: 20, fontWeight: '400' }}
                        ellipsizeMode={'middle'}
                        numberOfLines={1}
                    >
                        <AddressComponent address={address} />
                    </Text>
                </View>
                <View style={{
                    backgroundColor: theme.border,
                    borderRadius: 16,
                    paddingVertical: 10, paddingHorizontal: 30,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <Text style={{ color: theme.accent, fontSize: 17, lineHeight: 24, fontWeight: '600' }}>
                        {t('common.add')}
                    </Text>
                </View>
            </Animated.View>
        </Pressable>
    );
});