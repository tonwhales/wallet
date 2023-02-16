import React from "react";
import { View, Text } from "react-native";
import { fromNano } from "ton";
import { LockupWalletState } from "../../engine/sync/startLockupWalletSync";
import { t } from "../../i18n/t";
import { LockupTimer } from "./LockupTimer";

export const LockedComponent = React.memo(({ lockup }: { lockup: LockupWalletState }) => {
    const locked = React.useMemo(() => {
        return lockup.wallet?.locked ? Array.from(lockup.wallet.locked, ([key, value]) => {
            return (
                <LockupTimer
                    key={key + ':' + value}
                    title={'Unlocked'}
                    description={`${fromNano(value)} TON`}
                    until={parseInt(key)}
                    readyText={'Unlocked'}
                    style={{ marginBottom: 8 }}
                />
            )
        }) : [];
    }, [lockup]);

    if (locked.length === 0) {
        return null;
    }

    return (
        <View>
            <Text
                style={{
                    fontSize: 18,
                    fontWeight: '700',
                    marginHorizontal: 16,
                    marginBottom: 8
                }}
            >
                {t('products.lockups.lockedTitle')}
            </Text>
            {locked}
        </View>
    );
});