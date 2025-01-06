import { Platform, Pressable, View, Text } from "react-native"
import { fragment } from "../fragment"
import { StatusBar } from "expo-status-bar"
import { useLanguage, useTheme } from "../engine/hooks";
import { ScreenHeader } from "../components/ScreenHeader";
import { t } from "../i18n/t";
import { useTypedNavigation } from "../utils/useTypedNavigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lagnTitles, langResources } from "../i18n/i18n";
import { ScrollView } from "react-native-gesture-handler";
import { useReboot } from "../utils/RebootContext";

import IcCheck from "@assets/ic-check.svg";

export const LanguageFragment = fragment(() => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const reboot = useReboot();
    const [lang, setLang] = useLanguage();

    const onLangSelected = (lang: string) => {
        setLang(lang);
        setTimeout(reboot, 100);
    }

    return (
        <View>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                title={t('settings.language')}
                onClosePressed={navigation.goBack}
                style={Platform.select({ android: { paddingTop: safeArea.top } })}
            />
            <ScrollView
                style={{ flexGrow: 1, marginTop: 16 }}
                contentInset={{ bottom: safeArea.bottom }}
                contentContainerStyle={{ gap: 8 }}
            >
                {Object.keys(langResources).map((key) => {
                    const isSelected = lang === key;
                    return (
                        <Pressable
                            key={key}
                            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                            onPress={() => onLangSelected(key)}
                        >
                            <View
                                style={[
                                    {
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: 20,
                                        borderRadius: 20,
                                        backgroundColor: theme.surfaceOnElevation,
                                        marginBottom: 16, marginHorizontal: 16
                                    },
                                ]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{
                                        fontWeight: '600',
                                        fontSize: 17,
                                        color: theme.textPrimary
                                    }}>
                                        {lagnTitles[key] || key}
                                    </Text>
                                </View>
                                <View style={{
                                    justifyContent: 'center', alignItems: 'center',
                                    height: 24, width: 24,
                                    backgroundColor: isSelected ? theme.accent : theme.divider,
                                    borderRadius: 12
                                }}>
                                    {isSelected && (
                                        <IcCheck
                                            color={theme.white}
                                            height={16} width={16}
                                            style={{ height: 16, width: 16 }}
                                        />
                                    )}
                                </View>
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    )
})