import React, { useCallback, useState } from "react";
import { Platform, View, Text, ScrollView, Alert } from "react-native";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useParams } from "../../utils/useParams";
import { AppConfig } from "../../AppConfig";
import { Theme } from "../../Theme";
import { Address, fromNano } from "ton";
import { formatNum } from "../../utils/numbers";
import { format } from "date-fns";
import { is24Hour, locale } from "../../utils/dates";
import { RoundButton } from "../../components/RoundButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BN from "bn.js";
import { StatusBar } from "expo-status-bar";
import { useEngine } from "../../engine/Engine";
import { useItem } from "../../engine/persistence/PersistedItem";
import { LegacySubscription } from "../../engine/plugins/LegacySubscription";

export const SubscriptionFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const { address, subscription } = useParams<{ address: Address, subscription: LegacySubscription }>();
    const engine = useEngine();
    const account = useItem(engine.model.wallet(engine.address));
    const price = engine.products.price.useState();
    const [loading, setLoading] = useState(false);

    if (!subscription) {
        navigation.goBack();
        return null;
    }

    const cost = subscription.amount;
    const costNum = parseFloat(fromNano(cost));
    const costInUsd = price ? costNum * price.price.usd : undefined;
    const formattedCost = formatNum(costNum < 0.01 ? costNum.toFixed(6) : costNum.toFixed(2));
    const formattedPrice = costInUsd ? formatNum(costNum < 0.01 ? costInUsd.toFixed(6) : costInUsd.toFixed(2)) : undefined;

    const nextBilling = subscription.lastPayment + subscription.period;

    const onCancelSub = useCallback(
        async () => {
            setLoading(true);
            await new Promise<boolean>(resolve => {
                Alert.alert(
                    t('products.plugins.subscription.cancel'),
                    t('products.plugins.subscription.cancelConfirm'),
                    [{
                        text: t('common.yes'),
                        style: 'destructive',
                        onPress: async () => {
                            navigation.navigate('PluginTransfer', {
                                address: address,
                                operation: 'remove',
                                amount: new BN(0)
                            });
                            resolve(true);
                        }
                    }, {
                        text: t('common.no'),
                        onPress: () => {
                            resolve(false);
                        }
                    }]);
            });
            setLoading(false);
        },
        [subscription],
    );

    return (
        <View style={{
            flexGrow: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : 0
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('products.plugins.subscription.title')} />
            <View style={{
                backgroundColor: Theme.background,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                {Platform.OS === 'ios' && (
                    <View style={{
                        marginTop: 12,
                        height: 32,
                        justifyContent: 'center'
                    }}>
                        <Text style={[{
                            fontWeight: '600',
                            fontSize: 17
                        }, { textAlign: 'center' }]}>{t('products.plugins.subscription.title')}</Text>
                    </View>
                )}
                <Text style={{
                    fontWeight: '400',
                    fontSize: 13,
                    color: '#7D858A',
                    marginTop: 6,
                }}>
                    {
                        t('products.plugins.subscription.startDate')
                        + ' '
                        + format(
                            subscription.startAt * 1000,
                            is24Hour ? 'y MMM d, HH:mm' : 'y MMM d, hh:mm aa',
                            { locale: locale() }
                        )
                    }
                </Text>
            </View>
            <ScrollView>
                <View style={{
                    flex: 1,
                    paddingHorizontal: 16
                }}>
                    {!!subscription && (
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
                                    {subscription.wallet.toFriendly({ testOnly: AppConfig.isTestnet })}
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
                                    {t('products.plugins.subscription.charge')}
                                </Text>
                                <View style={{
                                    flexDirection: 'row'
                                }}>
                                    <Text style={{
                                        color: Theme.textColor,
                                        fontWeight: '400',
                                        maxWidth: 262,
                                    }}>
                                        {`${formattedCost} TON ${formattedPrice ? `($${formattedPrice})` : ''}`}
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
                                    {t('products.plugins.nextBilling')}
                                </Text>
                                <View style={{
                                    flexDirection: 'row'
                                }}>
                                    <Text style={{
                                        color: Theme.textColor,
                                        fontWeight: '400',
                                        maxWidth: 262,
                                    }}>
                                        {format(nextBilling * 1000, is24Hour ? 'MMMM d, HH:mm' : 'MMMM d, hh:mm aa', { locale: locale() })}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
            <View style={{ height: 64, marginHorizontal: 16, marginTop: 16, marginBottom: safeArea.bottom, alignSelf: 'stretch' }}>
                <RoundButton
                    // disabled={canceled}
                    display={'secondary'}
                    onPress={onCancelSub}
                    title={t('products.plugins.subscription.cancel')}
                    loading={loading}
                />
            </View>
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