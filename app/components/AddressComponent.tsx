import { Text } from "react-native";
import { Address } from "ton";
import { AppConfig } from "../AppConfig";

export function AddressComponent(props: { address: Address }) {
    let t = props.address.toFriendly({ testOnly: AppConfig.isTestnet });
    return <Text>{t.slice(0, 10) + '...' + t.slice(t.length - 6)}</Text>;
}
