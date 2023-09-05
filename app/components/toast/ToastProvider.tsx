import { createContext, memo, useCallback, useContext, useEffect, useState } from "react";
import { View, Text } from "react-native";
import Animated, { FadeInDown, FadeOutDown, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import DoneIcon from '../../../assets/ic-done.svg';

const Icons = {
    // 'warning': require('../../../assets/ic-warning.svg'),
    'warning': null,
    'default': DoneIcon,
    // 'error': require('../../../assets/ic-error.svg'),
    'error': null,
    'success': DoneIcon
}

export enum ToastDuration {
    SHORT = 2000,
    DEFAULT = 3500,
    LONG = 6000
}

export type ToastProps = {
    message: string,
    type: 'warning' | 'default' | 'error' | 'success',
    onDestroy?: () => void,
    duration?: ToastDuration,
    marginBottom?: number
}

const ToastContext = createContext<{
    show: (props: ToastProps) => void;
    clear: () => void;
    push: (props: ToastProps) => void;
    pop: () => void;
} | null>(null);

export const Toast = memo(({
    message,
    type,
    onDestroy,
}: ToastProps) => {
    const { Theme } = useAppConfig();

    let Icon = Icons[type];

    const ToastStyle = {
        'warning': {
            view: {
                backgroundColor: Theme.lightGrey,
            },
            text: {
                color: Theme.darkGrey
            }
        },
        'default': {
            view: {
                backgroundColor: Theme.black,
            },
            text: {
                color: Theme.white
            }
        },
        'error': {
            view: {
                backgroundColor: Theme.red,
            },
            text: {
                color: Theme.white
            }
        },
        'success': {
            view: {
                backgroundColor: Theme.green,
            },
            text: {
                color: Theme.white
            }
        }
    }

    useEffect(() => {
        return () => {
            if (onDestroy) {
                onDestroy();
            }
        }
    }, [onDestroy]);

    return (
        <View style={[
            {
                height: 44,
                flexDirection: 'row',
                borderRadius: 16,
                padding: 10, paddingHorizontal: 16,
                alignItems: 'center', justifyContent: 'center',
                marginTop: 8
            },
            ToastStyle[type].view
        ]}>
            {Icon && (
                <Icon height={24} width={24} style={{ height: 24, width: 24, marginRight: 12 }} color={Theme.white} />
            )}
            <Text style={[{ fontSize: 15, lineHeight: 20 }, ToastStyle[type].text]}>
                {message}
            </Text>
        </View>
    );
});


export const ToastProvider = memo((props: { children: React.ReactNode }) => {
    const safeArea = useSafeAreaInsets();
    const defaultMarginBottom = safeArea.bottom + 32;
    const marginBottom = useSharedValue(defaultMarginBottom);
    const [showing, setShowing] = useState<{ id: number, component: any }[]>([]);

    const filterExpired = useCallback(() => {
        const newShowing = showing.filter((c) => {
            return c.id > Date.now();
        });
        setShowing(newShowing);
        return newShowing;
    }, [showing]);

    const show = useCallback((props: ToastProps) => {
        const id = Date.now() + (props.duration || ToastDuration.DEFAULT);
        marginBottom.value = props.marginBottom !== undefined ? props.marginBottom : defaultMarginBottom;
        setShowing([
            {
                id,
                component: (
                    <Toast
                        {...props}
                        onDestroy={() => {
                            if (props.onDestroy) {
                                props.onDestroy();
                            }
                        }}
                    />
                ),
            }
        ]);
    }, []);

    const clear = useCallback(() => {
        setShowing([]);
    }, []);

    const push = useCallback((props: ToastProps) => {
        marginBottom.value = props.marginBottom !== undefined ? props.marginBottom : defaultMarginBottom;
        const filtered = filterExpired();
        const id = Date.now() + (props.duration || ToastDuration.DEFAULT);
        const newShowing = [
            ...filtered,
            {
                id,
                component: (
                    <Toast
                        {...props}
                        onDestroy={() => {
                            if (props.onDestroy) {
                                props.onDestroy();
                            }
                        }}
                    />
                )
            }
        ];
        setShowing(newShowing);
    }, [filterExpired]);

    const pop = useCallback(() => {
        const filtered = filterExpired();
        if (filtered.length > 0) {
            setShowing(filtered.slice(0, filtered.length - 1));
        }
    }, [filterExpired]);

    useEffect(() => {
        if (showing.length == 0) {
            return;
        }
        const interval = setInterval(() => {
            filterExpired();
        }, 100);
        return () => {
            clearInterval(interval);
        }
    }, [filterExpired, showing]);

    const animMargin = useAnimatedStyle(() => {
        return {
            bottom: marginBottom.value
        }
    });

    return (
        <ToastContext.Provider value={{ show, clear, push, pop }}>
            {props.children}
            <Animated.View
                style={[
                    {
                        position: 'absolute', top: 0, left: 0, right: 0,
                        flexDirection: 'column-reverse',
                        alignItems: 'center',
                    },
                    animMargin
                ]}
                pointerEvents={'none'}
            >
                {showing.map((c, i) => {
                    return (
                        <Animated.View
                            key={`${c.id}-${i}`}
                            entering={FadeInDown}
                            exiting={FadeOutDown}
                        >
                            {c.component}
                        </Animated.View>
                    )
                })}
            </Animated.View>
        </ToastContext.Provider>
    );
});

export function useToaster() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}