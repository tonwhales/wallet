import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { useCurrentAddress, useTheme } from "../../engine/hooks";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Platform, Pressable, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "../../components/ScreenHeader";
import { t } from "../../i18n/t";
import { useHoldersProfile } from "../../engine/hooks/holders/useHoldersProfile";
import { AIChatComponent, AIChatComponentRef, AIChatInitMessage } from "../../components/ai/AIChatComponent";
import { Text } from "react-native";
import { Typography } from "../../components/styles";
import { useParams } from "../../utils/useParams";
import { useRef } from "react";
import { Image } from 'expo-image';
import { PerfText } from "../../components/basic/PerfText";
import { CloseButton } from "../../components/navigation/CloseButton";

export const HoldersAIChatFragment = fragment(() => {
    const theme = useTheme();
    const { userId, initMessage } = useParams<{ userId?: string | null, initMessage?: AIChatInitMessage }>();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { tonAddressString } = useCurrentAddress();
    const profile = useHoldersProfile(tonAddressString);
    const chatRef = useRef<AIChatComponentRef>(null);

    return (
        <View style={{
            flexGrow: 1,
            paddingBottom: safeArea.bottom
        }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                titleComponent={
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Pressable
                            onPress={() => chatRef.current?.clearHistory()}
                            style={({ pressed }) => ({
                                opacity: pressed ? 0.5 : 1,
                                marginRight: 16,
                                backgroundColor: theme.surfaceOnElevation,
                                borderRadius: 32,
                                height: 32, width: 32,
                                justifyContent: 'center', alignItems: 'center',
                            })}
                        >
                            <Image
                                source={require('@assets/ic-reload.png')}
                                style={{
                                    width: 24,
                                    height: 24,
                                }}
                                tintColor={theme.iconNav}
                            />
                        </Pressable>
                        <View style={{ flexGrow: 1 }} />
                        <View style={{ maxWidth: '60%', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <PerfText style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                                ellipsizeMode={'tail'}
                                numberOfLines={1}
                            >
                                {t('aiChat.title')}
                            </PerfText>
                            <View style={{
                                backgroundColor: theme.surfaceOnElevation,
                                borderRadius: 16,
                                paddingHorizontal: 8, paddingVertical: 2
                            }}>
                                <PerfText style={[
                                    { color: theme.accent },
                                    Typography.semiBold15_20
                                ]}>
                                    {'Beta'}
                                </PerfText>
                            </View>
                        </View>
                        <View style={{ flexGrow: 1 }} />
                        <CloseButton
                            onPress={navigation.goBack}
                        />
                    </View>
                }
                style={[
                    { paddingHorizontal: 16 },
                    Platform.select({ android: { marginTop: safeArea.top } })
                ]}
            />
            <View style={{ flexGrow: 1, marginTop: 16 }}>
                {profile.data?.userId ? (
                    <AIChatComponent
                        ref={chatRef}
                        userId={userId || profile.data.userId}
                        autoConnect={true}
                        persistHistory={false}
                        showConnectionStatus={true}
                        onError={(error) => {
                            console.warn('AI Chat Error:', error);
                        }}
                        initMessage={initMessage}
                    />
                ) : (
                    <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 32
                    }}>
                        <Text style={[
                            Typography.medium15_20,
                            {
                                color: theme.textSecondary,
                                textAlign: 'center'
                            }
                        ]}>
                            {profile.isLoading ? t('aiChat.loadingProfile') : t('aiChat.profileNotAvailable')}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
});