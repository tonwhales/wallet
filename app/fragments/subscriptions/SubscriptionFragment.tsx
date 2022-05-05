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
import { formatNum } from "../../utils/numbers";
import { format } from "date-fns";
import { is24Hour, locale } from "../../utils/dates";

export const SubscriptionFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const params = useParams<{ address: string }>();
    const engine = React.useContext(EngineContext)!
    const plugins = engine.products.main.usePlugins();
    const subscription = plugins[params.address];
    const price = engine.products.price.useState();

    console.log('[SubscriptionFragment]', { plugins, subscription });

    if (!params.address || !subscription || subscription.type === 'unknown') {
        navigation.goBack();
        return null;
    }

    const cost = subscription.state.amount;
    const costNum = parseFloat(fromNano(cost));
    const costInUsd = costNum * price.price.usd;
    const formattedCost = formatNum(costNum < 0.01 ? costNum.toFixed(6) : costNum.toFixed(2));
    const formattedPrice = formatNum(costNum < 0.01 ? costInUsd.toFixed(6) : costInUsd.toFixed(2));

    const nextBilling = subscription.state.lastPayment + subscription.state.period;

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
                                marginTop: 10,
                                marginBottom: 12
                            }}>
                                <Text style={{
                                    fontWeight: '500',
                                    fontSize: 12,
                                    color: '#7D858A',
                                    marginBottom: 6
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
                                paddingHorizontal: 16,
                                marginTop: 10,
                                marginBottom: 12
                            }}>
                                <Text style={{
                                    fontWeight: '500',
                                    fontSize: 12,
                                    color: '#7D858A',
                                    marginBottom: 6
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
                                        {`${formattedCost} TON ($${formattedPrice})`}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ height: 1, alignSelf: 'stretch', backgroundColor: Theme.divider, marginLeft: 16 }} />
                            <View style={{
                                justifyContent: 'center',
                                alignItems: 'flex-start',
                                width: '100%',
                                paddingHorizontal: 16,
                                marginTop: 10,
                                marginBottom: 12
                            }}>
                                <Text style={{
                                    fontWeight: '500',
                                    fontSize: 12,
                                    color: '#7D858A',
                                    marginBottom: 6
                                }}>
                                    {t('products.subscriptions.nextBilling')}
                                </Text>
                                <View style={{
                                    flexDirection: 'row'
                                }}>
                                    <Text style={{
                                        color: Theme.textColor,
                                        fontWeight: '400',
                                        maxWidth: 262,
                                    }}>
                                        {format(nextBilling * 1000, is24Hour ? 'LLLL d, HH:mm' : 'LLLL d, hh:mm aa', { locale: locale() })}
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