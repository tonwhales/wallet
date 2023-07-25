import React, { useCallback, useState } from "react";
import { Pressable, Text, Image } from "react-native";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { useAppConfig } from "../../../utils/AppConfigContext";

export type LedgerDevice = {
    id: string,
    isConnectable: boolean,
    localName: string,
    name: string,
}

export const BleDevice = React.memo(({ onSelect, device }: { onSelect: (device: any) => Promise<void>, device: any }) => {
    const { Theme } = useAppConfig();
    const [pending, setPending] = useState(false);

    const onPress = useCallback(async () => {
        try {
            setPending(true);
            await onSelect(device);
        } finally {
            setPending(false);
        }
    }, [onSelect]);

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => {
                return {
                    opacity: pressed ? 0.3 : 1,
                    paddingVertical: 16,
                    paddingHorizontal: 32,
                    marginVertical: 8,
                    marginHorizontal: 16,
                    borderRadius: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: Theme.lightGrey
                }
            }}
        >
            <Image source={require('../../../../assets/ledger_device.png')} />
            <Text style={{
                fontSize: 18,
                fontWeight: '600'
            }}
            >
                {device.name}
            </Text>
            {pending ? <LoadingIndicator simple /> : null}
        </Pressable>
    );
});