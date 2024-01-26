import { Platform, Pressable, View, ScrollView, KeyboardAvoidingView } from "react-native";
import { fragment } from "../../fragment";
import { useParams } from "../../utils/useParams";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";
import { useCallback, useState } from "react";
import { Avatar, avatarColors, avatarImages } from "../../components/Avatar";
import { useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoundButton } from "../../components/RoundButton";
import { useDimensions } from "@react-native-community/hooks";

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
                style={Platform.select({ android: { paddingTop: safeArea.top } })}
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
                    // hashColor
                    backgroundColor={avatarColors[selectedColor]}
                />
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={{ paddingVertical: 20 }}>
                <ScrollView
                    contentContainerStyle={{ margin: 16, paddingRight: 16 }}
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
                                    size={70}
                                    hash={index}
                                    borderColor={theme.border}
                                    borderWith={0}
                                    theme={theme}
                                    isTestnet={isTestnet}
                                    id={address.toString({ testOnly: isTestnet })}
                                    // hashColor
                                    backgroundColor={avatarColors[selectedColor]}
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
                    disabled={hashState === hash}
                    onPress={onSave}
                />
            </KeyboardAvoidingView>
        </View>
    )
});