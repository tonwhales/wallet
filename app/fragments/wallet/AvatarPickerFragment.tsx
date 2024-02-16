import { Platform, Pressable, View, ScrollView, KeyboardAvoidingView, Text } from "react-native";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";
import { useCallback, useMemo, useState } from "react";
import { Avatar, avatarColors, avatarImages } from "../../components/Avatar";
import { useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { useDimensions } from "@react-native-community/hooks";
import { Typography } from "../../components/styles";

export const AvatarPickerFragment = fragment(() => {
    const { callback, hash, initColor } = useParams<{ callback: (newHash: number, color: number) => void, hash: number, initColor: number }>();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const { isTestnet } = useNetwork();
    const selected = useSelectedAccount();
    const address = selected!.address;
    const dimentions = useDimensions();

    const [hashState, setHash] = useState(hash);
    const [selectedColor, setColor] = useState(initColor);

    const hasChanges = useMemo(() => {
        return hashState !== hash || selectedColor !== initColor;
    }, [hashState, selectedColor]);

    const onSave = useCallback(() => {
        if (hashState !== hash || selectedColor !== initColor) {
            navigation.goBack();
            callback(hashState, selectedColor);
        }
    }, [hashState, selectedColor]);

    return (
        <View style={{ flexGrow: 1 }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                onClosePressed={navigation.goBack}
                title={t('wallets.settings.changeAvatar')}
                style={[Platform.select({ android: { paddingTop: safeArea.top } })]}
            />
            <View style={{ flexGrow: 1 }} />
            <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <Avatar
                    size={dimentions.window.width - 32}
                    hash={hashState}
                    borderColor={theme.transparent}
                    theme={theme}
                    isTestnet={isTestnet}
                    id={address.toString({ testOnly: isTestnet })}
                    backgroundColor={avatarColors[selectedColor]}
                />
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={{ paddingVertical: 20 }}>
                <Text style={[{ color: theme.textPrimary, marginHorizontal: 16 }, Typography.regular15_20]}>
                    {t('wallets.settings.selectAvatarTitle')}
                </Text>
                <ScrollView
                    contentContainerStyle={{ marginHorizontal: 16, marginVertical: 10, paddingRight: 16 }}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                >
                    {avatarImages.map((avatar, index) => {
                        const isSelected = index === hashState;
                        return (
                            <Pressable
                                key={`avatar-${index}`}
                                onPress={() => setHash(index)}
                                style={{
                                    justifyContent: 'center', alignItems: 'center',
                                    width: 72, height: 72,
                                    marginRight: 12,
                                    borderRadius: 36,
                                    borderWidth: isSelected ? 2 : 0,
                                    borderColor: theme.accent
                                }}
                            >
                                <Avatar
                                    size={68}
                                    hash={index}
                                    borderColor={theme.border}
                                    borderWith={0}
                                    theme={theme}
                                    isTestnet={isTestnet}
                                    id={address.toString({ testOnly: isTestnet })}
                                />
                            </Pressable>
                        )
                    })}
                </ScrollView>
                <Text style={[{ color: theme.textPrimary, marginHorizontal: 16, marginTop: 24, marginBottom: 10 }, Typography.regular15_20]}>
                    {t('wallets.settings.selectColorTitle')}
                </Text>
                <ScrollView
                    contentContainerStyle={{ marginHorizontal: 16, paddingRight: 16 }}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                >
                    {avatarColors.map((color, index) => {
                        return (
                            <Pressable
                                key={`color-${index}`}
                                onPress={() => setColor(index)}
                                style={{
                                    justifyContent: 'center', alignItems: 'center',
                                    width: 46, height: 46,
                                    marginRight: 12,
                                    borderWidth: index === selectedColor ? 2 : 0,
                                    borderColor: color,
                                    borderRadius: 27,
                                }}
                            >
                                <View
                                    style={{
                                        height: 34, width: 34,
                                        borderRadius: 17,
                                        backgroundColor: color
                                    }}
                                />
                            </Pressable>
                        )
                    })}
                </ScrollView>
            </View>
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