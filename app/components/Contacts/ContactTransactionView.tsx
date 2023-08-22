import React, { useCallback, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { AddressComponent } from "../address/AddressComponent";
import { Avatar } from "../Avatar";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useAnimatedPressedInOut } from "../../utils/useAnimatedPressedInOut";
import Animated from "react-native-reanimated";
import { useEngine } from "../../engine/Engine";
import { t } from "../../i18n/t";

export const ContactTransactionView = React.memo(({ tx }: { tx: { id: string, time: number } }) => {
    const { Theme, AppConfig } = useAppConfig();
    const engine = useEngine();
    const transaction = engine.products.main.useTransaction(tx.id);
    const navigation = useTypedNavigation();

    const { animatedStyle, onPressIn, onPressOut } = useAnimatedPressedInOut();

    const addressFriendly = useMemo(() => {
        return transaction.base.address?.toFriendly({ testOnly: AppConfig.isTestnet });
    }, [transaction]);

    const onPress = useCallback(() => {
        navigation.navigate('Contact', { address: addressFriendly });
    }, [addressFriendly]);

    if (!transaction.base.address || !addressFriendly) {
        return null;
    }

    return (
        <Pressable
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
        >
            <Animated.View style={[{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }, animatedStyle]}>
                <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0, marginRight: 12 }}>
                    <Avatar
                        address={addressFriendly}
                        id={addressFriendly}
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
                        {t('contacts.unknown')}
                    </Text>
                    <Text
                        style={{ color: Theme.darkGrey, fontSize: 15, lineHeight: 20, fontWeight: '400' }}
                        ellipsizeMode={'middle'}
                        numberOfLines={1}
                    >
                        <AddressComponent address={transaction.base.address} />
                    </Text>
                </View>
                <View style={{
                    backgroundColor: Theme.lightGrey,
                    borderRadius: 16,
                    paddingVertical: 10, paddingHorizontal: 30,
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <Text style={{ color: Theme.mainViolet, fontSize: 17, lineHeight: 24, fontWeight: '600' }}>
                        {t('common.add')}
                    </Text>
                </View>
            </Animated.View>
        </Pressable>
    );
});