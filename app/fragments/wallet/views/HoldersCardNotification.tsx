import { Pressable, View, Text } from "react-native";
import { CardNotification } from "../../../engine/api/holders/fetchCardsTransactions";
import { memo } from "react";
import { useAppConfig } from "../../../utils/AppConfigContext";
import { formatDate, formatTime } from "../../../utils/dates";

import IcIn from '../../../../assets//ic-tx-in.svg';
import IcOut from '../../../../assets//ic-tx-out.svg';
import { notificationCategoryFormatter, notificationTypeFormatter } from "../../../utils/holders/notifications";

export const HoldersCardNotification = memo(({ notification }: { notification: CardNotification }) => {
    const { Theme } = useAppConfig();

    return (
        <Pressable
            style={{ paddingHorizontal: 16, paddingVertical: 20 }}
            onLongPress={() => { }} /* Adding for Android not calling onPress while ContextMenu is LongPressed */
        >
            <View style={{
                alignSelf: 'stretch',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <View style={{
                    width: 46, height: 46,
                    borderRadius: 23,
                    borderWidth: 0, marginRight: 10,
                    justifyContent: 'center', alignItems: 'center',
                    backgroundColor: Theme.lightGrey
                }}>
                    <IcOut height={32} width={32} style={{ width: 32, height: 32 }} />
                </View>
                <View style={{ flex: 1, marginRight: 4 }}>
                    <Text
                        style={{ color: Theme.textColor, fontSize: 17, fontWeight: '600', lineHeight: 24, flexShrink: 1 }}
                        ellipsizeMode={'tail'}
                        numberOfLines={1}
                    >
                        {notificationTypeFormatter(notification)}
                    </Text>
                    <Text
                        style={{ color: Theme.darkGrey, fontSize: 15, marginRight: 8, lineHeight: 20, fontWeight: '400', marginTop: 2 }}
                        ellipsizeMode="middle"
                        numberOfLines={1}
                    >
                        {notificationCategoryFormatter(notification) + ' • ' + formatDate(notification.time / 1000) + ' • ' + formatTime(notification.time / 1000)}
                    </Text>
                </View>
                <View style={{}}>
                    <View style={{ flexGrow: 1 }} />
                </View>
            </View>
        </Pressable>
    )
});