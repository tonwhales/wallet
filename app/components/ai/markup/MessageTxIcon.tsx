import { memo } from "react";
import { EventCategory, TxElement } from "../../../engine/ai/markup-types";
import { Image } from "expo-image";

import IcPurchaseReversal from '@assets/ai/ic-purchase-reversal.svg';
import IcDeposit from '@assets/ai/ic-deposit.svg';
import IcOther from '@assets/ai/ic-other.svg';
import IcWithdrawal from '@assets/ai/ic-withdrawal.svg';
import { useTheme } from "../../../engine/hooks";
import { View } from "react-native";

export const MessageTxIcon = memo(({ element }: { element: TxElement }) => {
    const theme = useTheme();
    const { category, merchantLogo } = element.attributes;

    if (
        merchantLogo && category
        && [EventCategory.PURCHASE, EventCategory.PURCHASE_FAILED, EventCategory.PURCHASE_REVERSAL].includes(category)
    ) {
        return (
            <View style={{ backgroundColor: theme.divider, height: 46, width: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 23 }}>
                <Image source={{ uri: merchantLogo }} style={{ width: 46, height: 46 }} />;
            </View>
        );
    }

    switch (category) {
        case EventCategory.PURCHASE_REVERSAL:
            return (
                <View style={{ backgroundColor: theme.divider, height: 46, width: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 23 }}>
                    <IcPurchaseReversal />
                </View>
            );
        case EventCategory.DEPOSIT:
            return (
                <View style={{ backgroundColor: theme.accentGreen, height: 46, width: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 23 }}>
                    <IcDeposit />
                </View>
            );
        case EventCategory.OTHER:
            return (
                <View style={{ backgroundColor: theme.divider, height: 46, width: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 23 }}>
                    <IcOther />
                </View>
            );
        case EventCategory.WITHDRAWAL:
            return (
                <View style={{ backgroundColor: theme.accentRed, height: 46, width: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 23 }}>
                    <IcWithdrawal />
                </View>
            );
        default:
            return (
                <View style={{ backgroundColor: theme.divider, height: 46, width: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 23 }}>
                    <IcOther />
                </View>
            );
    }
});