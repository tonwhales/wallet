import BN from "bn.js";
import { StyleProp, Text, TextStyle } from "react-native";
import { fromNano } from "ton";

export function ValueComponent(props: { value: BN, centFontStyle?: StyleProp<TextStyle>, precision?: number }) {
    let t = fromNano(props.value);
    if (t.indexOf('.') < 0) {
        return <>{t}</>
    }
    let p = t.split('.');

    let parts: string[] = [];
    let r = p[0];
    if (r.length > 3) {
        parts.unshift(r.slice(r.length - 3));
        r = r.slice(0, r.length - 3);
    }
    if (r.length > 0) {
        parts.unshift(r);
    }
    r = parts.join(' ');

    return <Text><Text>{r}</Text><Text style={[props.centFontStyle]}>.{p[1].substring(0, props.precision ? props.precision : p[1].length)}</Text></Text>
}