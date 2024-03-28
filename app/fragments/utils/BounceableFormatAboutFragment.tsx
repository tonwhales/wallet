import { Platform, View, Text, Linking } from "react-native"
import { fragment } from "../../fragment"
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useParams } from "../../utils/useParams";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useTheme } from "../../engine/hooks";
import { StatusBar } from "expo-status-bar";
import { ScreenHeader } from "../../components/ScreenHeader";
import { Typography } from "../../components/styles";
import { ScrollView } from "react-native-gesture-handler";
import { openWithInApp } from "../../utils/openWithInApp";

export const BounceableFormatAboutFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const theme = useTheme();

    return (
        <View style={{
            flexGrow: 1,
            justifyContent: 'flex-end',
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
            paddingBottom: safeArea.bottom === 0 ? 32 : safeArea.bottom,
            backgroundColor: Platform.OS === 'android' ? theme.backgroundPrimary : undefined,
        }}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />
            <ScreenHeader
                onClosePressed={navigation.goBack}
                titleComponent={(
                    <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                        {t('newAddressFormat.learnMore')}
                    </Text>
                )}
            />
            <ScrollView style={{ flexGrow: 1 }}>


                <View style={[
                    {
                        flexShrink: 1,
                        flexGrow: 1,
                        backgroundColor: Platform.OS === 'android' ? theme.backgroundPrimary : theme.elevation,
                        borderTopEndRadius: Platform.OS === 'android' ? 0 : 20,
                        borderTopStartRadius: Platform.OS === 'android' ? 0 : 20,
                        padding: 16,
                        paddingBottom: safeArea.bottom + 16,
                    },
                    Platform.select({ android: { flexGrow: 1 } })
                ]}>
                    <Text style={[{
                        color: theme.textSecondary,
                    }, Typography.regular17_24]}>
                        {t('newAddressFormat.description_0_0')}
                        <Text
                            style={{ color: theme.accent, textDecorationLine: 'underline' }}
                            onPress={() => openWithInApp('https://t.me/toncoin/1013')}
                        >
                            {t('newAddressFormat.description_0_link')}
                        </Text>
                        {t('newAddressFormat.description_0_1')}
                        <Text style={[{ color: theme.textPrimary, }, Typography.medium17_24]}>
                            {`\n\n${t('newAddressFormat.title_1')}\n\n`}
                        </Text>
                        {t('newAddressFormat.description_1')}
                        <Text style={[{ color: theme.textPrimary, }, Typography.medium17_24]}>
                            {`\n\n${t('newAddressFormat.title_2')}\n\n`}
                        </Text>
                        {t('newAddressFormat.description_2')}
                        <Text style={[{ color: theme.textPrimary, }, Typography.medium17_24]}>
                            {`\n\n${t('newAddressFormat.title_3')}\n\n`}
                        </Text>
                        {t('newAddressFormat.description_3')}
                        {`\n\n${t('newAddressFormat.description_4')}:\n`}
                        <Text
                            style={{ color: theme.accent, textDecorationLine: 'underline' }}
                            onPress={() => openWithInApp('https://github.com/ton-blockchain/TEPs/pull/123')}
                        >
                            {'https://github.com/ton-blockchain/TEPs/pull/123'}
                        </Text>
                    </Text>
                </View>
            </ScrollView>
            <View style={{ padding: 16 }}>
                <RoundButton
                    title={t('common.ok')}
                    onPress={navigation.goBack}
                />
            </View>
        </View>
    );
});