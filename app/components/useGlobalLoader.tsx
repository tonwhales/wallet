import * as React from 'react';
import { ActivityIndicator, Animated, Keyboard, Platform, Pressable, View } from 'react-native';
import { useTheme } from '../engine/hooks';
import { createContext, memo, useCallback, useContext, useMemo, useState } from 'react';

const GlobalLoaderContext = createContext<{ show: () => () => void } | null>(null);

export function useGlobalLoader() {
    let res = useContext(GlobalLoaderContext);
    if (!res) {
        throw Error('No loader found');
    }
    return res;
}

export const GlobalLoaderProvider = memo((props: { children?: any }) => {
    const theme = useTheme();
    const [visible, setVisible] = useState(false);
    const [backdropPressable, setBackdropPressable] = useState(false);

    const backgroundOpacity = useMemo(() => new Animated.Value(0), []);
    const loaderOpacity = useMemo(() => new Animated.Value(0), []);

    const showLoader = useCallback(() => {
        setBackdropPressable(false);

        Keyboard.dismiss();
        Animated.parallel([
            Animated.timing(loaderOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.timing(backgroundOpacity, { toValue: 1, duration: 400, useNativeDriver: true })
        ]).start()
        setVisible(true);

        setTimeout(() => {
            setBackdropPressable(true);
        }, 2500);
    }, []);

    const hideLoader = useCallback(() => {
        setBackdropPressable(false);
        Animated.parallel([
            Animated.timing(loaderOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(backgroundOpacity, { toValue: 0, duration: 250, useNativeDriver: true })
        ]).start();
        setVisible(false);
    }, []);

    const context = useMemo(() => {
        let loaded = 0;

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

                <Animated.View
                    style={{ opacity: backgroundOpacity, backgroundColor: 'rgba(0,0,0,0.49)', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    pointerEvents={visible ? 'auto' : 'box-none'}
                >
                    <Pressable
                        style={{ height: '100%', width: '100%' }}
                        pointerEvents={(visible && backdropPressable) ? 'auto' : 'box-none'}
                        onPress={hideLoader}
                    />
                </Animated.View>
                <View
                    style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        justifyContent: 'center', alignItems: 'center'
                    }}
                    pointerEvents="none"
                >
                    <Animated.View
                        style={{
                            backgroundColor: theme.backgroundPrimary,
                            width: 120, height: 120,
                            borderRadius: 36,
                            opacity: loaderOpacity,
                            justifyContent: 'center', alignItems: 'center'
                        }}
                    >
                        {Platform.OS === 'ios' && (<ActivityIndicator size="large" style={{ transform: [{ translateX: 2 }, { translateY: 2 }] }} />)}
                        {Platform.OS !== 'ios' && (<ActivityIndicator size={64} color={theme.accent} animating={true} />)}
                    </Animated.View>
                </View>
            </View>
        </GlobalLoaderContext.Provider>
    )
})
GlobalLoaderProvider.displayName = 'GlobalLoaderProvider';