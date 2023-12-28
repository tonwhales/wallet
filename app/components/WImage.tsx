import * as React from 'react';
import { ImageRequireSource, StyleProp, View, ViewStyle } from 'react-native';
import Image from 'react-native-fast-image';
import { resolveLink } from '../utils/resolveLink';
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Blurhash } from 'react-native-blurhash';
import { useTheme } from '../engine/hooks';
import { memo, useState } from 'react';

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
    const [loading, setLoading] = useState(true);
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
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                />
                {loading && !props.lockLoading && (
                    <Animated.View
                        entering={FadeIn}
                        exiting={FadeOut}
                        style={{
                            borderRadius: props.borderRadius,
                            position: 'absolute',
                            top: 0, bottom: 0, left: 0, right: 0
                        }}>
                        <Blurhash
                            blurhash={blurhash}
                            style={{ flexGrow: 1 }}
                            decodeHeight={16}
                            decodeWidth={16}
                            decodeAsync={true}
                        />
                    </Animated.View>
                )}
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
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                />
                {loading && (
                    <Animated.View
                        entering={FadeIn}
                        exiting={FadeOut}
                        style={{
                            borderRadius: props.borderRadius,
                            position: 'absolute',
                            top: 0, bottom: 0, left: 0, right: 0
                        }}>
                        <Image
                            source={require('../../assets/ic_app_placeholder.png')}
                            style={{ width: props.width, height: props.heigh }}
                            resizeMode={'cover'}
                        />
                    </Animated.View>
                )}
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