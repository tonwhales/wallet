import { StyleProp, Text, TextStyle } from "react-native";
import { Address } from "ton";
import { AppConfig } from "../AppConfig";

export function AddressComponent(props: { address: Address, startLength?: number, endLength?: number, style?: StyleProp<TextStyle> }) {
    let t = props.address.toFriendly({ testOnly: AppConfig.isTestnet });
    return (
        <Text style={[props.style]}>
            {t.slice(0, props.startLength ?? 10) + '...' + t.slice(t.length - (props.endLength ?? 6))}
        </Text>
    );
}