import { StyleProp, Text, TextStyle } from "react-native";
import { fromBnWithDecimals } from "../utils/withDecimals";
import { getNumberFormatSettings } from "react-native-localize";

export function valueText(props: {
    value: bigint | string,
    precision?: number,
    decimals?: number | null,
}) {
    let t: string;
    const { decimalSeparator } = getNumberFormatSettings();
    t = fromBnWithDecimals(props.value, props.decimals);

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
        return [t, '']
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
        ? r.length > 1 ? 2 : props.decimals
        : props.precision
            ? props.precision
            : r.length > 2 ? 2 : p[1].length

    return [r, `${decimalSeparator === ',' ? ',' : '.'}${p[1].substring(0, precision)}`]
}

export function ValueComponent(props: {
    value: bigint | string,
    fontStyle?: StyleProp<TextStyle>,
    centFontStyle?: StyleProp<TextStyle>,
    precision?: number,
    decimals?: number | null,
    suffix?: string,
    prefix?: string,
}) {
    let t: string;
    const { decimalSeparator } = getNumberFormatSettings();
    t = fromBnWithDecimals(props.value, props.decimals);

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
        ? r.length > 1 ? 2 : props.decimals
        : props.precision
            ? props.precision
            : r.length > 2 ? 2 : p[1].length

    return (
        <Text style={props.fontStyle}>
            <Text>
                {`${props.prefix || ''}${r}`}
            </Text>
            <Text style={[props.centFontStyle]}>
                {`${decimalSeparator === ',' ? ',' : '.'}${p[1].substring(
                    0,
                    precision // Show only the last decimal places
                )}${props.suffix || ''}`}
            </Text>
        </Text>
    );
}