import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { useCurrentAddress, useTheme } from "../../engine/hooks";
import { Platform, Pressable, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "../../components/ScreenHeader";
import { t } from "../../i18n/t";
import { useHoldersProfile } from "../../engine/hooks/holders/useHoldersProfile";
import { AIChatComponent, AIChatComponentRef } from "../../components/ai/AIChatComponent";
import { Text } from "react-native";
import { Typography } from "../../components/styles";
import { useParams } from "../../utils/useParams";
import { useRoute } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { PerfText } from "../../components/basic/PerfText";
import { useRef } from "react";
import { Image } from 'expo-image';

export const HoldersAIChatTab = fragment(() => {
    const theme = useTheme();
    const { userId } = useParams<{ userId?: string | null }>();
    const routeName = useRoute().name;
    const isTab = routeName === 'AIChatTab';
    const safeArea = useSafeAreaInsets();
    const bottomBarHeight = useBottomTabBarHeight();
    const { tonAddressString } = useCurrentAddress();
    const profile = useHoldersProfile(tonAddressString);
    const chatRef = useRef<AIChatComponentRef>(null);

    return (
        <View style={[{
            flexGrow: 1,
            paddingTop: isTab ? safeArea.bottom : 0,
            paddingBottom: isTab ? bottomBarHeight : safeArea.bottom
        }, Platform.select({
            android: {
                paddingTop: 0,
                paddingBottom: isTab ? 0 : safeArea.bottom
            }
        })]}>
            <StatusBar style={theme.style === 'dark' ? 'light' : 'dark'} />
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
                        <PerfText style={[{ color: theme.textPrimary, maxWidth: '60%' }, Typography.semiBold17_24]}
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                        >
                            {t('aiChat.title')}
                        </PerfText>
                        <View style={{ flexGrow: 1 }} />
                        <View
                            style={{
                                marginRight: 16,
                                height: 32, width: 32,
                            }}
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
                        isTab={true}
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