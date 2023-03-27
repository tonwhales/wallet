import * as React from 'react';
import { Image, ImageRequireSource, StyleProp, View, ViewStyle } from 'react-native';
import { resolveLink } from '../utils/resolveLink';
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Blurhash } from 'react-native-blurhash';

export const WImage = React.memo((props: {
    src?: string | null | undefined,
    requireSource?: ImageRequireSource,
    blurhash?: string | null | undefined,
    heigh: number,
    width: number,
    borderRadius: number,
    style?: StyleProp<ViewStyle>,
    lockLoading?: boolean
}) => {

    const [loading, setLoading] = React.useState(false);
    let url = props.src ? resolveLink(props.src) : null;
    let blurhash = url && props.blurhash ? props.blurhash : null;

    if (url && blurhash) {
        return (
            <View style={[{
                width: props.width, height: props.heigh,
                overflow: 'hidden',
                backgroundColor: 'white',
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
                <View style={{
                    borderWidth: 0.5,
                    borderColor: 'black',
                    backgroundColor: 'transparent',
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    opacity: 0.06,
                    borderRadius: props.borderRadius
                }} />
            </View>
        );
    }

    if (url) {
        return (
            <View style={[{
                width: props.width, height: props.heigh,
                overflow: 'hidden',
                backgroundColor: 'white',
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
                <View style={{
                    borderWidth: 0.5,
                    borderColor: 'black',
                    backgroundColor: 'transparent',
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    opacity: 0.06,
                    borderRadius: props.borderRadius
                }} />
            </View>
        );
    }

    if (props.requireSource) {
        return (
            <View style={[{
                width: props.heigh, height: props.heigh,
                overflow: 'hidden',
                backgroundColor: 'white',
                borderRadius: props.borderRadius
            }, props.style]}>
                <Image
                    source={props.requireSource}
                    style={{ width: props.width, height: props.heigh }}
                    resizeMode={'cover'}
                />
                <View style={{
                    borderWidth: 0.5,
                    borderColor: 'black',
                    backgroundColor: 'transparent',
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    opacity: 0.06,
                    borderRadius: props.borderRadius
                }} />
            </View>
        );
    }

    return (
        <View style={[{
            width: props.heigh, height: props.heigh,
            overflow: 'hidden',
            backgroundColor: 'white',
            borderRadius: props.borderRadius
        }, props.style]}>
            <Image
                source={require('../../assets/ic_app_placeholder.png')}
                style={{ width: props.width, height: props.heigh }}
                resizeMode={'cover'}
            />
            <View style={{
                borderWidth: 0.5,
                borderColor: 'black',
                backgroundColor: 'transparent',
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                opacity: 0.06,
                borderRadius: props.borderRadius
            }} />
        </View>
    );
});