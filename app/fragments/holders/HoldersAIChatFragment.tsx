import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { useCurrentAddress, useTheme } from "../../engine/hooks";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { Platform, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "../../components/ScreenHeader";
import { t } from "../../i18n/t";
import { useHoldersProfile } from "../../engine/hooks/holders/useHoldersProfile";
import { AIChatComponent } from "../../components/ai/AIChatComponent";
import { Text } from "react-native";
import { Typography } from "../../components/styles";
import { useParams } from "../../utils/useParams";

export const HoldersAIChatFragment = fragment(() => {
    const theme = useTheme();
    const { userId } = useParams<{ userId?: string | null }>();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { tonAddressString } = useCurrentAddress();
    const profile = useHoldersProfile(tonAddressString);

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
                title={t('aiChat.title')}
                onBackPressed={navigation.goBack}
                style={[
                    { paddingHorizontal: 16 },
                    Platform.select({ android: { marginTop: safeArea.top } })
                ]}
            />
            <View style={{ flexGrow: 1, marginTop: 16 }}>
                {profile.data?.userId ? (
                    <AIChatComponent
                        userId={userId || profile.data.userId}
                        autoConnect={true}
                        persistHistory={false}
                        showConnectionStatus={true}
                        onError={(error) => {
                            console.warn('AI Chat Error:', error);
                        }}
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