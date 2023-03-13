import BN from "bn.js";
import React from "react";
import { Pressable, View, Text } from "react-native";
import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { Theme } from "../../Theme";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { PriceComponent } from "../PriceComponent";
import { ValueComponent } from "../ValueComponent";
import { Timer } from "./Timer";

export const ResctrictedButton = React.memo(({
    address,
    value,
    until
}: {
    address: Address,
    value: BN,
    until: number
}) => {
    const navigation = useTypedNavigation();

    return (
        <Pressable
            style={({ pressed }) => {
                return [{
                    opacity: pressed ? 0.3 : 1,
                    marginHorizontal: 16,
                    marginBottom: 8,
                    backgroundColor: Theme.item,
                    borderRadius: 14,
                    paddingHorizontal: 10,
                    paddingVertical: 12
                }];
            }}
            onPress={() => {
                navigation.navigate('LockupRestricked', { address: address.toFriendly({ testOnly: AppConfig.isTestnet }) });
            }}
        >
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 3, marginLeft: 6
            }}>
                <Timer until={until} />
                <View style={{
                    flexDirection: 'column',
                    paddingVertical: 2,
                }}>
                    <Text style={{
                        fontWeight: '400',
                        fontSize: 16,
                        color: Theme.textColor
                    }}>
                        <ValueComponent
                            value={value}
                            precision={3}
                        />
                        {' TON'}
                    </Text>
                    <PriceComponent
                        amount={value}
                        style={{
                            backgroundColor: 'transparent',
                            paddingHorizontal: 0, paddingVertical: 0,
                            alignSelf: 'flex-end',
                            marginTop: 2, height: undefined,
                            minHeight: 14
                        }}
                        textStyle={{ color: '#8E979D', fontWeight: '400', fontSize: 12 }}
                    />
                </View>
            </View>
        </Pressable>
    );
});