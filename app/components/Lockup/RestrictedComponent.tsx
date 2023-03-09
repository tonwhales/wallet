import BN from "bn.js";
import React from "react";
import { View, Text } from "react-native";
import { LockupWalletState } from "../../engine/sync/startLockupWalletSync";
import { t } from "../../i18n/t";
import { formatDate } from "../../utils/dates";
import { ResctrictedButton } from "./ResctrictedButton";

export const RestrictedComponent = React.memo(({ lockup }: { lockup: LockupWalletState }) => {
    const { views } = React.useMemo(() => {
        const views: any[] = [];
        let restricted = new BN(0);
        if (lockup.wallet?.restricted) {
            Array.from(lockup.wallet.restricted).forEach(([key, value], index) => {
                const until = parseInt(key);
                let untilLabel = t('products.lockups.unrestricted');
                if (until > Date.now() / 1000) {
                    untilLabel = t('products.lockups.until', { date: formatDate(until) });
                    restricted = restricted.add(new BN(value));
                }
                views.push(<ResctrictedButton key={`restriction-${index}`} until={until} value={value} />)
            });
        }

        return {
            views,
            restricted
        }
    }, [lockup]);

    if (views.length === 0) {
        return null;
    }

    return (
        <View style={{ marginTop: 12 }}>
            <Text
                style={{
                    fontSize: 18,
                    fontWeight: '700',
                    marginHorizontal: 16,
                    marginVertical: 8
                }}
            >
                {t('products.lockups.restrictedTitle')}
            </Text>
            {views}
        </View>
    );
});