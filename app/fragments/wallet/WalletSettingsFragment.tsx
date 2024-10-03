import { Pressable, View, Text, Platform, ScrollView, KeyboardAvoidingView } from "react-native";
import { fragment } from "../../fragment";
import { ScreenHeader } from "../../components/ScreenHeader";
import { getAppState } from "../../storage/appState";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { avatarHash } from "../../utils/avatarHash";
import { Avatar, avatarColors, avatarImages } from "../../components/avatar/Avatar";
import { createRef, Ref, useCallback, useMemo, useState } from "react";
import { copyText } from "../../utils/copyText";
import { ToastDuration, useToaster } from "../../components/toast/ToastProvider";
import { ATextInput, ATextInputRef } from "../../components/ATextInput";
import { useNetwork, useBounceableWalletFormat, useSelectedAccount, useTheme } from "../../engine/hooks";
import { useWalletSettings } from "../../engine/hooks/appstate/useWalletSettings";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboard } from "@react-native-community/hooks";
import { Typography } from "../../components/styles";
import { RoundButton } from "../../components/RoundButton";
import { KnownWallets } from "../../secure/KnownWallets";
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated";

const PLATFORM_IOS = Platform.OS === 'ios'

export const WalletSettingsFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const knownWallets = KnownWallets(isTestnet);
    const toaster = useToaster();
    const appState = getAppState();
    const navigation = useTypedNavigation();
    const selected = useSelectedAccount();
    const address = selected!.address;
    const safeArea = useSafeAreaInsets();
    const keyboard = useKeyboard();
    const [bounceableFormat,] = useBounceableWalletFormat();

    const [walletSettings, setSettings] = useWalletSettings(address);
    const [isInputNameFocus, setIsInputNameFocus] = useState(false);

    const ref: Ref<ATextInputRef> = createRef()

    const [avatarHeight, setAvatarHeight] = useState(0)
    const addressInputHeight = useSharedValue(106)

    const hideElementsOpacity = useSharedValue(1)

    const initHash = (walletSettings?.avatar !== null && walletSettings?.avatar !== undefined)
        ? walletSettings.avatar
        : avatarHash(address.toString({ testOnly: isTestnet }), avatarImages.length);
    const initColorHash = walletSettings.color ?? avatarHash(address.toString({ testOnly: isTestnet }), avatarColors.length);

    const [name, setName] = useState(walletSettings?.name ?? `${t('common.wallet')} ${appState.selected + 1}`);
    const [avatar, setAvatar] = useState(initHash);
    const [selectedColor, setColor] = useState(initColorHash);

    const hasChanges = useMemo(() => {
        return (
            name !== walletSettings?.name
            || avatar !== initHash
            || selectedColor !== initColorHash
        );
    }, [name, avatar, walletSettings, selectedColor, initHash, initColorHash]);

    const onSave = useCallback(() => {
        if (hasChanges) {
            setSettings({
                name: name.trim(),
                avatar,
                color: selectedColor
            });
            navigation.goBack();
        }
    }, [hasChanges, setSettings]);

    const onChangeAvatar = useCallback(() => {
        const callback = (hash: number, color: number) => {
            setAvatar(hash);
            setColor(color);
        };
        navigation.navigate('AvatarPicker', { callback, hash: avatar, initColor: initColorHash });
    }, []);

    const onInputNameFocus = () => {
        setIsInputNameFocus(true)
    }
    const onInputNameBlur = () => {
        setIsInputNameFocus(false)

    }

    useDerivedValue(() => {
        if (isInputNameFocus) {
            hideElementsOpacity.value = withTiming(0)
        } else {
            hideElementsOpacity.value = withTiming(1)
        }
    }, [isInputNameFocus])


    const animAvatarStyles = useAnimatedStyle(() => {

        return {
            opacity: hideElementsOpacity.value,
        }

    })

    const animWalletAddressStyles = useAnimatedStyle(() => {

        return {
            opacity: isInputNameFocus ? withTiming(0) : withTiming(1),
        }
    })
    const animHeaderStyles = useAnimatedStyle(() => {

        return {
            height: isInputNameFocus ? withTiming(0) : withTiming(106),
            opacity: isInputNameFocus ? withTiming(0) : withTiming(1),
        }
    })

    const animWalletNameStyles = useAnimatedStyle(() => {

        return {
            top: isInputNameFocus ? withTiming(-avatarHeight) : withTiming(0),
        }
    })

    const animSeparatorStyles = useAnimatedStyle(() => {
        return { height: isInputNameFocus ? withTiming(safeArea.top) : withTiming(0), }
    })


    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <Animated.View
                style={animHeaderStyles}>
                <ScreenHeader
                    onClosePressed={navigation.goBack}
                    style={Platform.select({ android: { paddingTop: safeArea.top } })}
                    title={walletSettings?.name ?? `${t('common.wallet')} ${appState.selected + 1}`}
                />
            </Animated.View>
            {!PLATFORM_IOS && <Animated.View style={animSeparatorStyles} />}
            <ScrollView
                contentInsetAdjustmentBehavior={'never'}
            >
                <View style={{
                    marginTop: 16,
                    alignItems: 'center',
                    paddingHorizontal: 16, flexGrow: 1
                }}>

                    <Animated.View style={animAvatarStyles}
                        onLayout={(e) => setAvatarHeight(e.nativeEvent.layout.height)}>
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
                                knownWallets={knownWallets}
                                id={address.toString({ testOnly: isTestnet })}
                                backgroundColor={avatarColors[selectedColor]}
                            />
                            <Text style={[
                                { color: theme.accent, marginTop: 12 },
                                Typography.medium17_24
                            ]}>
                                {t('wallets.settings.changeAvatar')}
                            </Text>
                        </Pressable>
                    </Animated.View>

                    <Animated.View style={[{
                        backgroundColor: theme.surfaceOnElevation,
                        marginTop: 20,
                        paddingVertical: 20,
                        width: '100%', borderRadius: 20,

                    }, animWalletNameStyles]}>
                        <ATextInput
                            label={t('common.walletName')}
                            blurOnSubmit={true}
                            editable={true}
                            value={name}
                            style={{ paddingHorizontal: 16 }}
                            onValueChange={(newValue) => {
                                setName(newValue.trimStart());
                            }}
                            index={1}
                            ref={ref}
                            onFocus={onInputNameFocus}
                            onBlur={onInputNameBlur}
                        />
                    </Animated.View>
                    <Animated.View
                        style={animWalletAddressStyles}
                        onLayout={(e) => addressInputHeight.value = e.nativeEvent.layout.height}>
                        <View style={{
                            backgroundColor: theme.surfaceOnElevation,
                            paddingVertical: 10,
                            paddingHorizontal: 16,
                            marginTop: 20,
                            width: '100%', borderRadius: 20
                        }}>
                            <Text style={[
                                { color: theme.textSecondary },
                                Typography.medium13_18
                            ]}>
                                {t('common.walletAddress')}
                            </Text>
                            <Text
                                onPress={() => {
                                    copyText(address.toString({ testOnly: isTestnet, bounceable: bounceableFormat }));
                                    toaster.show(
                                        {
                                            message: t('common.walletAddress') + ' ' + t('common.copied').toLowerCase(),
                                            type: 'default',
                                            duration: ToastDuration.SHORT,
                                            marginBottom: Platform.select({
                                                ios: keyboard.keyboardShown ? keyboard.keyboardHeight + 16 : safeArea.bottom + 16,
                                                android: keyboard.keyboardShown ? keyboard.keyboardHeight : 16
                                            })
                                        }
                                    );
                                }}
                                style={[
                                    { color: theme.textPrimary },
                                    Typography.regular17_24
                                ]}
                            >
                                {address.toString({ testOnly: isTestnet, bounceable: bounceableFormat })}
                            </Text>
                        </View>
                    </Animated.View>
                </View>
            </ScrollView>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={{ marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom + 16 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? safeArea.top + 32 : 0}
            >
                <RoundButton
                    title={t('contacts.save')}
                    disabled={!hasChanges}
                    onPress={onSave}
                />
            </KeyboardAvoidingView>
        </View>
    )
});