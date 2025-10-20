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
    height: number,
    width: number,
    borderRadius: number,
    style?: StyleProp<ViewStyle>,
    lockLoading?: boolean
    disablePlaceholder?: boolean
}) => {
    const theme = useTheme();
    let url = props.src ? resolveLink(props.src) : null;
    let blurhash = url && props.blurhash ? props.blurhash : null;

    if (url && blurhash) {
        return (
            <View style={[{
                width: props.width, height: props.height,
                overflow: 'hidden',
                backgroundColor: theme.surfaceOnBg,
                borderRadius: props.borderRadius
            }, props.style]}>
                <Image
                    source={{ uri: url }}
                    style={{ width: props.width, height: props.height }}
                    resizeMode={'cover'}
                    placeholder={{ blurhash }}
                    transition={{
                        duration: 150,
                        timing: 'ease-in-out',
                        effect: 'cross-dissolve'
                    }}
                />
            </View>
        );
    }

    if (url) {
        return (
            <View style={[{
                width: props.width, height: props.height,
                overflow: 'hidden',
                backgroundColor: theme.surfaceOnBg,
                borderRadius: props.borderRadius
            }, props.style]}>
                <Image
                    source={{ uri: url }}
                    style={{ width: props.width, height: props.height }}
                    resizeMode={'cover'}
                    placeholder={props.disablePlaceholder ? undefined : require('@assets/ic_app_placeholder.png')}
                    transition={props.disablePlaceholder ? undefined : {
                        duration: 150,
                        timing: 'ease-in-out',
                        effect: 'cross-dissolve'
                    }}
                />
            </View>
        );
    }

    if (props.requireSource) {
        return (
            <View style={[{
                width: props.height, height: props.height,
                overflow: 'hidden',
                backgroundColor: theme.surfaceOnBg,
                borderRadius: props.borderRadius
            }, props.style]}>
                <Image
                    source={props.requireSource}
                    style={{ width: props.width, height: props.height }}
                    resizeMode={'cover'}
                    transition={{
                        duration: 150,
                        timing: 'ease-in-out',
                        effect: 'cross-dissolve'
                    }}
                />
            </View>
        );
    }

    return (
        <View style={[{
            width: props.height, height: props.height,
            overflow: 'hidden',
            backgroundColor: theme.surfaceOnBg,
            borderRadius: props.borderRadius
        }, props.style]}>
            <Image
                source={require('@assets/ic_app_placeholder.png')}
                style={{ width: props.width, height: props.height }}
                resizeMode={'cover'}
            />
        </View>
    );
});