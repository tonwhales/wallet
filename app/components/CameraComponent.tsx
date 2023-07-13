import React from 'react';
import { ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { Camera, Frame, useCameraDevices } from 'react-native-vision-camera';

export const CameraComponent = React.memo((
    {
        isActive,
        frameProcessor,
        frameProcessorFps,
        torch
    }: {
        isActive: boolean,
        frameProcessor?: (frame: Frame) => void,
        frameProcessorFps?: number,
        torch?: boolean
    }) => {

    if (Platform.OS === 'ios') {
        const devices = useCameraDevices('wide-angle-camera');
        const device = devices.back;

        return (
            <>
                {(!device || !isActive) && (
                    <ActivityIndicator style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} color={'white'} />
                )}
                {device && isActive && (
                    <Camera
                        style={StyleSheet.absoluteFill}
                        device={device}
                        isActive={isActive}
                        frameProcessor={frameProcessor}
                        frameProcessorFps={2}
                        torch={torch ? 'on' : 'off'}
                    />
                )}
            </>
        );
    } else {
        const devices = useCameraDevices();
        const device = devices.back;

        return (
            <>
                {(!device || !isActive) && (
                    <ActivityIndicator color={'white'} />
                )}
                {device && isActive && (
                    <Camera
                        style={StyleSheet.absoluteFill}
                        device={device}
                        isActive={isActive}
                        frameProcessor={frameProcessor}
                        frameProcessorFps={2}
                        torch={torch ? 'on' : 'off'}
                    />
                )}
            </>
        )
    }
});