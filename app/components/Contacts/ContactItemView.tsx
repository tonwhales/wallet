import React, { useCallback, useMemo } from "react";
import { TouchableHighlight, useWindowDimensions, View, Text } from "react-native";
import { Address } from "ton";
import { AddressContact } from "../../engine/products/SettingsProduct";
import { Theme } from "../../Theme";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { AddressComponent } from "../AddressComponent";
import { Avatar } from "../Avatar";

export const ContactItemView = React.memo(({ addr, contact }: { addr: string, contact: AddressContact }) => {
    const address = useMemo(() => Address.parse(addr), [addr])
    const dimentions = useWindowDimensions();
    const fontScaleNormal = dimentions.fontScale <= 1;
    const navigation = useTypedNavigation();

    const lastName = useMemo(() => {
        if (contact.fields) {
            return contact.fields.find((f) => f.key === 'lastName')?.value;
        }
    }, [contact]);

    const onContact = useCallback(() => {
        navigation.navigate('Contact', { address: addr });
    }, [addr]);

    return (
        <TouchableHighlight
            onPress={onContact}
            underlayColor={Theme.selector}
            style={{ backgroundColor: Theme.item, borderRadius: 14, marginVertical: 4 }}
        >
            <View style={{ alignSelf: 'stretch', flexDirection: 'row', height: fontScaleNormal ? 62 : undefined, minHeight: fontScaleNormal ? undefined : 62 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginVertical: 10, marginLeft: 10, marginRight: 10 }}>
                    <Avatar
                        address={addr}
                        id={addr}
                        size={42}
                    />
                </View>
                <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 10, marginRight: 10 }}>
                        <View style={{
                            flexDirection: 'row',
                            flexGrow: 1, flexBasis: 0, marginRight: 16,
                        }}>
                            <Text
                                style={{ color: Theme.textColor, fontSize: 16, fontWeight: '600' }}
                                ellipsizeMode={'tail'}
                                numberOfLines={1}
                            >
                                {contact.name + (lastName ? ` ${lastName}` : '')}
                            </Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginRight: 10, marginBottom: fontScaleNormal ? undefined : 10 }}>
                        <Text
                            style={{ color: Theme.textSecondary, fontSize: 13, flexGrow: 1, flexBasis: 0, marginRight: 16 }}
                            ellipsizeMode="middle"
                            numberOfLines={1}
                        >
                            <AddressComponent address={address} />
                        </Text>
                    </View>
                    <View style={{ flexGrow: 1 }} />
                </View>
            </View>
        </TouchableHighlight>
    );
});