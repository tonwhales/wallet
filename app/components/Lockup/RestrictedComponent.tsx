import React from "react";
import { View, Text } from "react-native";
import { fromNano } from "ton";
import { Lockup } from "../../engine/metadata/Metadata";
import { LockupTimer } from "./LockupTimer";

export const RestrictedComponent = React.memo(({ lockup }: { lockup: Lockup }) => {
    const restricted = React.useMemo(() => {
        return lockup.restricted ? Array.from(lockup.restricted, ([key, value]) => {
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
                {'Restricted'}
            </Text>
            {restricted}
        </View>
    );
});