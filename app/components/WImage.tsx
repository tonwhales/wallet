import * as React from 'react';
import { ImageRequireSource, StyleProp, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { resolveLink } from '../utils/resolveLink';
import { useTheme } from '../engine/hooks';
import { memo } from 'react';

export const WImage = memo((props: {
    src?: string | null | undefined,
    requireSource?: ImageRequireSource,
    blurhash?: string | null | undefined,
    heigh: number,
    width: number,
    borderRadius: number,
    style?: StyleProp<ViewStyle>,
    lockLoading?: boolean
}) => {
    const theme = useTheme();
    let url = props.src ? resolveLink(props.src) : null;
    let blurhash = url && props.blurhash ? props.blurhash : null;

    if (url && blurhash) {
        return (
            <View style={[{
                width: props.width, height: props.heigh,
                overflow: 'hidden',
                backgroundColor: theme.surfaceOnBg,
                borderRadius: props.borderRadius
            }, props.style]}>
                <Image
                    source={{ uri: url }}
                    style={{ width: props.width, height: props.heigh }}
                    resizeMode={'cover'}
                    placeholder={{ blurhash }}
                />
            </View>
        );
    }

    if (url) {
        return (
            <View style={[{
                width: props.width, height: props.heigh,
                overflow: 'hidden',
                backgroundColor: theme.surfaceOnBg,
                borderRadius: props.borderRadius
            }, props.style]}>
                <Image
                    source={{ uri: url }}
                    style={{ width: props.width, height: props.heigh }}
                    resizeMode={'cover'}
                    placeholder={require('../../assets/ic_app_placeholder.png')}
                />
            </View>
        );
    }

    if (props.requireSource) {
        return (
            <View style={[{
                width: props.heigh, height: props.heigh,
                overflow: 'hidden',
                backgroundColor: theme.surfaceOnBg,
                borderRadius: props.borderRadius
            }, props.style]}>
                <Image
                    source={props.requireSource}
                    style={{ width: props.width, height: props.heigh }}
                    resizeMode={'cover'}
                />
            </View>
        );
    }

    return (
        <View style={[{
            width: props.heigh, height: props.heigh,
            overflow: 'hidden',
            backgroundColor: theme.surfaceOnBg,
            borderRadius: props.borderRadius
        }, props.style]}>
            <Image
                source={require('../../assets/ic_app_placeholder.png')}
                style={{ width: props.width, height: props.heigh }}
                resizeMode={'cover'}
            />
        </View>
    );
});