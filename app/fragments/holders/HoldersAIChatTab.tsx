import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { useCurrentAddress, useTheme } from "../../engine/hooks";
import { Platform, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "../../components/ScreenHeader";
import { t } from "../../i18n/t";
import { useHoldersProfile } from "../../engine/hooks/holders/useHoldersProfile";
import { AIChatComponent } from "../../components/ai/AIChatComponent";
import { Text } from "react-native";
import { Typography } from "../../components/styles";
import { useParams } from "../../utils/useParams";
import { useRoute } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

export const HoldersAIChatTab = fragment(() => {
    const theme = useTheme();
    const { userId } = useParams<{ userId?: string | null }>();
    const routeName = useRoute().name;
    const isTab = routeName === 'AIChatTab';
    const safeArea = useSafeAreaInsets();
    const bottomBarHeight = useBottomTabBarHeight();
    const { tonAddressString } = useCurrentAddress();
    const profile = useHoldersProfile(tonAddressString);

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
                title={t('aiChat.title')}
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