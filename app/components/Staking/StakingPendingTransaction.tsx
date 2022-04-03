import React from "react";
import { useTranslation } from "react-i18next";
import { View, Text } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import { fromNano } from "ton";
import { AppConfig } from "../../AppConfig";
import { getCurrentAddress } from "../../storage/appState";
import { useAccount } from "../../sync/Engine";
import { Transaction } from "../../sync/Transaction";
import { Theme } from "../../Theme";
import { PendingTransactionAvatar } from "../PendingTransactionAvatar";
import { PriceComponent } from "../PriceComponent";

export const StakingPendingTransaction = React.memo((
    {
        onPress
    }: {
        onPress: (tx: Transaction) => void
    }
) => {
    const { t } = useTranslation();
    const [account, engine] = useAccount();
    const pool = engine.products.stakingPool.useState();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const transactions = React.useMemo<Transaction[]>(() => {
        let txs = account.transactions.map((v) => engine.getTransaction(v));
        return [...account.pending, ...txs];
    }, [account.transactions, account.pending]);

    if (!pool) return null;

    const tx = transactions.find((t) => {
        return (
            t.status === 'pending'
            && pool.address
                .toFriendly({ testOnly: AppConfig.isTestnet })
            === t.address
                ?.toFriendly({ testOnly: AppConfig.isTestnet })
        );
    });

    if (!tx) return null;

    let avatarId = tx.address!.toFriendly({ testOnly: AppConfig.isTestnet });

    return (
        <View style={{ marginHorizontal: 16, marginBottom: 14, borderRadius: 14, backgroundColor: 'white', overflow: 'hidden' }} collapsable={false} >
            <TouchableHighlight onPress={() => onPress(tx)} underlayColor={Theme.selector}>
                <View style={{ alignSelf: 'stretch', flexDirection: 'row', height: 62 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, margin: 10 }}>
                        <PendingTransactionAvatar address={pool.address.toFriendly({ testOnly: AppConfig.isTestnet })} avatarId={avatarId} staking />
                    </View>
                    <View style={{
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexDirection: 'row',
                        flexGrow: 1
                    }}>
                        <Text
                            style={{
                                color: '#7D858A',
                                fontSize: 16, flexGrow: 1,
                                marginRight: 16,
                                fontWeight: '600',
                            }}
                            numberOfLines={1}
                        >
                            {t('common.sending')}
                        </Text>
                        <View style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginRight: 16
                        }}>
                            <Text style={{
                                fontWeight: '400',
                                fontSize: 16,
                                color: Theme.textColor
                            }}>
                                {fromNano(tx.amount.abs()) + ' ' + 'TON'}
                            </Text>
                            <PriceComponent
                                amount={tx.amount.abs()}
                                style={{
                                    backgroundColor: 'transparent',
                                    paddingHorizontal: 0,
                                    alignSelf: 'flex-end'
                                }}
                                textStyle={{ color: '#6D6D71', fontWeight: '400' }}
                            />
                        </View>
                    </View>
                </View>
            </TouchableHighlight>
        </View>
    );
})