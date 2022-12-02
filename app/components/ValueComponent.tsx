import BN from "bn.js";
import { StyleProp, Text, TextStyle } from "react-native";
import { fromNano } from "ton";
import { fromBNWithDecimals } from "../utils/withDecimals";

export function ValueComponent(props: { value: BN, centFontStyle?: StyleProp<TextStyle>, precision?: number, decimals?: number | null }) {
    let t: string;
    t = fromBNWithDecimals(props.value, props.decimals);

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

    const precision = !!props.decimals
        ? r.length > 2 ? 2 : props.decimals
        : props.precision
            ? props.precision
            : r.length > 2 ? 2 : p[1].length

    return (
        <Text>
            <Text>{r}</Text>
            <Text style={[props.centFontStyle]}>
                .{p[1].substring(
                    0,
                    precision // Show only the last two decimal places
                )}
            </Text>
        </Text>
    );
}