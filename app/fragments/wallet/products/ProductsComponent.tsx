import BN from "bn.js"
import React from "react"
import { View } from "react-native"
import { ProductButton } from "./ProductButton"
import { useEngine } from "../../../sync/Engine"
import OldWalletIcon from '../../../../assets/ic_old_wallet.svg';
import SignIcon from '../../../../assets/ic_sign.svg';
import TransactionIcon from '../../../../assets/ic_transaction.svg';
import { useTypedNavigation } from "../../../utils/useTypedNavigation"
import { AppConfig } from "../../../AppConfig"
import { StakingProductComponent } from "../../../components/Staking/StakingProductComponent"
import { t } from "../../../i18n/t"
import { Address } from "ton"
import { JettonProdcut } from "./JettonProduct"

export const ProductsComponent = React.memo(() => {
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const oldWalletsBalance = engine.products.legacy.useState();
    const pool = engine.products.whalesStakingPool.useState();
    const currentJob = engine.products.apps.useState();
    const jettons = engine.products.main.useJettons();

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
                            navigation.navigate('Transfer', {
                                target: currentJob.job.target.toFriendly({ testOnly: AppConfig.isTestnet }),
                                comment: currentJob.job.text,
                                amount: currentJob.job.amount.toString(10),
                                payload: currentJob.job.payload,
                                stateInit: currentJob.job.stateInit,
                                job: currentJob.jobRaw
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
                            navigation.navigate('Sign', {
                                job: currentJob.jobRaw
                            });
                        }
                    }}
                />
            )}

            {jettons.map((jt) => (
                <JettonProdcut jetton={jt} navigation={navigation} engine={engine} />
            ))}
            <StakingProductComponent pool={pool} />
            {oldWalletsBalance.gt(new BN(0)) && (
                <ProductButton
                    name={t('products.oldWallets.title')}
                    subtitle={t("products.oldWallets.subtitle")}
                    icon={OldWalletIcon}
                    value={oldWalletsBalance}
                    onPress={() => navigation.navigate('Migration')}
                    style={{ marginVertical: 4 }}
                />
            )}
        </View>
    )
})