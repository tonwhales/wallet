import { Platform, Pressable, View, Text, ScrollView } from "react-native";
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

export const AvatarPickerFragment = fragment(() => {
    const { callback, hash, initColor } = useParams<{ callback: (newHash: number, color: number) => void, hash: number, initColor: number }>();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const { isTestnet } = useNetwork();
    const selected = useSelectedAccount();
    const address = selected!.address;

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
                onBackPressed={() => navigation.goBack()}
                title={t('wallets.settings.changeAvatar')}
                style={[
                    { paddingHorizontal: 16 },
                    Platform.select({ android: { paddingTop: safeArea.top } }),
                ]}
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
                            color: (hashState !== hash || selectedColor !== initColor) ? theme.accent : theme.textSecondary,
                            fontSize: 17, lineHeight: 24,
                            fontWeight: '500',
                        }}>
                            {t('common.select')}
                        </Text>
                    </Pressable>
                }
            />
            <View style={{ flexGrow: 1 }} />
            <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <Avatar
                    size={300}
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
            <View style={{
                borderTopLeftRadius: 20, borderTopRightRadius: 20,
                paddingTop: 20, paddingBottom: 16
            }}>
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
                                    width: 54, height: 54,
                                    marginRight: 8,
                                    borderWidth: index === selectedColor ? 2 : 0,
                                    borderColor: theme.accent,
                                    borderRadius: 27,
                                    backgroundColor: color
                                }}
                            />
                        )
                    })}
                </ScrollView>
                <ScrollView
                    contentContainerStyle={{ margin: 16, paddingVertical: 16, paddingRight: 16 }}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                >
                    {avatarImages.map((avatar, index) => {
                        return (
                            <Pressable
                                key={`avatar-${index}`}
                                onPress={() => setHash(index)}
                                style={{
                                    justifyContent: 'center', alignItems: 'center',
                                    width: 72, height: 72,
                                    marginRight: 8,
                                    borderWidth: index === hashState ? 2 : 0,
                                    borderColor: theme.accent,
                                    borderRadius: 36
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
        </View>
    )
});