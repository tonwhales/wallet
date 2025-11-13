import { memo, useState, useMemo } from "react";
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
import { parseAIMarkupWithOrder, extractPlainText, parseTextFormatting } from "../../engine/ai/parseMarkup";
import { MessageSticker, MessageButton, MessageNav, MessageTx, MessageChips } from "./markup";
import { AIMarkupComponent } from "../../engine/ai/markup-types";

export const AIChatMessageBubble = memo(({ message, isTab, onChipPress }: {
    message: AIChatMessage,
    isTab?: boolean,
    onChipPress?: (value: string, title: string) => void;
}) => {
    const theme = useTheme();
    const isBot = message.isBot;
    const [isCopied, setIsCopied] = useState(false);
    const toaster = useToaster();
    const safeArea = useSafeAreaInsets();

    const parsedMessage = useMemo(() => {
        if (!isBot) {
            return {
                content: [{ type: 'text' as const, content: message.text }],
                inlineComponents: [],
                trailingComponents: [],
                hasMarkup: false
            };
        }
        return parseAIMarkupWithOrder(message.text);
    }, [message.text, isBot]);

    const handleCopy = () => {
        const plainText = extractPlainText(message.text);
        copyText(plainText);
        setIsCopied(true);

        toaster.show({
            message: t('common.copied'),
            type: 'default',
            duration: ToastDuration.SHORT,
            ...(isTab ? { marginBottom: 56 + safeArea.bottom } : {})
        });

        setTimeout(() => setIsCopied(false), 2000);
    };

    const renderComponent = (component: AIMarkupComponent, index: number) => {
        switch (component.type) {
            case 'sticker':
                return <MessageSticker key={`comp-${index}`} element={component} />;
            case 'button':
                return <MessageButton key={`comp-${index}`} element={component} />;
            case 'nav':
                return <MessageNav key={`comp-${index}`} element={component} />;
            case 'tx':
                return <MessageTx key={`comp-${index}`} element={component} />;
            case 'chips':
                return <MessageChips key={`comp-${index}`} element={component} onChipPress={onChipPress} />;
            default:
                return null;
        }
    };

    const renderFormattedText = (text: string, baseStyle: any) => {
        const segments = parseTextFormatting(text);
        const baseColor = isBot ? theme.textPrimary : theme.white;
        
        return (
            <Text style={baseStyle}>
                {segments.map((segment, index) => {
                    let segmentStyle: any = {};
                    
                    if (segment.heading) {
                        switch (segment.heading) {
                            case 1:
                                segmentStyle = [
                                    Typography.semiBold20_28,
                                    { color: baseColor }
                                ];
                                break;
                            case 2:
                                segmentStyle = [
                                    Typography.semiBold17_24,
                                    { color: baseColor }
                                ];
                                break;
                            case 3:
                                segmentStyle = [
                                    Typography.semiBold15_20,
                                    { color: baseColor }
                                ];
                                break;
                        }
                        
                        return (
                            <Text
                                key={`segment-${index}`}
                                style={segmentStyle}
                            >
                                {segment.text}
                            </Text>
                        );
                    } else if (segment.bold) {
                        segmentStyle = Typography.semiBold15_20;
                    }
                    
                    return (
                        <Text
                            key={`segment-${index}`}
                            style={segmentStyle}
                        >
                            {segment.text}
                        </Text>
                    );
                })}
            </Text>
        );
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
                }}
            >
                {parsedMessage.content.map((element, index) => {
                    if (element.type === 'text') {
                        return (
                            <View key={`text-${index}`}>
                                {renderFormattedText(
                                    element.content,
                                    [
                                        Typography.regular15_20,
                                        {
                                            color: isBot ? theme.textPrimary : theme.white,
                                            marginBottom: index < parsedMessage.content.length - 1 ? 8 : 0,
                                        }
                                    ]
                                )}
                            </View>
                        );
                    } else {
                        return (
                            <View key={`inline-${index}`} style={{ marginVertical: 4 }}>
                                {renderComponent(element.component, index)}
                            </View>
                        );
                    }
                })}
            </View>

            {parsedMessage.trailingComponents.length > 0 && (
                <View style={{ marginTop: 8 }}>
                    {parsedMessage.trailingComponents.map((component, index) =>
                        renderComponent(component, index)
                    )}
                </View>
            )}

            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: isBot ? 'flex-start' : 'flex-end',
                marginTop: 2,
                marginHorizontal: 4,
            }}>
                {isBot && (
                    <Pressable
                        onPress={handleCopy}
                        hitSlop={16}
                        style={({ pressed }) => ({
                            height: 24,
                            width: 24,
                            marginRight: 8,
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
                        }
                    ]}
                >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </Text>
            </View>
        </Animated.View>
    );
});