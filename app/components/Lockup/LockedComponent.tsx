import BN from "bn.js";
import React from "react";
import { View, Text } from "react-native";
import { fromNano } from "ton";
import { LockupWalletState } from "../../engine/sync/startLockupWalletSync";
import { t } from "../../i18n/t";
import { formatDate } from "../../utils/dates";
import { ItemGroup } from "../ItemGroup";
import { ItemLarge } from "../ItemLarge";

export const LockedComponent = React.memo(({ lockup }: { lockup: LockupWalletState }) => {
    const { views, locked } = React.useMemo(() => {
        const views: any[] = [];
        let locked = new BN(0);
        if (lockup.wallet?.locked) {
            Array.from(lockup.wallet.locked).forEach(([key, value]) => {
                const until = parseInt(key);
                let untilLabel = t('products.lockups.unlocked');
                if (until > Date.now() / 1000) {
                    untilLabel = t('products.lockups.until', { date: formatDate(until) });
                    locked = locked.add(new BN(value));
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
            locked: locked
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
                {t('products.lockups.lockedTitle') + ': ' + fromNano(locked.toString()) + ' TON'}
            </Text>
            {views}
        </View>
    );
});