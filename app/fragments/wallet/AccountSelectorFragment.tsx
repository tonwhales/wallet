import React from "react";
import { Platform } from "react-native";
import { fragment } from "../../fragment";
import { Address } from "@ton/core";
import { AccountSelectorIOS } from "./AccountSelectorIOS";
import { AccountSelectorAndroid } from "./AccountSelectorAndroid";

export type AccountSelectorParams = {
    callback?: (address: Address) => void;
    addressesCount: number;
};

export const AccountSelectorFragment = fragment(() => {
    if (Platform.OS === 'ios') {
        return <AccountSelectorIOS />;
    }
    return <AccountSelectorAndroid />;
});
