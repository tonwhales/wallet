import { Text } from "react-native";
import { Address } from "ton";
import { useNetwork } from '../engine/hooks/useNetwork';

export function AddressComponent(props: { address: Address | string, start?: number, end?: number }) {
    const { isTestnet } = useNetwork();
    let t =  typeof props.address === 'string' ? props.address : props.address.toFriendly({ testOnly: isTestnet });
    return <Text>{t.slice(0, props.start ?? 10) + '...' + t.slice(t.length - (props.end ?? 6))}</Text>;
}
