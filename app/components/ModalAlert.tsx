import { createContext, ForwardedRef, forwardRef, memo, PropsWithChildren, ReactNode, RefObject, useContext, useImperativeHandle, useRef, useState } from "react";
import { View, Text } from "react-native";
import Modal from "react-native-modal";
import { RoundButton } from "./RoundButton";
import { Image } from 'expo-image';
import { useTheme } from "../engine/hooks";
import { Typography } from "./styles";
import { RoundButtonDisplay } from "./roundButtonDisplays";

export type ModalAlertRef = {
    show: () => void;
    hide: () => void;
    showWithProps: (props: ModalAlertProps) => void;
    clear: () => void;
}

export type ModalAlertButton = {
    text: string;
    onPress: () => void;
    display?: RoundButtonDisplay
}

export type ModalAlertProps = {
    buttons?: ModalAlertButton[];
    title?: string | null;
    message?: string | null;
    subtitle?: string | null;
    icon?: string | null;
    content?: ReactNode | null
}

type ModalState = ModalAlertProps & { isOpen: boolean };

const ModalAlertContext = createContext<RefObject<ModalAlertRef> | null>(null);

export const ModalAlertProvider = (props: PropsWithChildren) => {
    const ref = useRef<ModalAlertRef>(null);

    return (
        <ModalAlertContext.Provider value={ref}>
            <ModalAlert ref={ref} />
            {props.children}
        </ModalAlertContext.Provider>
    );
}

export function useModalAlert() {
    const context = useContext(ModalAlertContext);

    if (!context) {
        throw new Error('useModalAlert must be used within a ModalAlertProvider');
    }

    return context;
}

export const ModalAlert = memo(forwardRef((
    props: ModalAlertProps,
    ref: ForwardedRef<ModalAlertRef>
) => {
    const [alertState, setAlertState] = useState<ModalState | null>(null);
    const theme = useTheme();
    const { isOpen, icon, title, message, content, buttons, subtitle } = alertState || {};

    useImperativeHandle(ref, () => ({
        show: () => setAlertState({ ...props, isOpen: true }),
        hide: () => setAlertState({ ...props, isOpen: false }),
        showWithProps: (props: ModalAlertProps) => setAlertState({ ...props, isOpen: true }),
        clear: () => setAlertState(null)
    }), [setAlertState]);

    return (
        <Modal
            isVisible={isOpen}
            avoidKeyboard
            onBackdropPress={() => setAlertState({ ...alertState, isOpen: false })}
        >
            <View style={{
                borderRadius: 20, padding: 20,
                backgroundColor: theme.backgroundPrimary,
                justifyContent: 'center', alignItems: 'center'
            }}>
                {icon && (
                    <View style={{
                        width: 54, height: 54,
                        borderRadius: 27, marginTop: -46,
                        backgroundColor: theme.backgroundPrimary,
                        justifyContent: 'center', alignItems: 'center'
                    }}>
                        <Image
                            source={{ uri: icon }}
                            style={{ width: 52, height: 52, borderRadius: 26 }}
                        />
                    </View>
                )}
                {title && (
                    <Text
                        style={[
                            { color: theme.textPrimary },
                            Typography.semiBold17_24,
                            { marginTop: 16, marginBottom: 8, textAlign: 'center' }
                        ]}
                        numberOfLines={2}
                    >
                        {title}
                    </Text>
                )}
                {subtitle && (
                    <Text
                        style={[
                            { color: theme.textPrimary },
                            Typography.regular15_20,
                            { marginBottom: 8, textAlign: 'center' }
                        ]}
                    >
                        {subtitle}
                    </Text>
                )}
                {message && (
                    <Text
                        style={[
                            { color: theme.textSecondary },
                            Typography.regular15_20,
                            { marginBottom: 8, textAlign: 'center' }
                        ]}
                    >
                        {message}
                    </Text>
                )}
                {content}
                <View style={{
                    flexDirection: 'row', gap: 16,
                    justifyContent: 'center', alignItems: 'center',
                }}>
                    {buttons?.map((button, index) => (
                        <RoundButton
                            key={index}
                            title={button.text}
                            style={{ flex: 1 }}
                            display={button.display}
                            onPress={() => {
                                button.onPress();
                                setAlertState({ ...alertState, isOpen: false });
                            }}
                        />
                    ))}
                </View>
            </View>
        </Modal>
    );
}));