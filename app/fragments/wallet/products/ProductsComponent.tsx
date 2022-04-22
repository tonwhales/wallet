import BN from "bn.js"
import React from "react"
import { View, Text } from "react-native"
import { ProductButton } from "./ProductButton"
import { useAccount } from "../../../sync/Engine"
import { Theme } from "../../../Theme"
import OldWalletIcon from '../../../../assets/ic_old_wallet.svg';
import { useTypedNavigation } from "../../../utils/useTypedNavigation"
import { AppConfig } from "../../../AppConfig"
import { StakingProductComponent } from "../../../components/Staking/StakingProductComponent"
import { t } from "../../../i18n/t"

export const ProductsComponent = React.memo(() => {
    const navigation = useTypedNavigation();
    const [account, engine] = useAccount();
    const oldWalletsBalance = engine.products.oldWallets.useState();
    const pool = engine.products.whalesStakingPool.useState();
    const currentJob = engine.products.apps.useState();

    return (
        <View style={{ paddingTop: 8, paddingBottom: 8 }}>
            {/* <View
                style={{ marginTop: 8, backgroundColor: Theme.background }}
                collapsable={false}
            >
                <Text
                    style={{
                        fontSize: 18,
                        fontWeight: '700',
                        marginHorizontal: 16,
                        marginVertical: 8
                    }}
                >
                    {t('common.products')}
                </Text>
            </View> */}
            {currentJob && currentJob.job.type === 'transaction' && (
                <ProductButton
                    name={t('products.transactionRequest.title')}
                    subtitle={t('products.transactionRequest.subtitle')}
                    icon={OldWalletIcon}
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