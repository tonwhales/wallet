import React, { useCallback, useState } from "react";
import { Pressable, Text } from "react-native";
import { LoadingIndicator } from "../../components/LoadingIndicator";

export type LedgerDevice = {
    id: string,
    isConnectable: boolean,
    localName: string,
    name: string,
}

export const BleDeviceComponent = React.memo(({ onSelect, device }: { onSelect: (device: any) => Promise<void>, device: any }) => {
    const [pending, setPending] = useState(false);

    const onPress = useCallback(async() => {
        try {
            await onSelect(device);
          } finally {
            setPending(false);
          }
    }, [onSelect]);


    return (
        <Pressable
            onPress={onPress}
            style={{
                paddingVertical: 16,
                paddingHorizontal: 32,
                marginVertical: 8,
                marginHorizontal: 16,
                borderWidth: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between"
            }}
        >
            <Text style={{
                fontSize: 20,
                fontWeight: "bold"
            }}>{device.name}</Text>
            {pending ? <LoadingIndicator simple /> : null}
        </Pressable>
    );
});