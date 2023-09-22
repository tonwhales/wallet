import React, { memo, useCallback, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { Address } from "ton";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { AddressComponent } from "../address/AddressComponent";
import { Avatar } from "../Avatar";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import Animated from "react-native-reanimated";
import { useEngine } from "../../engine/Engine";

export const ContactItemView = memo(({ addr, action }: { addr: string, action?: () => void }) => {
    const { Theme } = useAppConfig();
    const engine = useEngine();
    const address = useMemo(() => Address.parse(addr), [addr])
    const contact = engine.products.settings.useContact(addr);
    const isSpam = engine.products.settings.useDenyAddress(address);
    const navigation = useTypedNavigation();

    const { animatedStyle, onPressIn, onPressOut } = useAnimatedPressedInOut();

    const lastName = useMemo(() => {
        if (contact?.fields) {
            return contact.fields.find((f) => f.key === 'lastName')?.value;
        }
    }, [contact]);

    const onPress = useCallback(() => {
        if (action) {
            action();
            return;
        }
        navigation.navigate('Contact', { address: addr });
    }, [addr, action]);

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
                    {contact?.name ? (
                        <>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text
                                    style={{ color: Theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                                    ellipsizeMode={'tail'}
                                    numberOfLines={1}
                                >
                                    {contact?.name + (lastName ? ` ${lastName}` : '')}
                                </Text>
                                {isSpam && (
                                    <View style={{
                                        backgroundColor: Theme.backgroundInverted,
                                        borderRadius: 100,
                                        height: 15,
                                        marginLeft: 10,
                                        paddingHorizontal: 5,
                                        justifyContent: 'center',
                                    }}>
                                        <Text style={{
                                            fontSize: 10,
                                            fontWeight: '500',
                                            color: Theme.textPrimaryInverted
                                        }}>
                                            {'SPAM'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text
                                style={{ color: Theme.textSecondary, fontSize: 15, lineHeight: 20, fontWeight: '400' }}
                                ellipsizeMode={'middle'}
                                numberOfLines={1}
                            >
                                <AddressComponent address={address} />
                            </Text>
                        </>
                    )
                        : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text
                                    style={{ color: Theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '600' }}
                                    ellipsizeMode={'middle'}
                                    numberOfLines={1}
                                >
                                    <AddressComponent address={address} />
                                </Text>
                                {isSpam && (
                                    <View style={{
                                        backgroundColor: Theme.backgroundInverted,
                                        borderRadius: 100,
                                        height: 15,
                                        marginLeft: 10,
                                        paddingHorizontal: 5,
                                        justifyContent: 'center',
                                    }}>
                                        <Text style={{
                                            fontSize: 10,
                                            fontWeight: '500',
                                            color: Theme.textPrimaryInverted
                                        }}>
                                            {'SPAM'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )
                    }
                </View>
            </Animated.View>
        </Pressable>
    );
});