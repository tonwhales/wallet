import { Pressable, View, Text, Platform } from "react-native";
import { fragment } from "../../fragment";
import { ScreenHeader } from "../../components/ScreenHeader";
import { getAppState, getCurrentAddress } from "../../storage/appState";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useAppConfig } from "../../utils/AppConfigContext";
import { Avatar } from "../../components/Avatar";
import { ATextInput } from "../../components/ATextInput";
import { useState } from "react";

export const WalletSettingsFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const appState = getAppState();
    const navigation = useTypedNavigation();
    const address = getCurrentAddress().address;
    const [name, setName] = useState(`${t('common.wallet')} ${appState.selected + 1}`);

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
                paddingHorizontal: 16, flexGrow: 1
            }}>
                <Avatar
                    size={100}
                    backgroundColor={Theme.accent}
                    id={address.toFriendly({ testOnly: AppConfig.isTestnet })}
                />
                <Pressable style={({ pressed }) => {
                    return {
                        opacity: pressed ? 0.5 : 1,
                    }
                }}>
                    <Text style={{
                        color: Theme.accent,
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '500',
                        marginTop: 12,
                    }}>
                        {t('wallet.changeAvatar')}
                    </Text>
                </Pressable>
                <ATextInput
                    value={name}
                    onValueChange={setName}
                    placeholder={t('common.walletName')}
                    keyboardType={'default'}
                    autoCapitalize={'sentences'}
                    multiline={false}
                    style={{
                        flex: 1, flexShrink: 1,
                        backgroundColor: Theme.lightGrey,
                        paddingHorizontal: 16, marginTop: 20,
                        paddingVertical: 10
                    }}
                    
                    inputStyle={{
                        marginHorizontal: 0, marginVertical: 0,
                        paddingBottom: 0, paddingTop: 0,
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '400', color: Theme.textColor,
                        height: 24
                    }}
                    label={
                        <Text style={{ color: Theme.darkGrey, fontSize: 13, lineHeight: 18, fontWeight: '400' }}>
                            {t('common.walletName')}
                        </Text>
                    }
                    preventDefaultHeight
                />
                <View style={{
                    backgroundColor: Theme.lightGrey,
                    padding: 20, marginTop: 20,
                    width: '100%', borderRadius: 20
                }}>
                    <Text style={{ color: Theme.textColor, fontSize: 17, lineHeight: 24, fontWeight: '500' }}>
                        {t('common.walletAddress')}
                    </Text>
                    <Text
                        style={{ color: Theme.darkGrey, fontSize: 17, lineHeight: 24, fontWeight: '400' }}
                    >
                        {address.toFriendly({ testOnly: AppConfig.isTestnet })}
                    </Text>
                </View>
                <View style={{ flexGrow: 1 }} />
            </View>
        </View>
    )
});