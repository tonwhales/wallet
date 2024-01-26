import { Camera } from "expo-camera";
import { useState } from "react";
import { Dimensions, Platform } from "react-native";

export function useCameraAspectRatio() {
    // Screen Ratio and image padding for Android
    const [previewSettings, setPreviewSettings] = useState<{
        imagePadding: number;
        ratio: string | undefined;
        ready: boolean;
    }>({ imagePadding: 0, ratio: undefined, ready: false });
    const { height, width } = Dimensions.get('window');
    const screenRatio = height / width;

    // set the camera ratio and padding (portrait mode)
    const prepareRatio = async (camera: Camera) => {
        let desiredRatio = '4:3';  // Start with the system default
        // This issue only affects Android
        if (Platform.OS === 'android') {
            const ratios = await camera.getSupportedRatiosAsync();

            // Calculate the width/height of each of the supported camera ratios
            // These width/height are measured in landscape mode
            // find the ratio that is closest to the screen ratio without going over
            let distances: { [key: string]: number } = {};
            let realRatios: { [key: string]: number } = {};
            let minDistance: string | null = null;
            for (const ratio of (ratios ?? [])) {
                const parts = ratio.split(':');
                const realRatio = parseInt(parts[0]) / parseInt(parts[1]);
                realRatios[ratio] = realRatio;
                // ratio can't be taller than screen, so we don't want an abs()
                const distance = screenRatio - realRatio;
                distances[ratio] = distance;
                if (minDistance == null) {
                    minDistance = ratio;
                } else {
                    if (distance >= 0 && distance < distances[minDistance]) {
                        minDistance = ratio;
                    }
                }
            }
            // set the best match
            desiredRatio = minDistance ?? '4:3';
            //  calculate the diff between the camera width and the screen height
            const remainder = Math.floor(
                (height - realRatios[desiredRatio] * width) / 2
            );
            // set padding and ratio
            setPreviewSettings({ imagePadding: remainder, ratio: desiredRatio, ready: true });
        }
    };

    return { ratio: previewSettings.ratio, imagePadding: previewSettings.imagePadding, prepareRatio, ready: previewSettings.ready };
}