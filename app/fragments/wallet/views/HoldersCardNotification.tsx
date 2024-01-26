import React from "react";
import { Pressable } from "react-native";
import { CardNotification } from "../../../engine/api/holders/fetchCardsTransactions";
import { memo } from "react";
import { formatTime } from "../../../utils/dates";
import { notificationCategoryFormatter, notificationTypeFormatter } from "../../../utils/holders/notifications";
import { HoldersNotificationIcon } from "./HoldersNotificationIcon";
import { ValueComponent } from "../../../components/ValueComponent";
import { PriceComponent } from "../../../components/PriceComponent";
import { PerfText } from "../../../components/basic/PerfText";
import { PerfView } from "../../../components/basic/PerfView";
import { ThemeType } from "../../../engine/state/theme";

export const HoldersCardNotification = memo(({
    notification,
    theme
}: {
    notification: CardNotification,
    theme: ThemeType
}) => {

    return (
        <Pressable
            style={{
                paddingHorizontal: 16,
                paddingVertical: 20
            }}
        >
            <PerfView style={{
                alignSelf: 'stretch',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <HoldersNotificationIcon notification={notification} />
                <PerfView style={{ flex: 1, marginRight: 4 }}>
                    <PerfText
                        style={{ color: theme.textPrimary, fontSize: 17, fontWeight: '600', lineHeight: 24, flexShrink: 1 }}
                        ellipsizeMode={'tail'}
                        numberOfLines={1}
                    >
                        {notificationTypeFormatter(notification)}
                    </PerfText>
                    <PerfText
                        style={{
                            color: theme.textSecondary,
                            fontSize: 15, fontWeight: '400', lineHeight: 20,
                            marginRight: 8, marginTop: 2
                        }}
                    >
                        {notificationCategoryFormatter(notification) + ' • ' + formatTime(notification.time / 1000)}
                    </PerfText>
                </PerfView>
                <PerfView>
                    {(notification.type === 'deposit' ||
                        notification.type === 'charge' ||
                        notification.type === 'charge_failed' ||
                        notification.type === 'card_paid' ||
                        notification.type === 'crypto_account_withdraw' ||
                        notification.type === 'card_withdraw') ? (
                        <PerfView style={{ alignItems: 'flex-end' }}>
                            <PerfText
                                style={{
                                    color: notification.type === 'deposit'
                                        ? theme.accentGreen
                                        : notification.type === 'charge_failed' ? theme.accentRed : theme.textPrimary,
                                    fontWeight: '600',
                                    lineHeight: 24,
                                    fontSize: 17,
                                    marginRight: 2,
                                }}
                                numberOfLines={1}
                            >
                                {notification.type === 'deposit' ? '+' : '-'}
                                <ValueComponent
                                    value={BigInt(notification.data.amount)}
                                    precision={3}
                                />
                                {' TON'}
                            </PerfText>
                            <PriceComponent
                                amount={BigInt(notification.data.amount)}
                                prefix={notification.type === 'deposit' ? '+' : '-'}
                                style={{
                                    height: undefined,
                                    backgroundColor: theme.transparent,
                                    alignSelf: 'flex-end',
                                    paddingHorizontal: 0, paddingVertical: 0,
                                }}
                                theme={theme}
                                textStyle={{ color: theme.textSecondary, fontWeight: '400', fontSize: 15, lineHeight: 20 }}
                            />
                        </PerfView>
                    ) : (
                        <PerfView style={{ flexGrow: 1 }} />
                    )}
                </PerfView>
            </PerfView>
        </Pressable>
    )
});