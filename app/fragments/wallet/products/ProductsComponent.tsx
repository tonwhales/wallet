import BN from "bn.js"
import React from "react"
import { Text, View } from "react-native"
import { ProductButton } from "./ProductButton"
import { useEngine } from "../../../engine/Engine"
import OldWalletIcon from '../../../../assets/ic_old_wallet.svg';
import SignIcon from '../../../../assets/ic_sign.svg';
import TransactionIcon from '../../../../assets/ic_transaction.svg';
import { useTypedNavigation } from "../../../utils/useTypedNavigation"
import { AppConfig } from "../../../AppConfig"
import { StakingProductComponent } from "../../../components/Staking/StakingProductComponent"
import { t } from "../../../i18n/t"
import { JettonProdcut } from "./JettonProduct"
import { Theme } from "../../../Theme"
import { getConnectionReferences } from "../../../storage/appState"

export const ProductsComponent = React.memo(() => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const oldWalletsBalance = engine.products.legacy.useState();
    const pool = engine.products.whalesStakingPool.useState();
    const currentJob = engine.products.apps.useState();
    const jettons = engine.products.main.useJettons();
    const extensions = engine.products.extensions.useExtensions();

    // Resolve accounts
    let accounts: React.ReactElement[] = [];
    if (oldWalletsBalance.gt(new BN(0))) {
        accounts.push(
            <ProductButton
                name={t('products.oldWallets.title')}
                subtitle={t("products.oldWallets.subtitle")}
                icon={OldWalletIcon}
                value={oldWalletsBalance}
                onPress={() => navigation.navigate('Migration')}
                style={{ marginVertical: 4 }}
            />
        );
    }
    for (let j of jettons) {
        accounts.push(
            <JettonProdcut key={'jt' + j.wallet.toFriendly()} jetton={j} navigation={navigation} engine={engine} />
        );
    }

    // Resolve apps
    let apps: React.ReactElement[] = [];
    for (let e of extensions) {
        apps.push(<ProductButton
            name={e.name}
            subtitle={e.url}
            image={e.image?.url}
            blurhash={e.image?.blurhash}
            value={null}
            onPress={() => navigation.navigate('App', { url: e.url })}
            extension={true}
            style={{ marginVertical: 4 }}
        />);
    }
    if (pool) {
        apps.push(<StakingProductComponent key={'pool'} pool={pool} />);
    }

    return (
        <View style={{ paddingTop: 8 }}>
            {currentJob && currentJob.job.type === 'transaction' && (
                <ProductButton
                    name={t('products.transactionRequest.title')}
                    subtitle={t('products.transactionRequest.subtitle')}
                    icon={TransactionIcon}
                    value={null}
                    onPress={() => {
                        if (currentJob.job.type === 'transaction') {
                            navigation.navigateTransfer({
                                order: {
                                    target: currentJob.job.target.toFriendly({ testOnly: AppConfig.isTestnet }),
                                    amount: currentJob.job.amount,
                                    payload: currentJob.job.payload,
                                    stateInit: currentJob.job.stateInit,
                                    amountAll: false
                                },
                                job: currentJob.jobRaw,
                                text: currentJob.job.text,
                                callback: null
                            });
                        }
                    }}
                />
            )}
            {currentJob && currentJob.job.type === 'sign' && (
                <ProductButton
                    name={t('products.signatureRequest.title')}
                    subtitle={t('products.signatureRequest.subtitle')}
                    icon={SignIcon}
                    value={null}
                    onPress={() => {
                        if (currentJob.job.type === 'sign') {
                            const connection = getConnectionReferences().find((v) => Buffer.from(v.key, 'base64').equals(currentJob.key));
                            if (!connection) {
                                return; // Just in case
                            }
                            navigation.navigateSign({
                                text: currentJob.job.text,
                                textCell: currentJob.job.textCell,
                                payloadCell: currentJob.job.payloadCell,
                                job: currentJob.jobRaw,
                                callback: null,
                                name: connection.name
                            });
                        }
                    }}
                />
            )}

            {accounts.length > 0 && (
                <>
                    <View style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                        <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{t('products.accounts')}</Text>
                    </View>
                    {accounts}
                </>
            )}

            {apps.length > 0 && (
                <>
                    <View style={{ marginTop: 8, backgroundColor: Theme.background }} collapsable={false}>
                        <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginVertical: 8 }}>{t('products.services')}</Text>
                    </View>
                    {apps}
                </>
            )}
        </View>
    )
})