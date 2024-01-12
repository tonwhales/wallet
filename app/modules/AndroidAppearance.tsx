import { useEffect, useState } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';

export namespace AndroidAppearance {
    export function useColorScheme(): 'light' | 'dark' {
        const [colorScheme, setColorScheme] = useState(getColorScheme());
        useEffect(() => {
            const eventEmitter = new NativeEventEmitter(NativeModules.AppearanceModule);
            let eventListener = eventEmitter.addListener('appearanceStyleChanged', newStyle => {
                console.log('Appearance style changed to ' + newStyle);
                if (newStyle === 'light' || newStyle === 'dark') {
                    setColorScheme(newStyle);
                }
            });

            // Removes the listener once unmounted
            return () => {
                eventListener.remove();
            };
        }, []);

        return colorScheme;
    }

    export function getColorScheme(): 'light' | 'dark' {
        const nativeRes = NativeModules.AppearanceModule.getColorScheme();
        if (nativeRes === 'light' || nativeRes === 'dark') {
            return nativeRes;
        }
        return 'light';
    }
}