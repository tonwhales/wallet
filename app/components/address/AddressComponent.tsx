import React from "react";
import { Text } from "react-native";
import { useNetwork } from "../../engine/hooks";
import { Address } from "@ton/core";

export function AddressComponent(props: { address: Address, start?: number, end?: number }) {
    const {isTestnet} = useNetwork();
    let t = props.address.toString({ testOnly: isTestnet });
    return <Text>{t.slice(0, props.start ?? 4) + '...' + t.slice(t.length - (props.end ?? 4))}</Text>;
}
