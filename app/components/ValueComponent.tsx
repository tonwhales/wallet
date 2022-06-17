import BN from "bn.js";
import { StyleProp, Text, TextStyle } from "react-native";
import { fromNano } from "ton";

export function ValueComponent(props: { value: BN, centFontStyle?: StyleProp<TextStyle>, precision?: number }) {
    let t = fromNano(props.value);

    let parts: string[] = [];

    if (t.indexOf('.') < 0) {
        if (t.length > 3) {
            // Separate every three digits with spaces
            let partsCount = Math.floor(t.length / 3);
            for (let i = 0; i < partsCount; i++) {
                parts.unshift(t.slice(t.length - 3));
                t = t.slice(0, t.length - 3);
            }
        }
        if (t.length > 0) {
            parts.unshift(t);
        }
        t = parts.join(' ');
        return <>{t}</>
    }

    let p = t.split('.');

    let r = p[0];
    if (r.length > 3) {
        let partsCount = Math.floor(r.length / 3);
        for (let i = 0; i < partsCount; i++) {
            parts.unshift(r.slice(r.length - 3));
            r = r.slice(0, r.length - 3);
        }
    }
    if (r.length > 0) {
        parts.unshift(r);
    }
    r = parts.join(' ');

    return (
        <Text>
            <Text>{r}</Text>
            <Text style={[props.centFontStyle]}>
                .{p[1].substring(
                    0,
                    props.precision
                        ? props.precision
                        : r.length > 2 ? 2 : p[1].length // Show only the last two decimal places
                )}
            </Text>
        </Text>
    );
}