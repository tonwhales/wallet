import * as React from 'react';
import { ActivityIndicator, ImageSourcePropType, Platform, Pressable, StyleProp, Text, View, ViewStyle, Image } from 'react-native';
import { iOSUIKit } from 'react-native-typography';
import { useAppConfig } from '../utils/AppConfigContext';

export type RoundButtonSize = 'large' | 'normal' | 'small';
const sizes: { [key in RoundButtonSize]: { height: number, fontSize: number, hitSlop: number, pad: number } } = {
    large: { height: 56, fontSize: 17, hitSlop: 0, pad: Platform.OS == 'ios' ? 0 : -1 },
    normal: { height: 32, fontSize: 16, hitSlop: 8, pad: Platform.OS == 'ios' ? 1 : -2 },
    small: { height: 24, fontSize: 14, hitSlop: 12, pad: Platform.OS == 'ios' ? -1 : -1 }
}

export type RoundButtonDisplay = 'default' | 'outline' | 'inverted' | 'pro' | 'telegram' | 'text' | 'secondary' | 'secondary_contrast' | 'disabled' | 'danger_zone';

export const RoundButton = React.memo((props: {
    size?: RoundButtonSize,
    display?: RoundButtonDisplay,
    title?: string,
    subtitle?: string,
    style?: StyleProp<ViewStyle>,
    disabled?: boolean,
    loading?: boolean,
    onPress?: () => void,
    action?: () => Promise<any>,
    iconImage?: ImageSourcePropType
    icon?: any
}) => {
    const { Theme } = useAppConfig();
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
            textColor: Theme.item,

            backgroundPressedColor: Theme.accentDark,
            borderPressedColor: Theme.accentDark,
            textPressed: Theme.item,
        },
        disabled: {
            backgroundColor: Theme.disabled,
            borderColor: Theme.disabled,
            textColor: Theme.item,

            backgroundPressedColor: Theme.accentDark,
            borderPressedColor: Theme.accentDark,
            textPressed: Theme.item,
        },
        secondary: {
            backgroundColor: Theme.secondaryButton,
            borderColor: Theme.secondaryButton,
            textColor: Theme.secondaryButtonText,

            backgroundPressedColor: Theme.selector,
            borderPressedColor: Theme.selector,
            textPressed: Theme.secondaryButtonText,
        },
        secondary_contrast: {
            backgroundColor: Theme.secondaryButton,
            borderColor: Theme.secondaryButton,
            textColor: Theme.textColor,

            backgroundPressedColor: Theme.selector,
            borderPressedColor: Theme.selector,
            textPressed: Theme.secondaryButtonText,
        },
        pro: {
            backgroundColor: Theme.textColor,
            borderColor: Theme.textColor,
            textColor: Theme.item,

            backgroundPressedColor: Theme.pressedRoundButton,
            borderPressedColor: Theme.pressedRoundButton,
            textPressed: Theme.item,
        },
        telegram: {
            backgroundColor: Theme.telegram,
            borderColor: Theme.telegram,
            textColor: Theme.item,

            backgroundPressedColor: Theme.pressedRoundButton,
            borderPressedColor: Theme.pressedRoundButton,
            textPressed: Theme.item,
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
            backgroundColor: Theme.item,
            borderColor: Theme.item,
            textColor: Theme.accent,

            backgroundPressedColor: Theme.divider,
            borderPressedColor: Theme.divider,
            textPressed: Theme.accent,
        },
        text: {
            backgroundColor: Theme.transparent,
            borderColor: Theme.transparent,
            textColor: Theme.accentText,

            backgroundPressedColor: Theme.divider,
            borderPressedColor: Theme.divider,
            textPressed: Theme.accent,
        },
        danger_zone: {
            backgroundColor: Theme.item,
            borderColor: Theme.item,
            textColor: Theme.dangerZone,

            backgroundPressedColor: Theme.divider,
            borderPressedColor: Theme.divider,
            textPressed: Theme.accent,
        },
    }

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
    const display = props.disabled
        ? displays['disabled']
        : displays[props.display || 'default'];

    return (
        <Pressable
            disabled={doLoading || props.disabled}
            hitSlop={size.hitSlop}
            style={(p) => ([
                {
                    borderWidth: 1,
                    borderRadius: 14,
                    backgroundColor: display.backgroundColor,
                    borderColor: display.borderColor,
                },
                p.pressed && {
                    opacity: 0.55
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
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>

                        {!doLoading && props.iconImage && (
                            <Image
                                source={props.iconImage}
                                style={{ marginRight: 10, width: 20, height: 20 }}
                            />
                        )}
                        {!doLoading && props.icon && (<View style={{ marginRight: 10 }}>{props.icon}</View>)}
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                            <Text
                                style={[iOSUIKit.title3, { marginTop: size.pad, opacity: (doLoading ? 0 : 1) * (p.pressed ? 0.55 : 1), color: p.pressed ? display.textPressed : display.textColor, fontSize: size.fontSize, fontWeight: '600', includeFontPadding: false }]}
                                numberOfLines={1}
                                ellipsizeMode='tail'
                            >
                                {props.title}
                            </Text>
                            {!!props.subtitle && (
                                <Text
                                    style={[{ marginTop: 0, opacity: (doLoading ? 0 : 1) * (p.pressed ? 0.55 : 1), color: p.pressed ? display.textPressed : display.textColor, fontSize: 14, fontWeight: '400', includeFontPadding: false }]}
                                    numberOfLines={1}
                                    ellipsizeMode='tail'
                                >
                                    {props.subtitle}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            )}
        </Pressable>
    )
});