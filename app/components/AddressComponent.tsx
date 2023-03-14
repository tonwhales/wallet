import { Text } from "react-native";
import { Address } from "ton";
import { AppConfig } from "../AppConfig";

export function AddressComponent(props: { address: Address, start?: number, end?: number }) {
    let t = props.address.toFriendly({ testOnly: AppConfig.isTestnet });
    return <Text>{t.slice(0, props.start ?? 10) + '...' + t.slice(t.length - (props.end ?? 6))}</Text>;
}
