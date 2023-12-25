import * as React from 'react';
import { ActivityIndicator, Animated, Keyboard, Platform, View } from 'react-native';
import { useTheme } from '../engine/hooks';

const GlobalLoaderContext = React.createContext<{ show: () => () => void } | null>(null);

export function useGlobalLoader() {
    let res = React.useContext(GlobalLoaderContext);
    if (!res) {
        throw Error('No loader found');
    }
    return res;
}

export const GlobalLoaderProvider = React.memo((props: { children?: any }) => {
    const theme = useTheme();
    const [visible, setVisible] = React.useState(false);

    const backgroundOpacity = React.useMemo(() => new Animated.Value(0), []);
    const loaderOpacity = React.useMemo(() => new Animated.Value(0), []);

    const context = React.useMemo(() => {

        let loaded = 0;

        function showLoader() {
            Keyboard.dismiss();
            Animated.parallel([
                Animated.timing(loaderOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.timing(backgroundOpacity, { toValue: 1, duration: 400, useNativeDriver: true })
            ]).start()
            setVisible(true);
        }

        function hideLoader() {
            Animated.parallel([
                Animated.timing(loaderOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(backgroundOpacity, { toValue: 0, duration: 250, useNativeDriver: true })
            ]).start();
            setVisible(false);
        }

        return {
            show: () => {
                let stopped = false;
                loaded++;
                if (loaded === 1) {
                    showLoader();
                }
                return () => {
                    if (!stopped) {
                        stopped = true;
                        loaded--;
                        if (loaded === 0) {
                            hideLoader();
                        }
                    }
                }
            }
        }
    }, []);

    return (
        <GlobalLoaderContext.Provider value={context}>
            <View style={{ flexGrow: 1 }}>
                {props.children}

                <Animated.View style={{ opacity: backgroundOpacity, backgroundColor: 'rgba(0,0,0,0.49)', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents={visible ? 'auto' : 'box-none'} />
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }} pointerEvents="none">
                    <Animated.View style={{ backgroundColor: theme.backgroundPrimary, width: 120, height: 120, borderRadius: 36, opacity: loaderOpacity, justifyContent: 'center', alignItems: 'center' }}>
                        {Platform.OS === 'ios' && (<ActivityIndicator size="large" style={{ transform: [{ translateX: 2 }, { translateY: 2 }] }} />)}
                        {Platform.OS !== 'ios' && (<ActivityIndicator size={64} color={theme.accent} animating={true} />)}
                    </Animated.View>
                </View>
            </View>
        </GlobalLoaderContext.Provider>
    )
})
GlobalLoaderProvider.displayName = 'GlobalLoaderProvider';