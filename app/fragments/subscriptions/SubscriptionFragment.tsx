import React from "react";
import { Platform, View, Text, ScrollView } from "react-native";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { EngineContext } from "../../sync/Engine";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useParams } from "../../utils/useParams";
import { AppConfig } from "../../AppConfig";
import { Theme } from "../../Theme";
import { fromNano } from "ton";
import { PriceComponent } from "../../components/PriceComponent";

export const SubscriptionFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const params = useParams<{ address: string }>();
    const engine = React.useContext(EngineContext)!
    const plugins = engine.products.main.usePlugins();
    const subscription = plugins[params.address];

    console.log('[SubscriptionFragment]', { plugins, subscription });

    if (!params.address || !subscription) {
        navigation.goBack();
    }

    return (
        <View style={{
            flexGrow: 1
        }}>
            <AndroidToolbar pageTitle={t('products.subscriptions.subscription.title')} />
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
                    }, { textAlign: 'center' }]}>{t('products.subscriptions.subscription.title')}</Text>
                </View>
            )}
            <ScrollView>
                <View style={{
                    flex: 1,
                    paddingHorizontal: 16
                }}>
                    {!!subscription && subscription.type === 'legacy-subscription' && (
                        <View style={{
                            marginBottom: 16, marginTop: 17,
                            backgroundColor: "white",
                            borderRadius: 14,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            <View style={{
                                justifyContent: 'center',
                                alignItems: 'flex-start',
                                width: '100%',
                                paddingHorizontal: 16,
                                marginVertical: 13
                            }}>
                                <Text style={{
                                    fontWeight: '500',
                                    fontSize: 12,
                                    color: '#7D858A',
                                    marginBottom: 8
                                }}>
                                    {t('common.walletAddress')}
                                </Text>
                                <Text style={{
                                    color: Theme.textColor,
                                    fontWeight: '400',
                                    maxWidth: 262
                                }}>
                                    {subscription.state.wallet.toFriendly({ testOnly: AppConfig.isTestnet })}
                                </Text>
                            </View>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 }} />
                            <View style={{
                                justifyContent: 'center',
                                alignItems: 'flex-start',
                                width: '100%',
                                paddingHorizontal: 16
                            }}>
                                <Text style={{
                                    fontWeight: '500',
                                    fontSize: 12,
                                    color: '#7D858A',
                                    marginTop: 10,
                                    marginBottom: 8
                                }}>
                                    {t('products.subscriptions.subscription.charge')}
                                </Text>
                                <View style={{
                                    flexDirection: 'row'
                                }}>
                                    <Text style={{
                                        color: Theme.textColor,
                                        fontWeight: '400',
                                        maxWidth: 262,
                                    }}>
                                        {fromNano(subscription.state.amount) + ' TON '}
                                    </Text>
                                    <Text>
                                        {'('}
                                        <PriceComponent
                                            amount={subscription.state.amount}
                                            style={{
                                                backgroundColor: 'transparent',
                                                padding: 0,
                                                paddingBottom: 0,
                                                paddingTop: 0,
                                                paddingHorizontal: 0,
                                                paddingVertical: 0,
                                            }}
                                            textStyle={{ color: Theme.textColor, fontWeight: '400', lineHeight: undefined }}
                                        />
                                        {')'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
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