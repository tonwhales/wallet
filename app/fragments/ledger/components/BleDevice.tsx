import React, { useCallback, useState } from "react";
import { Pressable, Text, Image, View } from "react-native";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { useAppConfig } from "../../../utils/AppConfigContext";
import Chevron from '../../../../assets/ic-chevron-down.svg';

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
                    padding: 20,
                    marginVertical: 8,
                    marginHorizontal: 16,
                    borderRadius: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Theme.lightGrey
                }
            }}
        >
            <Image
                style={{
                    width: 44,
                    height: 44,
                    marginRight: 12,
                }}
                source={require('../../../../assets/ledger_device.png')}
            />
            <Text style={{
                fontSize: 18,
                fontWeight: '600'
            }}
            >
                {device.name}
            </Text>
            <View style={{ flexGrow: 1 }} />
            {pending ? <LoadingIndicator simple /> : (
                <Chevron
                    height={16} width={16}
                    style={{
                        height: 16, width: 16,
                        transform: [{ rotate: '-90deg' }],
                    }}
                />
            )}
        </Pressable>
    );
});