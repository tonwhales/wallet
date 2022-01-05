import BN from "bn.js";
import { Text } from "react-native";
import { fromNano } from "ton";

export function ValueComponent(props: { value: BN, centFontSize?: number }) {
    if (props.value.eq(new BN(0))) {
        return <>0</>
    }
    let t = fromNano(props.value);
    let p = t.split('.');
    return <Text><Text>{p[0]}</Text><Text style={{ fontSize: props.centFontSize }}>.{p[1]}</Text></Text>
}