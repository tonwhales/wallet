import { memo, useState } from "react";
import { AIChatMessage } from "../../engine/hooks/useAIChatSocket";
import Animated, { FadeInUp, FadeOutDown, LinearTransition } from "react-native-reanimated";
import { View, Text, Pressable } from "react-native";
import { Typography } from "../styles";
import { copyText } from "../../utils/copyText";
import { useToaster } from "../toast/ToastProvider";
import { ToastDuration } from "../toast/ToastProvider";
import { t } from "../../i18n/t";
import CopyIcon from '@assets/ic-copy.svg';
import { useTheme } from "../../engine/hooks";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const AIChatMessageBubble = memo(({ message, isTab }: { message: AIChatMessage, isTab?: boolean }) => {
    const theme = useTheme();
    const isBot = message.isBot;
    const [isCopied, setIsCopied] = useState(false);
    const toaster = useToaster();
    const safeArea = useSafeAreaInsets();

    const handleCopy = () => {
        copyText(message.text);
        setIsCopied(true);

        toaster.show({
            message: t('common.copied'),
            type: 'default',
            duration: ToastDuration.SHORT,
            ...(isTab ? { marginBottom: 56 + safeArea.bottom } : {})
        });

        // Сброс состояния через 2 секунды
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
            layout={LinearTransition}
            style={{
                alignSelf: isBot ? 'flex-start' : 'flex-end',
                maxWidth: '80%',
                marginVertical: 4,
                marginHorizontal: 16,
            }}
        >
            <View
                style={{
                    backgroundColor: isBot ? theme.surfaceOnElevation : theme.accent,
                    borderRadius: 16,
                    borderBottomLeftRadius: isBot ? 4 : 16,
                    borderBottomRightRadius: isBot ? 16 : 4,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    minHeight: 36,
                    justifyContent: 'center',
                }}
            >
                <Text
                    style={[
                        Typography.regular15_20,
                        {
                            color: isBot ? theme.textPrimary : theme.white,
                        }
                    ]}
                >
                    {message.text}
                </Text>
            </View>
            {isBot && (
                <Pressable
                    onPress={handleCopy}
                    hitSlop={16}
                    style={({ pressed }) => ({
                        height: 24,
                        width: 24,
                        marginLeft: 8,
                        padding: 6,
                        borderRadius: 16,
                        backgroundColor: pressed ? theme.surfaceOnElevation : 'transparent',
                        opacity: pressed ? 0.7 : 1,
                    })}
                >
                    <CopyIcon
                        height={16}
                        width={16}
                        color={isCopied ? theme.accent : theme.textPrimary}
                    />
                </Pressable>
            )}
            <Text
                style={[
                    Typography.regular13_18,
                    {
                        color: theme.textSecondary,
                        textAlign: isBot ? 'left' : 'right',
                        marginTop: 2,
                        marginHorizontal: 4,
                    }
                ]}
            >
                {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </Text>
        </Animated.View>
    );
});