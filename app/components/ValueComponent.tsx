import BN from "bn.js";
import { BlurView } from "expo-blur";
import { Platform, StyleProp, Text, TextProps, TextStyle, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Theme } from "../Theme";
import { fromBNWithDecimals } from "../utils/withDecimals";

export function ValueComponent(props: {
    value: BN,
    prefix?: string,
    suffix?: string,
    style?: StyleProp<TextStyle>,
    centFontStyle?: StyleProp<TextStyle>,
    precision?: number,
    decimals?: number | null,
    hidden?: boolean
} & TextProps) {
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
        return (
            <View>
                <Text {...props} style={props.style}>
                    {props.prefix && (
                        <Text>
                            {props.prefix}
                        </Text>
                    )}
                    <Text>
                        {t}
                    </Text>
                    {props.suffix && (
                        <Text>
                            {props.suffix}
                        </Text>
                    )}
                </Text>
                {props.hidden && (
                    <Animated.View
                        style={{ position: 'absolute', top: 1, left: 0, right: 0, bottom: 1, borderRadius: 4, overflow: 'hidden' }}
                        entering={FadeIn}
                        exiting={FadeOut}
                    >
                        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'grey' }} />
                        <BlurView style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
                    </Animated.View>
                )}
            </View>
        )
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
        <View>
            <Text {...props} style={props.style}>
                {props.prefix && (
                    <Text>
                        {props.prefix}
                    </Text>
                )}
                <Text>{r}</Text>
                <Text style={[props.centFontStyle]}>
                    .{p[1].substring(
                        0,
                        precision
                    )}
                </Text>
                {props.suffix && (
                    <Text>
                        {props.suffix}
                    </Text>
                )}
            </Text>
            {props.hidden && (
                <Animated.View
                    style={{ position: 'absolute', top: 1, left: 0, right: 0, bottom: 1, borderRadius: 4, overflow: 'hidden' }}
                    entering={FadeIn}
                    exiting={FadeOut}
                >
                    {Platform.OS !== 'ios' && (<View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'grey' }} />)}
                    {Platform.OS === 'ios' && (<Text style={{ color: Theme.accent }}>{'********'}</Text>)}
                    <BlurView style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
                </Animated.View>
            )}
        </View>
    );
}