import { Pressable, View, Text, Platform, ScrollView } from "react-native";
import { fragment } from "../../fragment";
import { ScreenHeader } from "../../components/ScreenHeader";
import { getAppState } from "../../storage/appState";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { avatarHash } from "../../utils/avatarHash";
import { Avatar, avatarColors, avatarImages } from "../../components/Avatar";
import { useCallback, useMemo, useState } from "react";
import { copyText } from "../../utils/copyText";
import { ToastDuration, useToaster } from "../../components/toast/ToastProvider";
import { ATextInput } from "../../components/ATextInput";
import { useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { useWalletSettings } from "../../engine/hooks/appstate/useWalletSettings";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const WalletSettingsFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const toaster = useToaster();
    const appState = getAppState();
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const address = selected!.address;
    const safeArea = useSafeAreaInsets();

    const [walletSettings, setSettings] = useWalletSettings(address);

    const initHash = (walletSettings?.avatar !== null && walletSettings?.avatar !== undefined)
        ? walletSettings.avatar
        : avatarHash(address.toString({ testOnly: isTestnet }), avatarImages.length);
    const initColor = avatarHash(address.toString({ testOnly: isTestnet }), avatarColors.length);

    const [name, setName] = useState(walletSettings?.name ?? `${t('common.wallet')} ${appState.selected + 1}`);
    const [nameFocused, setNameFocused] = useState(false);
    const [avatar, setAvatar] = useState(initHash);
    const [selectedColor, setColor] = useState(initColor);

    const hasChanges = useMemo(() => {
        return name !== walletSettings?.name || avatar !== initHash;
    }, [name, avatar, walletSettings]);

    const onSave = useCallback(() => {
        if (name !== walletSettings?.name || avatar !== initHash) {
            setSettings({ name, avatar, color: selectedColor });
        }
        navigation.goBack();
    }, [name, avatar, walletSettings, setSettings]);

    const onChangeAvatar = useCallback(() => {
        const callback = (hash: number, color: number) => {
            setAvatar(hash);
            setColor(color);
        };
        navigation.navigate('AvatarPicker', { callback, hash: avatar, initColor });
    }, []);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                onBackPressed={() => navigation.goBack()}
                style={[
                    { paddingHorizontal: 16 },
                    Platform.select({ android: { paddingTop: safeArea.top } }),
                ]}
                title={walletSettings?.name ?? `${t('common.wallet')} ${appState.selected + 1}`}
                rightButton={
                    <Pressable
                        style={({ pressed }) => {
                            return {
                                opacity: pressed ? 0.5 : 1,
                                backgroundColor: theme.surfaceOnElevation,
                                borderRadius: 100,
                                justifyContent: 'center', alignItems: 'center',
                                paddingVertical: 4, paddingHorizontal: 12,
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
                            color: hasChanges ? theme.textPrimary : theme.textSecondary,
                            fontSize: 17, lineHeight: 24,
                            fontWeight: '500',
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
                            borderColor={theme.surfaceOnElevation}
                            hash={avatar}
                            theme={theme}
                            isTestnet={isTestnet}
                            id={address.toString({ testOnly: isTestnet })}
                            // hashColor
                            backgroundColor={avatarColors[selectedColor]}
                        />
                        <Text style={{
                            color: theme.accent,
                            fontSize: 17, lineHeight: 24,
                            fontWeight: '500',
                            marginTop: 12,
                        }}>
                            {t('wallets.settings.changeAvatar')}
                        </Text>
                    </Pressable>
                    <View style={{
                        flex: 1,
                        backgroundColor: theme.surfaceOnElevation,
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
                        backgroundColor: theme.surfaceOnElevation,
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        marginTop: 20,
                        width: '100%', borderRadius: 20
                    }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: '500' }}>
                            {t('common.walletAddress')}
                        </Text>
                        <Text
                            onPress={() => {
                                copyText(address.toString({ testOnly: isTestnet }));
                                toaster.show(
                                    {
                                        message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
                                        type: 'default',
                                        duration: ToastDuration.SHORT
                                    }
                                );
                            }}
                            style={{ color: theme.textPrimary, fontSize: 17, lineHeight: 24, fontWeight: '400' }}
                        >
                            {address.toString({ testOnly: isTestnet })}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    )
});