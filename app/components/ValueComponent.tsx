import BN from "bn.js";
import { Text } from "react-native";
import { fromNano } from "ton";

export function ValueComponent(props: { value: BN, centFontSize?: number }) {
    let t = fromNano(props.value);
    if (t.indexOf('.') < 0) {
        return <>{t}</>
    }
    let p = t.split('.');
    return <Text><Text>{p[0]}</Text><Text style={{ fontSize: props.centFontSize }}>.{p[1]}</Text></Text>
}