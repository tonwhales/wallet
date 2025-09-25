import React, { memo } from "react";
import { Text } from "react-native";
import { Address } from "@ton/core";

export const AddressComponent = memo((props: { 
    testOnly?: boolean,
    address: string | Address, 
    start?: number, end?: number, 
    bounceable?: boolean,
    known?: boolean
}) => {
    const bounceable = props.known ? true : props.bounceable;
    const testOnly = props.testOnly;
    let t = props.address instanceof Address ? props.address.toString({ testOnly, bounceable }) : props.address;
    return <Text>{t.slice(0, props.start ?? 4) + '...' + t.slice(t.length - (props.end ?? 4))}</Text>;
});
