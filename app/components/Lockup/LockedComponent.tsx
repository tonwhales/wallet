import React from "react";
import { View, Text } from "react-native";
import { fromNano } from "ton";
import { Lockup } from "../../engine/metadata/Metadata";
import { LockupTimer } from "./LockupTimer";

export const LockedComponent = React.memo(({ lockup }: { lockup: Lockup }) => {
    const locked = React.useMemo(() => {
        return lockup.locked ? Array.from(lockup.locked, ([key, value]) => {
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
                {'Locked'}
            </Text>
            {locked}
        </View>
    );
});