import React from "react";
import { Platform, View, Text, Pressable } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { HeaderBackButton } from "@react-navigation/elements";
import { t } from "../../../i18n/t";
import { useAppConfig } from "../../../utils/AppConfigContext";

export const IOSToolbar = React.memo(({ pageTitle, canGoBack, onBack }: { pageTitle?: string, canGoBack: boolean, onBack: () => void }) => {
    const { Theme } = useAppConfig();

    if (Platform.OS !== 'ios') {
        return null;
    }

    return (
        <View style={{
            width: '100%',
            flexDirection: 'row',
            paddingHorizontal: 15,
            marginVertical: 14,
            height: 42,
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            {canGoBack && (
                <Animated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, justifyContent: 'center' }}
                >
                    <HeaderBackButton
                        label={t('common.back')}
                        labelVisible
                        onPress={onBack}
                        tintColor={Theme.accent}
                    />
                </Animated.View>
            )}
            {!canGoBack && (
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: 0, bottom: 0, left: 15, justifyContent: 'center'
                    }}
                    entering={FadeIn}
                    exiting={FadeOut}
                >
                    <Pressable
                        style={({ pressed }) => {
                            return ({
                                opacity: pressed ? 0.3 : 1,
                            });
                        }}
                        onPress={onBack}
                    >
                        <Text style={{
                            fontWeight: '400',
                            fontSize: 17,
                            textAlign: 'center',
                        }}>
                            {t('common.close')}
                        </Text>
                    </Pressable>
                </Animated.View>
            )}
            <Text style={{
                fontWeight: '600',
                fontSize: 17,
                textAlign: 'center',
            }}>
                {pageTitle}
            </Text>
        </View>
    )
})