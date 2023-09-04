import { Text } from "react-native";
import { Address } from "ton";
import { useAppConfig } from "../../utils/AppConfigContext";

export function AddressComponent(props: { address: Address, start?: number, end?: number }) {
    const { AppConfig } = useAppConfig();
    let t = props.address.toFriendly({ testOnly: AppConfig.isTestnet });
    return <Text>{t.slice(0, props.start ?? 4) + '...' + t.slice(t.length - (props.end ?? 4))}</Text>;
}
