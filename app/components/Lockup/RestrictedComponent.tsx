import BN from "bn.js";
import React from "react";
import { View, Text } from "react-native";
import { fromNano } from "ton";
import { LockupWalletState } from "../../engine/sync/startLockupWalletSync";
import { t } from "../../i18n/t";
import { formatDate } from "../../utils/dates";
import { ItemGroup } from "../ItemGroup";
import { ItemLarge } from "../ItemLarge";

export const RestrictedComponent = React.memo(({ lockup }: { lockup: LockupWalletState }) => {
    const { views, restricted } = React.useMemo(() => {
        const views: any[] = [];
        let restricted = new BN(0);
        if (lockup.wallet?.restricted) {
            Array.from(lockup.wallet.restricted).forEach(([key, value]) => {
                const until = parseInt(key);
                let untilLabel = t('products.lockups.unrestricted');
                if (until > Date.now() / 1000) {
                    untilLabel = t('products.lockups.until', { date: formatDate(until) });
                    restricted = restricted.add(new BN(value));
                }
                views.push(
                    <ItemGroup style={{ marginHorizontal: 16, marginBottom: 8 }}>
                        <ItemLarge
                            text={`${fromNano(value)} TON`}
                            title={untilLabel}
                        />
                    </ItemGroup>
                )
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
        <View>
            <Text
                style={{
                    fontSize: 18,
                    fontWeight: '700',
                    marginHorizontal: 16,
                    marginVertical: 8
                }}
            >
                {t('products.lockups.restrictedTitle') + ': ' + fromNano(restricted.toString()) + ' TON'}
            </Text>
            {views}
        </View>
    );
});