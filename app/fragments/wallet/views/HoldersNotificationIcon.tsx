import { memo } from "react";
import { CardNotification } from "../../../engine/api/holders/fetchCardsTransactions";
import { useAppConfig } from "../../../utils/AppConfigContext";
import { View, Image } from "react-native";

import IcActivate from '../../../../assets/ic-activated.svg';
import IcCardPaid from '../../../../assets/ic-card-paid.svg';
import IcDeposit from '../../../../assets/ic-deposit.svg';
import IcExit from '../../../../assets/ic-exit.svg';
import IcFreeze from '../../../../assets/ic-freeze.svg';
import IcBlock from '../../../../assets/ic-lock.svg';
import IcPay from '../../../../assets/ic-pay.svg';
import IcSetup from '../../../../assets/ic-setup.svg';
import IcUnfreeze from '../../../../assets/ic-unfreeze.svg';
import IcWithdrawal from '../../../../assets/ic-withdrawal.svg';


export const HoldersNotificationIcon = memo(({ notification }: { notification: CardNotification }) => {
    const { Theme } = useAppConfig();

    let Icon: any;

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
                Icon = <Image source={{ uri: notification.data.merchantInfo.logoUrl }} />;
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
            overflow: 'hidden',
            borderWidth: 0, marginRight: 10,
            justifyContent: 'center', alignItems: 'center',
            backgroundColor: Theme.lightGrey
        }}>
            <Icon style={{ width: 32, height: 32 }} />
        </View>
    );
});