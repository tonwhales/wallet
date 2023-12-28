import React from "react";
import { useTheme } from "../../../engine/hooks";
import { memo } from "react";
import { CardNotification } from "../../../engine/api/holders/fetchCardsTransactions";
import { View, Image } from "react-native";

import IcActivate from '@assets/ic-activated.svg';
import IcCardPaid from '@assets/ic-card-paid.svg';
import IcDeposit from '@assets/ic-deposit.svg';
import IcExit from '@assets/ic-exit.svg';
import IcFreeze from '@assets/ic-freeze.svg';
import IcBlock from '@assets/ic-lock.svg';
import IcPay from '@assets/ic-pay.svg';
import IcSetup from '@assets/ic-setup.svg';
import IcUnfreeze from '@assets/ic-unfreeze.svg';
import IcWithdrawal from '@assets/ic-withdrawal.svg';
import IcTime from '@assets/ic-time.svg';
import IcFailed from '@assets/ic-failed.svg';

export const HoldersNotificationIcon = memo(({ notification }: { notification: CardNotification }) => {
    const theme = useTheme();
    const isPending =
        (notification.type === 'deposit' || notification.type === 'limits_change') && notification.data.pending;

    let Icon: any;
    let imageUrl: any;

    switch (notification.type) {
        case 'card_ready':
            Icon = IcActivate;
            break;
        case 'limits_change':
            Icon = IcSetup;
            break;
        case 'charge':
        case 'charge_failed':
            if (notification.data?.merchantInfo?.logoUrl) {
                imageUrl = notification.data.merchantInfo.logoUrl;
            } else {
                Icon = IcPay;
            }
            break;
        case 'deposit':
            Icon = IcDeposit;
            break;
        case 'card_withdraw':
            Icon = IcWithdrawal;
            break;
        case 'contract_closed':
            Icon = IcExit;
            break;
        case 'card_freeze':
            Icon = IcFreeze;
            break;
        case 'card_unfreeze':
            Icon = IcUnfreeze;
            break;
        case 'card_block':
            Icon = IcBlock;
            break;
        case 'card_paid':
            Icon = IcCardPaid;
            break;
        default:
            Icon = IcSetup;
    }

    return (
        <View style={{
            width: 46, height: 46,
            borderRadius: 23,
            borderWidth: 0, marginRight: 10,
            justifyContent: 'center', alignItems: 'center',
            backgroundColor: theme.border
        }}>
            {!!imageUrl && <Image source={{ uri: imageUrl }} style={{ height: 46, width: 46, borderRadius: 23 }} />}
            {!!Icon && <Icon style={{ width: 32, height: 32 }} />}
            {notification.type === 'charge_failed' && (
                <IcFailed
                    style={{
                        position: 'absolute',
                        bottom: -2, right: -2,
                        height: 16, width: 16,
                        borderRadius: 8, borderWidth: 1, borderColor: 'white',
                    }}
                />
            )}
            {isPending && (
                <IcTime
                    style={{
                        position: 'absolute',
                        bottom: -2, right: -2,
                        height: 16, width: 16,
                        borderRadius: 8, borderWidth: 1, borderColor: 'white',
                    }}
                />
            )}
        </View>
    );
});