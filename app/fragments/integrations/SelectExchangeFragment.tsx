import React, { useMemo } from "react";
import { Image, Platform, Pressable, ScrollView, View } from "react-native";
import { fragment } from "../../fragment";
import { Text } from "react-native";
import ChangellyLogo from '../../../assets/changelly.svg';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../engine/hooks";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { StatusBar } from "expo-status-bar";
import { Typography } from "../../components/styles";
import { t } from "../../i18n/t";
import { getLedgerSelected } from "../../storage/appState";

const DedustLogo = require('@assets/known/ic-dedust.png');

const ExchangeItem = ({ title, logo, onPress }: { title: string, logo: React.ReactNode, onPress: () => void }) => {
    const theme = useTheme();
    return (
        <Pressable
            style={[{
                backgroundColor: theme.surfaceOnElevation,
                padding: 20,
                marginBottom: 16,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
            }]}
            onPress={onPress}
        >
            <View style={{
                height: 46, width: 46,
                marginRight: 12,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                {logo}
            </View>
            <View style={{ justifyContent: 'center', flexGrow: 1, flexShrink: 1 }}>
                <View style={{ flexDirection: 'row' }}>
                    <Text
                        style={[{
                            color: theme.textPrimary,
                            marginBottom: 2,
                            maxWidth: '90%',
                        }, Typography.semiBold17_24]}
                        numberOfLines={1}
                    >
                        {title}
                    </Text>

                </View>

            </View>
        </Pressable>
    );
};

export const SelectExchangeFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const isLedger = useMemo(() => getLedgerSelected(), []);

    return (
        <View style={[
            {
                flexGrow: 1,
                justifyContent: 'flex-end',
                paddingTop: safeArea.top,
                backgroundColor: theme.backgroundPrimary
            }
        ]}>
            <StatusBar style={Platform.select({
                android: theme.style === 'dark' ? 'light' : 'dark',
                ios: 'light'
            })} />

            <ScreenHeader
                title={t('common.exchanges')}
                onBackPressed={navigation.goBack}
                style={{ paddingHorizontal: 16 }}
            />
            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 16
                }}>
                {!isLedger && (<ExchangeItem
                    title="Dedust.io"
                    logo={<Image source={DedustLogo} style={{ height: 46, width: 46 }} />}
                    onPress={() => { navigation.navigate('Swap') }} />
                )}
                <ExchangeItem
                    title="Changelly"
                    logo={<ChangellyLogo height={54} width={54} />}
                    onPress={() => { navigation.goBack();navigation.navigate('Changelly') }} />
            </ScrollView>
        </View>
    );
});