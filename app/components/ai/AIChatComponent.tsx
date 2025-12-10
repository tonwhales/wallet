import React, { memo, useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../engine/hooks';
import { Typography } from '../styles';
import { useAIChatSocket, UseAIChatSocketOptions } from '../../engine/hooks/useAIChatSocket';
import { t } from '../../i18n/t';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AIChatMessageBubble } from './AIChatMessageBubble';
import { AIChatWelcome } from './AIChatWelcome';
import { PulsingDot } from './PulsingDot';

export type AIChatInitMessage = {
    type: 'message';
    message: string;
} | {
    type: 'tx';
    tx: string;
}
export interface AIChatComponentProps extends UseAIChatSocketOptions {
    style?: any;
    placeholder?: string;
    maxHeight?: number;
    showConnectionStatus?: boolean;
    onError?: (error: string) => void;
    isTab?: boolean;
    initMessage?: AIChatInitMessage;
}
export interface AIChatComponentRef {
    clearHistory: () => void;
    reconnect: () => void;
}

const ConnectionStatus = memo(({ isConnected, isConnecting, theme }: {
    isConnected: boolean;
    isConnecting: boolean;
    theme: any;
}) => {
    if (isConnected) return null;

    return (
        <Animated.View
            entering={FadeIn}
            style={{
                backgroundColor: isConnecting ? theme.border : theme.accentRed,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                margin: 16,
                alignItems: 'center',
            }}
        >
            <Text
                style={[
                    Typography.medium13_18,
                    {
                        color: theme.white,
                        textAlign: 'center',
                    }
                ]}
            >
                {isConnecting ? t('aiChat.connecting') : t('aiChat.noConnection')}
            </Text>
        </Animated.View>
    );
});

export const AIChatComponent = memo(forwardRef<AIChatComponentRef, AIChatComponentProps>((props, ref) => {
    const theme = useTheme();
    const scrollViewRef = useRef<ScrollView>(null);
    const textInputRef = useRef<TextInput>(null);
    const initMessageSent = useRef(false);
    const safeArea = useSafeAreaInsets();
    const [inputText, setInputText] = useState('');
    const [inputHeight, setInputHeight] = useState(36);
    const [isUserScrolling, setIsUserScrolling] = useState(false);
    const [contentHeight, setContentHeight] = useState(0);
    const [scrollViewHeight, setScrollViewHeight] = useState(0);

    const {
        isConnected,
        isConnecting,
        sessionId,
        messages,
        isStreaming,
        streamingMessageId,
        error,
        sendMessage,
        clearHistory,
        connect,
        hasPendingRequest,
    } = useAIChatSocket({
        userId: props.userId,
        autoConnect: props.autoConnect,
        persistHistory: props.persistHistory,
    });

    useEffect(() => {
        if (props.initMessage && !initMessageSent.current && isConnected && sessionId) {
            if (props.initMessage.type === 'message') {
                sendMessage(props.initMessage.message);
            } else if (props.initMessage.type === 'tx') {
                sendMessage(t('aiChat.initMessage.holdersTx', { tx: props.initMessage.tx }));
            }
            initMessageSent.current = true;
        }
    }, [props.initMessage, isConnected, sessionId]);

    useEffect(() => {
        if (error && props.onError) {
            props.onError(error);
        }
    }, [error, props.onError]);

    // Check if user is near bottom of scroll
    const isNearBottom = useCallback(() => {
        if (contentHeight === 0 || scrollViewHeight === 0) return true;
        const threshold = 100; // pixels from bottom
        return (contentHeight - scrollViewHeight) <= threshold;
    }, [contentHeight, scrollViewHeight]);

    // Handle scroll events
    const handleScroll = useCallback((event: any) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

        setContentHeight(contentSize.height);
        setScrollViewHeight(layoutMeasurement.height);

        // Check if user is scrolling up (away from bottom)
        const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
        const isAtBottom = distanceFromBottom < 50; // 50px threshold

        setIsUserScrolling(!isAtBottom);
    }, []);

    // Reset user scrolling state when they reach bottom
    const handleScrollEndDrag = useCallback(() => {
        if (isNearBottom()) {
            setIsUserScrolling(false);
        }
    }, [isNearBottom]);

    // auto-scroll to bottom on new message (only if user is not scrolling)
    useEffect(() => {
        if (messages.length > 0 && !isUserScrolling) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages.length, isUserScrolling]);

    // auto-scroll during streaming (only if user is not scrolling)
    useEffect(() => {
        if (isStreaming && streamingMessageId && !isUserScrolling) {
            // Find the streaming message and scroll when its content changes
            const streamingMessage = messages.find(msg => msg.id === streamingMessageId);
            if (streamingMessage && streamingMessage.text) {
                // Scroll to bottom for each chunk received
                const scrollTimer = setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: false }); // No animation for smoother streaming
                }, 10);

                return () => clearTimeout(scrollTimer);
            }
        }
    }, [isStreaming, streamingMessageId, messages, isUserScrolling]);

    // auto-scroll when streaming ends (only if user is not scrolling)
    useEffect(() => {
        if (!isStreaming && streamingMessageId === null && !isUserScrolling) {
            // Final scroll when streaming completes
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [isStreaming, streamingMessageId, isUserScrolling]);

    const handleSendMessage = useCallback(() => {
        if (!inputText.trim() || !isConnected || isStreaming) {
            return;
        }

        sendMessage(inputText.trim());
        setInputText('');
        textInputRef.current?.blur();

        // Reset user scrolling state when sending new message
        // This ensures auto-scroll works for the response
        setIsUserScrolling(false);
    }, [inputText, isConnected, isStreaming, sendMessage]);

    const handleChipPress = useCallback((value: string, title: string) => {
        if (!isConnected || isStreaming) {
            return;
        }

        sendMessage(title);

        // Reset user scrolling state
        setIsUserScrolling(false);
    }, [isConnected, isStreaming, sendMessage]);

    const handleClearHistory = useCallback(() => {
        clearHistory();
    }, [clearHistory]);

    const handleReconnect = useCallback(() => {
        connect();
    }, [connect]);

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
        clearHistory: handleClearHistory,
        reconnect: handleReconnect,
    }), [handleClearHistory, handleReconnect]);

    const handleInputFocus = useCallback(() => {
        // Scroll to bottom when input is focused
        // This ensures user sees the input area and latest messages
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
            setIsUserScrolling(false); // Reset scrolling state
        }, 300); // Delay to allow keyboard animation
    }, []);

    const canSend = inputText.trim().length > 0 && isConnected && !isStreaming;
    const maxInputHeight = props.maxHeight ? props.maxHeight * 0.3 : 120;
    const keyboardVerticalOffset = props.isTab
        ? Platform.OS === 'ios' ? safeArea.bottom + 74 : 0
        : Platform.OS === 'ios' ? safeArea.top + 86 : 16;

    const shouldShowPulsingDot = messages.length > 0 && !messages[messages.length - 1].isBot;

    return (
        <KeyboardAvoidingView
            style={[
                {
                    flex: 1,
                    backgroundColor: props.isTab ? theme.backgroundPrimary : theme.elevation,
                },
                props.style
            ]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={keyboardVerticalOffset}
        >
            {props.showConnectionStatus && (
                <ConnectionStatus
                    isConnected={isConnected}
                    isConnecting={isConnecting}
                    theme={theme}
                />
            )}

            <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingVertical: 8,
                    flexGrow: 1,
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onScroll={handleScroll}
                onScrollEndDrag={handleScrollEndDrag}
                scrollEventThrottle={16}
            >
                {isConnected && (
                    <AIChatWelcome />
                )}

                {messages.map((message, index) => (
                    <AIChatMessageBubble
                        key={message.id || `${message.timestamp}-${index}`}
                        message={message}
                        isTab={props.isTab}
                        onChipPress={handleChipPress}
                    />
                ))}

                {shouldShowPulsingDot && (
                    <View
                        style={{
                            alignSelf: 'flex-start',
                            marginVertical: 4,
                            marginHorizontal: 16,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                        }}
                    >
                        <PulsingDot color={theme.accent} size={8} />
                    </View>
                )}

                {hasPendingRequest && (
                    <View
                        style={{
                            alignItems: 'center',
                            paddingVertical: 8,
                        }}
                    >
                        <Text
                            style={[
                                Typography.regular13_18,
                                {
                                    color: theme.textSecondary,
                                    fontStyle: 'italic',
                                }
                            ]}
                        >
                            {t('aiChat.recoveringRequest')}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {isUserScrolling && (isStreaming || messages.length > 0) && (
                <Animated.View
                    entering={FadeIn}
                    style={{
                        position: 'absolute',
                        bottom: 88,
                        right: 16,
                        zIndex: 1000,
                    }}
                >
                    <Pressable
                        onPress={() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                            setIsUserScrolling(false);
                        }}
                        style={({ pressed }) => ({
                            backgroundColor: pressed ? theme.accentDisabled : theme.accent,
                            borderRadius: 20,
                            padding: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                        })}
                    >
                        <View
                            style={{
                                backgroundColor: theme.accent,
                                width: 24, height: 24,
                                borderRadius: 16,
                                alignItems: 'center', justifyContent: 'center'
                            }}>
                            <Image
                                style={[{ width: 16, height: 16 }, { transform: [{ rotate: '180 deg' }] }]}
                                source={require('@assets/ic_send.png')}
                            />
                        </View>
                        {isStreaming && (
                            <ActivityIndicator size="small" color={theme.white} />
                        )}
                    </Pressable>
                </Animated.View>
            )}

            <View
                style={{
                    backgroundColor: props.isTab ? theme.backgroundPrimary : theme.elevation,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                }}
            >
                <View style={{ flexDirection: 'row' }}>
                    <View
                        style={{
                            flexGrow: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: theme.surfaceOnElevation,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: theme.border,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            minHeight: 44,
                        }}
                    >
                        <TextInput
                            ref={textInputRef}
                            style={[
                                Typography.regular15_20,
                                {
                                    flex: 1,
                                    color: theme.textPrimary,
                                    maxHeight: maxInputHeight,
                                    minHeight: 28,
                                    textAlignVertical: 'center',
                                    paddingVertical: 0
                                }
                            ]}
                            placeholder={props.placeholder || t('aiChat.placeholder')}
                            placeholderTextColor={theme.textSecondary}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={1000}
                            selectionColor={theme.accent}
                            cursorColor={theme.textPrimary}
                            editable={isConnected && !isStreaming}
                            onContentSizeChange={(event) => {
                                setInputHeight(Math.min(event.nativeEvent.contentSize.height, maxInputHeight));
                            }}
                            onSubmitEditing={handleSendMessage}
                            onFocus={handleInputFocus}
                            blurOnSubmit={false}
                        />
                    </View>
                    <Pressable
                        onPress={handleSendMessage}
                        disabled={!canSend}
                        style={({ pressed }) => ({
                            marginLeft: 8,
                            padding: 8,
                            borderRadius: 50,
                            marginBottom: 4,
                            backgroundColor: (!canSend || pressed) ? theme.accentDisabled : theme.accent,
                            opacity: canSend ? 1 : 0.5,
                            alignSelf: 'flex-end',
                        })}
                    >
                        <View
                            style={{
                                width: 24, height: 24,
                                borderRadius: 16,
                                alignItems: 'center', justifyContent: 'center'
                            }}>
                            <Image
                                style={[{ width: 20, height: 20 }, { transform: [{ rotate: '90 deg' }] }]}
                                source={require('@assets/ic_send.png')}
                            />
                        </View>
                    </Pressable>
                </View>

                {inputText.length > 800 && (
                    <Text
                        style={[
                            Typography.regular13_18,
                            {
                                color: inputText.length > 1000 ? theme.accentRed : theme.textSecondary,
                                textAlign: 'right',
                                marginTop: 4,
                            }
                        ]}
                    >
                        {t('aiChat.characterCount', { count: inputText.length })}
                    </Text>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}));
