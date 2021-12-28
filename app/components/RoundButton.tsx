import * as React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { iOSUIKit } from 'react-native-typography';
import { Theme } from '../Theme';

export type RoundButtonSize = 'large' | 'normal' | 'small';
const sizes: { [key in RoundButtonSize]: { height: number, fontSize: number, hitSlop: number, pad: number } } = {
    large: { height: 48, fontSize: 21, hitSlop: 0, pad: Platform.OS == 'ios' ? 0 : -1 },
    normal: { height: 32, fontSize: 16, hitSlop: 8, pad: Platform.OS == 'ios' ? 1 : -2 },
    small: { height: 24, fontSize: 14, hitSlop: 12, pad: Platform.OS == 'ios' ? -1 : -1 }
}

export type RoundButtonDisplay = 'default' | 'outline' | 'inverted' | 'pro' | 'telegram';
const displays: { [key in RoundButtonDisplay]: {
    textColor: string,
    textPressed: string,
    backgroundColor: string,
    backgroundPressedColor: string,
    borderColor: string,
    borderPressedColor: string
} } = {
    default: {
        backgroundColor: Theme.accent,
        borderColor: Theme.accent,
        textColor: '#fff',

        backgroundPressedColor: Theme.accentDark,
        borderPressedColor: Theme.accentDark,
        textPressed: '#fff',
    },
    pro: {
        backgroundColor: 'black',
        borderColor: 'black',
        textColor: '#fff',

        backgroundPressedColor: 'rgba(0,0,0,0.3)',
        borderPressedColor: 'rgba(0,0,0,0.3)',
        textPressed: '#fff',
    },
    telegram: {
        backgroundColor: '#59ADE7',
        borderColor: '#59ADE7',
        textColor: '#fff',

        backgroundPressedColor: 'rgba(0,0,0,0.3)',
        borderPressedColor: 'rgba(0,0,0,0.3)',
        textPressed: '#fff',
    },
    outline: {
        backgroundColor: Theme.background,
        borderColor: Theme.accent,
        textColor: Theme.accent,

        backgroundPressedColor: Theme.accentDark,
        borderPressedColor: Theme.accentDark,
        textPressed: Theme.accent,
    },
    inverted: {
        backgroundColor: 'white',
        borderColor: 'white',
        textColor: Theme.accent,

        backgroundPressedColor: Theme.divider,
        borderPressedColor: Theme.divider,
        textPressed: Theme.accent,
    }
}

export const RoundButton = React.memo((props: { size?: RoundButtonSize, display?: RoundButtonDisplay, title?: string, style?: StyleProp<ViewStyle>, disabled?: boolean, loading?: boolean, onPress?: () => void, action?: () => Promise<any> }) => {
    const [loading, setLoading] = React.useState(false);
    const doLoading = props.loading !== undefined ? props.loading : loading;
    const doAction = React.useCallback(() => {
        if (props.onPress) {
            props.onPress();
            return;
        }
        if (props.action) {
            setLoading(true);
            (async () => {
                try {
                    await props.action!();
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [props.onPress, props.action]);

    const size = sizes[props.size || 'large'];
    const display = displays[props.display || 'default'];

    return (
        <Pressable
            disabled={doLoading || props.disabled}
            hitSlop={size.hitSlop}
            style={(p) => ([
                {
                    borderWidth: 1,
                    borderRadius: size.height / 2
                },
                p.pressed && {
                    backgroundColor: display.backgroundPressedColor,
                    borderColor: display.borderPressedColor,
                },
                !p.pressed && {
                    backgroundColor: display.backgroundColor,
                    borderColor: display.borderColor,
                },
                props.style])}
            onPress={doAction}
        >
            {(p) => (
                <View style={{ height: size.height - 2, alignItems: 'center', justifyContent: 'center', minWidth: 64, paddingHorizontal: 16, }}>
                    {doLoading && (
                        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, alignItems: 'center', justifyContent: 'center' }}>
                            <ActivityIndicator color={p.pressed ? display.textPressed : display.textColor} size='small' />
                        </View>
                    )}
                    <Text style={[iOSUIKit.title3, { marginTop: size.pad, opacity: doLoading ? 0 : 1, color: p.pressed ? display.textPressed : display.textColor, fontSize: size.fontSize, fontWeight: '600', includeFontPadding: false }]} numberOfLines={1}>{props.title}</Text>
                </View>
            )}
        </Pressable>
    )
});