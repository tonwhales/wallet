import React from "react";
import { createContext, memo, useCallback, useContext, useEffect, useState } from "react";
import { View, Text } from "react-native";
import Animated, { FadeInDown, FadeOutDown, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../engine/hooks";
import { z } from "zod";

import DoneIcon from '@assets/ic-done.svg';
import ErrorIcon from '@assets/ic-error-alert.svg';
import WarningIcon from '@assets/ic-warning.svg';

const Icons = {
    'warning': WarningIcon,
    'default': DoneIcon,
    'error': ErrorIcon,
    'success': DoneIcon
}

export enum ToastDuration {
    SHORT = 2000,
    DEFAULT = 3500,
    LONG = 6000
}

const injectedToastPropsCodec = z.object({
    message: z.string(),
    type: z.union([z.literal('warning'), z.literal('default'), z.literal('error'), z.literal('success')]),
    duration: z.union([z.literal(ToastDuration.SHORT), z.literal(ToastDuration.DEFAULT), z.literal(ToastDuration.LONG)]).optional(),
    marginBottom: z.number().optional()
});

export type ToastProps = {
    message: string,
    type: 'warning' | 'default' | 'error' | 'success',
    onDestroy?: () => void,
    duration?: ToastDuration,
    marginBottom?: number
}

export type Toaster = {
    show: (props: ToastProps) => void,
    clear: () => void,
    push: (props: ToastProps) => void,
    pop: () => void
}

const ToastContext = createContext<Toaster | null>(null);

export const Toast = memo(({
    message,
    type,
    onDestroy,
}: ToastProps) => {
    const theme = useTheme();

    let Icon = Icons[type];

    const ToastStyle = {
        'warning': {
            view: {
                backgroundColor: theme.border,
            },
            text: {
                color: theme.textSecondary
            }
        },
        'default': {
            view: {
                backgroundColor: theme.black,
            },
            text: {
                color: theme.white
            }
        },
        'error': {
            view: {
                backgroundColor: theme.accentRed,
            },
            text: {
                color: theme.white
            }
        },
        'success': {
            view: {
                backgroundColor: theme.accentGreen,
            },
            text: {
                color: theme.white
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
        <View style={{ paddingHorizontal: 16 }}>
            <View style={[
                {
                    minHeight: 44,
                    flexDirection: 'row',
                    borderRadius: 16,
                    padding: 10, paddingHorizontal: 16,
                    alignItems: 'center', justifyContent: 'center',
                    marginTop: 8
                },
                ToastStyle[type].view
            ]}>
                {Icon && (
                    <Icon height={24} width={24} style={{ height: 24, width: 24, marginRight: 12 }} color={theme.white} />
                )}
                <Text style={[{ fontSize: 15, lineHeight: 20, textAlign: !!Icon ? 'left' : 'center' }, ToastStyle[type].text]}>
                    {message}
                </Text>
            </View>
        </View>
    );
});


export function processToasterMessage(parsed: any, toaster: Toaster) {
    if (typeof parsed.data.name === 'string' && (parsed.data.name as string).startsWith('toaster.')) {
        const actionType = parsed.data.name.split('.')[1];
        const actionArgs = parsed.data.args;

        if (actionType === 'clear') {
            toaster.clear();
            return true;
        }

        if (actionType === 'pop') {
            toaster.pop();
            return true;
        }

        const parsedArgs = injectedToastPropsCodec.safeParse(actionArgs);

        if (!parsedArgs.success) {
            return false;
        }

        if (actionType === 'show') {
            toaster.show(parsedArgs.data);
            return true;
        }

        if (actionType === 'push') {
            toaster.push(parsedArgs.data);
            return true;
        }
    }

    return false;
}


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
ToastProvider.displayName = 'ToastProvider';

export function useToaster() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}