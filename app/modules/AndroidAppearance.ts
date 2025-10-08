import { useEffect, useState } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

export namespace AndroidAppearance {
    export function useColorScheme(): 'light' | 'dark' {
        const [colorScheme, setColorScheme] = useState(getColorScheme());
        useEffect(() => {
            if (Platform.OS !== 'android') {
                return;
            }
            const eventEmitter = new NativeEventEmitter(NativeModules.AppearanceModule);
            let eventListener = eventEmitter.addListener('appearanceStyleChanged', newStyle => {
                if (newStyle === 'light' || newStyle === 'dark') {
                    setColorScheme(newStyle);
                }
            });

            // Removes the listener once unmounted
            return () => {
                eventListener?.remove();
            };
        }, []);

        return colorScheme;
    }

    export function getColorScheme(): 'light' | 'dark' {
        if (Platform.OS !== 'android') {
            return 'light';
        }
        const nativeRes = NativeModules.AppearanceModule.getColorScheme();
        if (nativeRes === 'light' || nativeRes === 'dark') {
            return nativeRes;
        }
        return 'light';
    }

    export function forceThemeUpdate(): void {
        if (Platform.OS === 'android' && NativeModules.AppearanceModule.forceThemeUpdate) {
            try {
                NativeModules.AppearanceModule.forceThemeUpdate();
            } catch (error) {
                // Silent error handling
            }
        }
    }

    export function checkThemeChange(): void {
        if (Platform.OS === 'android' && NativeModules.AppearanceModule.checkThemeChange) {
            try {
                NativeModules.AppearanceModule.checkThemeChange();
            } catch (error) {
                // Silent error handling
            }
        }
    }
}