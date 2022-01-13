import { Text } from "react-native";
import { Address } from "ton";

export function AddressComponent(props: { address: Address }) {
    let t = props.address.toFriendly();
    return <Text>{t.slice(0, 10) + '...' + t.slice(t.length - 6)}</Text>;
}
