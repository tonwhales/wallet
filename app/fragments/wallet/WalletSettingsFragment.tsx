import { Pressable, View, Text, Platform, ScrollView } from "react-native";
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
import { copyText } from "../../utils/copyText";
import { StatusBar } from "expo-status-bar";
import { ToastDuration, useToaster } from "../../components/toast/ToastProvider";
import { ATextInput } from "../../components/ATextInput";

export const WalletSettingsFragment = fragment(() => {
    const { Theme, AppConfig } = useAppConfig();
    const toaster = useToaster();
    const engine = useEngine();
    const appState = getAppState();
    const navigation = useTypedNavigation();
    const address = getCurrentAddress().address;
    const walletSettings = engine.products.wallets.useWalletSettings(address);
    const initHash = (walletSettings?.avatar !== null && walletSettings?.avatar !== undefined)
        ? walletSettings.avatar
        : avatarHash(address.toFriendly({ testOnly: engine.isTestnet }), avatarImages.length);

    const [name, setName] = useState(walletSettings?.name ?? `${t('common.wallet')} ${appState.selected + 1}`);
    const [nameFocused, setNameFocused] = useState(false);
    const [avatar, setAvatar] = useState(initHash);

    const hasChanges = useMemo(() => {
        return name !== walletSettings?.name || avatar !== initHash;
    }, [name, avatar, walletSettings]);

    const onSave = useCallback(() => {
        if (name !== walletSettings?.name || avatar !== initHash) {
            engine.products.wallets.setWalletSettings(address, { name, avatar });
        }
        navigation.goBack();
    }, [name, avatar, walletSettings]);

    const onChangeAvatar = useCallback(() => {
        const callback = (hash: number) => setAvatar(hash);
        navigation.navigate('AvatarPicker', { callback, hash: avatar });
    }, []);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <ScreenHeader
                onBackPressed={() => navigation.goBack()}
                title={walletSettings?.name ?? `${t('common.wallet')} ${appState.selected + 1}`}
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
                            color: hasChanges ? Theme.accent : Theme.textSecondary,
                            fontSize: 17, lineHeight: 24,
                            fontWeight: '500',
                            marginRight: 16,
                        }}>
                            {t('contacts.save')}
                        </Text>
                    </Pressable>
                }
            />
            <ScrollView
                contentInsetAdjustmentBehavior={'never'}
                keyboardShouldPersistTaps={'always'}
                keyboardDismissMode={'none'}
            >
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
                            borderColor={Theme.border}
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
                        flex: 1,
                        backgroundColor: Theme.border,
                        marginTop: 20,
                        paddingVertical: 20,
                        width: '100%', borderRadius: 20,
                    }}>
                        <ATextInput
                            label={t('common.walletName')}
                            blurOnSubmit={true}
                            editable={true}
                            value={name}
                            style={{ paddingHorizontal: 16 }}
                            onValueChange={setName}
                            onFocus={() => setNameFocused(true)}
                            onBlur={() => setNameFocused(false)}
                        />
                    </View>
                    <View style={{
                        backgroundColor: Theme.border,
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        marginTop: 20,
                        width: '100%', borderRadius: 20
                    }}>
                        <Text style={{ color: Theme.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: '500' }}>
                            {t('common.walletAddress')}
                        </Text>
                        <Text
                            onPress={() => {
                                copyText(address.toFriendly({ testOnly: AppConfig.isTestnet }));
                                toaster.show(
                                    {
                                        message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
                                        type: 'default',
                                        duration: ToastDuration.SHORT
                                    }
                                );
                            }}
                            style={{ color: Theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '400' }}
                        >
                            {address.toFriendly({ testOnly: AppConfig.isTestnet })}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    )
});