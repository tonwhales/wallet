import * as React from 'react';
import { ActivityIndicator, ImageSourcePropType, Platform, Pressable, StyleProp, Text, View, ViewStyle, Image } from 'react-native';
import { iOSUIKit } from 'react-native-typography';
import { RoundButtonDisplay, roundButtonDisplays } from './roundButtonDisplays';
import { useTheme } from '../engine/hooks';
import { memo, useCallback, useState } from 'react';
import { PerfView } from './basic/PerfView';

export type RoundButtonSize = 'large' | 'normal' | 'small';
const sizes: { [key in RoundButtonSize]: { height: number, fontSize: number, hitSlop: number, pad: number } } = {
    large: { height: 56, fontSize: 17, hitSlop: 0, pad: Platform.OS == 'ios' ? 0 : -1 },
    normal: { height: 32, fontSize: 16, hitSlop: 8, pad: Platform.OS == 'ios' ? 1 : -2 },
    small: { height: 24, fontSize: 14, hitSlop: 12, pad: Platform.OS == 'ios' ? -1 : -1 }
}

export const RoundButton = memo((props: {
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
    icon?: any,
    loadingStatus?: string
}) => {
    const theme = useTheme();

    const [loading, setLoading] = useState(false);
    const doLoading = props.loading !== undefined ? props.loading : loading;
    const doAction = useCallback(() => {
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
        ? roundButtonDisplays(theme)['disabled']
        : roundButtonDisplays(theme)[props.display || 'default'];

    return (
        <Pressable
            disabled={doLoading || props.disabled}
            hitSlop={size.hitSlop}
            style={(p) => ([
                {
                    borderWidth: 1,
                    borderRadius: 16,
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
                <PerfView style={{ height: size.height - 2, alignItems: 'center', justifyContent: 'center', minWidth: 64, paddingHorizontal: 16, }}>
                    {doLoading && !props.loadingStatus && (
                        <PerfView style={{
                            position: 'absolute',
                            left: 0, right: 0, bottom: 0, top: 0,
                            alignItems: 'center', justifyContent: 'center',
                            opacity: props.disabled ? 0.6 : 1
                        }}>
                            <ActivityIndicator color={display.textColor} size='small' />
                        </PerfView>
                    )}
                    {doLoading && props.loadingStatus && (
                        <PerfView style={{
                            position: 'absolute', left: 0, right: 0, bottom: 0, top: 0,
                            alignItems: 'center', justifyContent: 'center',
                            flexDirection: 'row',
                        }}>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 16,
                                color: display.textColor,
                                marginRight: 8
                            }}>
                                {props.loadingStatus}
                            </Text>
                            <ActivityIndicator color={display.textColor} size='small' />
                        </PerfView>
                    )}
                    <PerfView style={{
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
                        {!doLoading && props.icon && (<PerfView style={{ marginRight: 10 }}>{props.icon}</PerfView>)}
                        <PerfView style={{ justifyContent: 'center', alignItems: 'center' }}>
                            <Text
                                style={[
                                    iOSUIKit.title3,
                                    {
                                        marginTop: size.pad,
                                        opacity: doLoading ? 0 : props.disabled ? 0.6 : 1,
                                        color: display.textColor,
                                        fontSize: size.fontSize,
                                        fontWeight: '600',
                                        includeFontPadding: false
                                    }
                                ]}
                                numberOfLines={1}
                                ellipsizeMode='tail'
                            >
                                {props.title}
                            </Text>
                            {!!props.subtitle && (
                                <Text
                                    style={[{
                                        marginTop: 0,
                                        opacity: doLoading ? 0 : props.disabled ? 0.6 : 1,
                                        color: display.textColor,
                                        fontSize: 14,
                                        fontWeight: '400',
                                        includeFontPadding: false
                                    }]}
                                    numberOfLines={1}
                                    ellipsizeMode='tail'
                                >
                                    {props.subtitle}
                                </Text>
                            )}
                        </PerfView>
                    </PerfView>
                </PerfView>
            )}
        </Pressable>
    )
});