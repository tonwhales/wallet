import { createContext, memo, useCallback, useContext, useEffect, useState } from "react";
import { View, Text } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useAppConfig } from "../../utils/AppConfigContext";

import DoneIcon from '../../../assets/ic-done.svg';
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Icons = {
    // 'warning': require('../../../assets/ic-warning.svg'),
    'warning': null,
    'default': DoneIcon,
    // 'error': require('../../../assets/ic-error.svg'),
    'error': null,
    'success': DoneIcon
}

const ToastContext = createContext<{
    show: (component: React.ReactNode) => void;
    clear: () => void;
    push: (component: React.ReactNode) => void;
    pop: () => void;
} | null>(null);

export enum ToastDuration {
    SHORT = 2000,
    DEFAULT = 3500,
    LONG = 6000
}

export const Toast = memo(({ message, type = 'default' }: { message: string, type?: 'warning' | 'default' | 'error' | 'success' }) => {
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
    const [showing, setShowing] = useState<{ id: number, component: any, duration: number }[]>([]);

    const show = useCallback((component: React.ReactNode, duration?: number) => {
        setShowing([{ id: Date.now() + (duration || ToastDuration.DEFAULT), component, duration: duration || ToastDuration.DEFAULT }]);
    }, []);

    const clear = useCallback(() => {
        setShowing([]);
    }, []);

    const push = useCallback((component: React.ReactNode, duration?: number) => {
        const newShowing = [...showing, { id: Date.now() + (duration || ToastDuration.DEFAULT), component, duration: duration || ToastDuration.DEFAULT }];
        setShowing(newShowing);
    }, [showing]);

    const pop = useCallback(() => {
        setShowing(showing.slice(0, showing.length - 1));
    }, [showing]);

    useEffect(() => {
        if (showing.length > 0) {
            // Remove all that are expired
            const timer = setTimeout(() => {
                setShowing(showing.filter((c) => c.id > Date.now()));
            }, showing[showing.length - 1].duration);
            return () => {
                clearTimeout(timer);
            }
        }
    }, [showing]);

    return (
        <ToastContext.Provider value={{ show, clear, push, pop }}>
            {props.children}
            <View
                style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: safeArea.bottom + 32,
                    flexDirection: 'column-reverse',
                    alignItems: 'center',
                }}
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
            </View>
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