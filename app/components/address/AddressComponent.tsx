import React, { memo } from "react";
import { Text } from "react-native";
import { useNetwork } from "../../engine/hooks";
import { Address } from "@ton/core";

export const AddressComponent = memo((props: { address: string | Address, start?: number, end?: number, bounceable?: boolean }) => {
    const { isTestnet } = useNetwork();
    let t = props.address instanceof Address ? props.address.toString({ testOnly: isTestnet, bounceable: props.bounceable }) : props.address;
    return <Text>{t.slice(0, props.start ?? 4) + '...' + t.slice(t.length - (props.end ?? 4))}</Text>;
});
