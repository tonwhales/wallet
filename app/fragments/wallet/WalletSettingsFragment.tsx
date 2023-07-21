import { Pressable, View, Text, Platform } from "react-native";
import { fragment } from "../../fragment";
import { ScreenHeader } from "../../components/ScreenHeader";
import { getAppState, getCurrentAddress } from "../../storage/appState";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useAppConfig } from "../../utils/AppConfigContext";
import { Avatar } from "../../components/Avatar";

export const WalletSettingsFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const appState = getAppState();
    const navigation = useTypedNavigation();
    const address = getCurrentAddress().address;

    return (
        <View style={{ flexGrow: 1 }}>
            <ScreenHeader
                onBackPressed={() => navigation.goBack()}
                title={`${t('common.wallet')} ${appState.selected + 1}`}
                rightButton={
                    <Pressable
                        hitSlop={Platform.select({
                            ios: undefined,
                            default: { top: 16, right: 16, bottom: 16, left: 16 },
                        })}
                    >
                        <Text style={{
                            color: Theme.accent,
                            fontSize: 17, lineHeight: 24,
                            fontWeight: '500',
                            marginRight: 16,
                        }}>
                            {t('contacts.save')}
                        </Text>
                    </Pressable>
                }
            />
            <View style={{
                marginTop: 16,
                alignItems: 'center',
            }}>
                <Avatar
                    size={100}
                    id={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                />
                <Pressable>
                    <Text style={{
                        color: Theme.accent,
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '500',
                        marginTop: 12,
                    }}>
                        {t('wallet.changeAvatar')}
                    </Text>
                </Pressable>
                
            </View>
        </View>
    )
});