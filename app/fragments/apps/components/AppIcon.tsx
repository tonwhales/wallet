import React, { useState } from "react";
import { View, Image, StyleProp, ViewStyle } from "react-native";
import { useRecoilValue } from "recoil";
import { AppData } from "../../../engine/api/fetchAppData";
import { useEngine } from "../../../engine/Engine";
import * as FileSystem from 'expo-file-system';

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
    const engine = useEngine();
    const [loading, setLoading] = useState();
    const downloaded = app?.image?.preview256
        ? useRecoilValue(engine.persistence.downloads.item(app.image.preview256).atom)
        : undefined;

    if (downloaded) {
        return (
            <View style={[{
                width: width, height: heigh,
                overflow: 'hidden',
                backgroundColor: 'white',
                borderRadius
            }, style]}>
                <Image
                    source={{ uri: FileSystem.cacheDirectory + downloaded }}
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