import React from "react";
import { View, Text } from "react-native";
import { fromNano } from "ton";
import { LockupWalletState } from "../../engine/sync/startLockupWalletSync";
import { t } from "../../i18n/t";
import { LockupTimer } from "./LockupTimer";

export const RestrictedComponent = React.memo(({ lockup }: { lockup: LockupWalletState }) => {
    const restricted = React.useMemo(() => {
        return lockup.wallet?.restricted ? Array.from(lockup.wallet.restricted, ([key, value]) => {
            return (
                <LockupTimer
                    key={key + ':' + value}
                    title={'Unrestricted'}
                    description={`${fromNano(value)} TON`}
                    until={parseInt(key)}
                    readyText={'Unrestricted'}
                    style={{ marginBottom: 8 }}
                />
            )
        }) : [];
    }, [lockup]);

    if (restricted.length === 0) {
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
                {t('products.lockups.restrictedTitle')}
            </Text>
            {restricted}
        </View>
    );
});