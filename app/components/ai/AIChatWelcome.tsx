import { memo } from "react";
import Animated, { FadeInUp, FadeOutDown, LinearTransition } from "react-native-reanimated";
import { View, Text } from "react-native";
import { Typography } from "../styles";
import { useTheme } from "../../engine/hooks";
import { LottieAnimView } from "../LottieAnimView";
import { t } from "../../i18n/t";

export const AIChatWelcome = memo(() => {
    const theme = useTheme();

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
            layout={LinearTransition}
            style={{
                alignSelf: 'flex-start',
                maxWidth: '80%',
                marginVertical: 4,
                marginHorizontal: 16,
            }}
        >
            <View
                style={{
                    backgroundColor: theme.surfaceOnElevation,
                    borderRadius: 16,
                    borderBottomLeftRadius: 4,
                    borderBottomRightRadius: 16,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    minHeight: 36,
                    justifyContent: 'center',
                }}
            >
                <LottieAnimView
                    source={require('@assets/animations/whales_hello.json')}
                    autoPlay={true}
                    loop={true}
                    style={{ width: 140, height: 140 }}
                    autoPlayIos={true}
                />
                <Text
                    style={[
                        Typography.medium15_20,
                        {
                            color: theme.textPrimary,
                        }
                    ]}
                >
                    {t('aiChat.welcomeTitle')}
                </Text>
                <Text
                    style={[
                        Typography.regular15_20,
                        {
                            color: theme.textPrimary,
                        }
                    ]}
                >
                    {t('aiChat.welcomeSubtitle')}
                </Text>
            </View>
            <Text
                style={[
                    Typography.regular13_18,
                    {
                        color: theme.textSecondary,
                        textAlign: 'left',
                        marginTop: 2,
                        marginHorizontal: 4,
                    }
                ]}
            >
                {new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </Text>
        </Animated.View>
    );
});