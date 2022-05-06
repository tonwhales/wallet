import React, { useCallback, useState } from "react";
import { Platform, View, Text, ScrollView, Alert } from "react-native";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { EngineContext } from "../../sync/Engine";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useParams } from "../../utils/useParams";
import { AppConfig } from "../../AppConfig";
import { Theme } from "../../Theme";
import { Address, Cell, fromNano, toNano } from "ton";
import { formatNum } from "../../utils/numbers";
import { format } from "date-fns";
import { is24Hour, locale } from "../../utils/dates";
import { RoundButton } from "../../components/RoundButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createRemovePluginCommand } from "../../utils/createRemovePluginCommand";
import { storagePersistence } from "../../storage/storage";
import { contractFromPublicKey } from "../../sync/contractFromPublicKey";
import { loadWalletKeys, WalletKeys } from "../../storage/walletKeys";
import { getCurrentAddress } from "../../storage/appState";
import { sign } from "ton-crypto";
import { backoff } from "../../utils/time";

export const SubscriptionFragment = fragment(() => {
    const navigation = useTypedNavigation();
    const safeArea = useSafeAreaInsets();
    const params = useParams<{ address: string }>();
    const engine = React.useContext(EngineContext)!
    const acc = React.useMemo(() => getCurrentAddress(), []);
    const account = engine.products.main.useState();
    const plugins = engine.products.main.usePlugins();
    const subscription = plugins[params.address];
    const price = engine.products.price.useState();
    const [loading, setLoading] = useState(false);

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

    const onCancelSub = useCallback(
        async () => {
            setLoading(true);
            await new Promise<boolean>(resolve => {
                Alert.alert(
                    t('products.subscriptions.subscription.cancel'),
                    t('products.subscriptions.subscription.cancelConfirm'),
                    [{
                        text: t('common.yes'),
                        style: 'destructive',
                        onPress: async () => {
                            const contract = await contractFromPublicKey(acc.publicKey);

                            let walletKeys: WalletKeys;
                            try {
                                walletKeys = await loadWalletKeys(acc.secretKeyEnc);
                            } catch (e) {
                                resolve(false);
                                return;
                            }

                            const transfer = new Cell();

                            const transferCell = createRemovePluginCommand(
                                account.seqno,
                                contract.source.walletId,
                                Math.floor(Date.now() / 1e3) + 60,
                                Address.parse(params.address)
                            );

                            transfer.bits.writeBuffer(sign(await transferCell.hash(), walletKeys.keyPair.secretKey));
                            transfer.writeCell(transferCell);

                            await backoff(() => engine.connector.sendExternalMessage(contract, transfer));
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
            <AndroidToolbar pageTitle={t('products.subscriptions.subscription.title')} />
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
                        }, { textAlign: 'center' }]}>{t('products.subscriptions.subscription.title')}</Text>
                    </View>
                )}
                <Text style={{
                    fontWeight: '400',
                    fontSize: 13,
                    color: '#7D858A',
                    marginTop: 6,
                }}>
                    {
                        t('products.subscriptions.subscription.startDate')
                        + ' '
                        + format(
                            subscription.state.startAt * 1000,
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
                    title={t('products.subscriptions.subscription.cancel')}
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