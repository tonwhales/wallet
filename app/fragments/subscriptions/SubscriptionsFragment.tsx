import React from "react";
import { Platform, View, Text, ScrollView } from "react-native";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { EngineContext } from "../../sync/Engine";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { SubscriptionButton } from '../../components/SubscriptionButton';
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const SubscriptionsFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const engine = React.useContext(EngineContext)!
    const plugins = engine.products.main.usePlugins();

    return (
        <View style={{
            flexGrow: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : 0
        }}>
            <AndroidToolbar pageTitle={t('products.subscriptions.title')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 12,
                    height: 32,
                    justifyContent: 'center'
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        marginLeft: 17,
                        fontSize: 17
                    }, { textAlign: 'center' }]}>{t('products.subscriptions.title')}</Text>
                </View>
            )}
            <ScrollView>
                <View style={{
                    marginBottom: 16, marginTop: 17,
                    marginHorizontal: 16,
                    backgroundColor: "white",
                    borderRadius: 14,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexShrink: 1,
                }}>
                    {plugins!! && Object.keys(plugins).length > 0 && Object.entries(plugins).map((s, i) => {
                        return (
                            <View key={`sub-${i}`} style={{ marginHorizontal: 16, width: '100%' }}>
                                <SubscriptionButton address={s[0]} subscription={s[1]} />
                            </View>
                        )
                    })}
                </View>
            </ScrollView>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    );
});