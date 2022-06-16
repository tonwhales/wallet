import React, { useState } from "react";
import { View, Image, StyleProp, ViewStyle } from "react-native";
import { AppData } from "../../../engine/api/fetchAppData";
import { resolveLink } from "../../../utils/resolveLink";
import { Blurhash } from 'react-native-blurhash';
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

export const AppIcon = React.memo((
    {
        app,
        style,
        heigh,
        width,
        borderRadius
    }: {
        app?: AppData | null,
        style?: StyleProp<ViewStyle>,
        heigh: number,
        width: number,
        borderRadius: number
    }
) => {
    const [loading, setLoading] = useState(true);
    let url = app && app.image && app.image.preview256 ? resolveLink(app.image.preview256) : null;

    if (url) {
        return (
            <View style={[{
                width: width, height: heigh,
                overflow: 'hidden',
                backgroundColor: 'white',
                borderRadius
            }, style]}>
                <Image
                    source={{ uri: url }}
                    style={{ width: width, height: heigh }}
                    resizeMode={'cover'}
                    onLoadEnd={() => setLoading(false)}
                />
                {loading && (
                    <Animated.View
                        exiting={FadeOut}
                        style={{
                            borderRadius,
                            position: 'absolute',
                            top: 0, bottom: 0, left: 0, right: 0
                        }}>
                        <Blurhash
                            blurhash={app!.image!.blurhash}
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
                    borderRadius
                }} />
            </View>
        );
    }

    return (
        <View style={[{
            width: width, height: heigh,
            overflow: 'hidden',
            backgroundColor: 'white',
            borderRadius
        }, style]}>
            <Image
                source={require('../../../../assets/ic_app_placeholder.png')}
                style={{ width: width, height: heigh }}
                resizeMode={'cover'}
            />
            <View style={{
                borderWidth: 0.5,
                borderColor: 'black',
                backgroundColor: 'transparent',
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                opacity: 0.06,
                borderRadius
            }} />
        </View>
    );
});