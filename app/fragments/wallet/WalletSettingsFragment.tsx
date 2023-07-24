import { Pressable, View, Text, Platform, TextInput } from "react-native";
import { fragment } from "../../fragment";
import { ScreenHeader } from "../../components/ScreenHeader";
import { getAppState, getCurrentAddress } from "../../storage/appState";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useAppConfig } from "../../utils/AppConfigContext";
import { avatarHash } from "../../utils/avatarHash";
import { Avatar, avatarImages } from "../../components/Avatar";
import { useCallback, useMemo, useState } from "react";
import { useEngine } from "../../engine/Engine";

export const WalletSettingsFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const engine = useEngine();
    const appState = getAppState();
    const navigation = useTypedNavigation();
    const address = getCurrentAddress().address;
    const walletSettings = engine.products.wallets.useWalletSettings(address);
    const initHash = (walletSettings?.avatar !== null && walletSettings?.avatar !== undefined)
        ? walletSettings.avatar
        : avatarHash(address.toFriendly({ testOnly: engine.isTestnet }), avatarImages.length);

    const [name, setName] = useState(walletSettings?.name ?? `${t('common.wallet')} ${appState.selected + 1}`);
    const [avatar, setAvatar] = useState(initHash);

    const hasChanges = useMemo(() => {
        return name !== walletSettings?.name || avatar !== initHash;
    }, [name, avatar, walletSettings]);

    const onSave = useCallback(() => {
        if (name !== walletSettings?.name || avatar !== initHash) {
            engine.products.wallets.setWalletSettings(address, { name, avatar });
        }
    }, [name, avatar, walletSettings]);

    const onChangeAvatar = useCallback(() => {
        const callback = (hash: number) => setAvatar(hash);
        navigation.navigate('ChooseAvatar', { callback, hash: avatar });
    }, []);

    return (
        <View style={{ flexGrow: 1 }}>
            <ScreenHeader
                onBackPressed={() => navigation.goBack()}
                title={name}
                rightButton={
                    <Pressable
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.5 : 1,
                            }
                        }}
                        onPress={onSave}
                        hitSlop={
                            Platform.select({
                                ios: undefined,
                                default: { top: 16, right: 16, bottom: 16, left: 16 },
                            })
                        }
                    >
                        <Text style={{
                            color: hasChanges ? Theme.accent : Theme.darkGrey,
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
                <Pressable
                    style={({ pressed }) => {
                        return {
                            opacity: pressed ? 0.5 : 1,
                            justifyContent: 'center', alignItems: 'center'
                        }
                    }}
                    onPress={onChangeAvatar}
                >
                    <Avatar
                        size={100}
                        backgroundColor={Theme.accent}
                        id={''}
                        hash={avatar}
                    />
                    <Text style={{
                        color: Theme.accent,
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '500',
                        marginTop: 12,
                    }}>
                        {t('wallets.settings.changeAvatar')}
                    </Text>
                </Pressable>
                <View style={{
                    backgroundColor: Theme.lightGrey,
                    paddingHorizontal: 20, marginTop: 20,
                    paddingVertical: 10,
                    width: '100%', borderRadius: 20
                }}>
                    <View style={{
                        width: '100%',
                        overflow: 'hidden',
                        position: 'relative',
                        marginBottom: 2
                    }}>
                        <Text style={{ color: Theme.darkGrey, fontSize: 13, lineHeight: 18, fontWeight: '400' }}>
                            {t('common.walletName')}
                        </Text>
                    </View>
                    <TextInput
                        style={[
                            {
                                paddingHorizontal: 0,
                                textAlignVertical: 'top',
                                fontSize: 17, lineHeight: 24,
                                fontWeight: '400', color: Theme.textColor
                            }
                        ]}
                        maxLength={64}
                        placeholder={t('common.walletName')}
                        placeholderTextColor={Theme.placeholder}
                        multiline={true}
                        blurOnSubmit={true}
                        editable={true}
                        value={name}
                        onChangeText={setName}
                    />
                </View>
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
                <View style={{ flexGrow: 1, backgroundColor: 'red' }} />
            </View>
        </View>
    )
});