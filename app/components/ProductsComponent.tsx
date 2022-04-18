import BN from "bn.js"
import React from "react"
import { useTranslation } from "react-i18next"
import { View, Text } from "react-native"
import { ProductButton } from "../fragments/wallet/products/ProductButton"
import { useAccount } from "../sync/Engine"
import { Theme } from "../Theme"
import OldWalletIcon from '../../assets/ic_old_wallet.svg';
import { useTypedNavigation } from "../utils/useTypedNavigation"
import { AppConfig } from "../AppConfig"
import { StakingProductComponent } from "./Staking/StakingProductComponent"

export const ProductsComponent = React.memo(() => {
    const { t } = useTranslation();
    const navigation = useTypedNavigation();
    const [account, engine] = useAccount();
    const oldWalletsBalance = engine.products.oldWallets.useState();
    const pool = engine.products.whalesStakingPool.useState();
    const currentJob = engine.products.apps.useState();

    return (
        <View style={{
            flex: 1
        }}>
            <View
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
            </View>
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
            {currentJob && currentJob.job.type === 'transaction' && (
                <ProductButton
                    name={t('products.transactionRequest')}
                    subtitle={currentJob.job.text}
                    icon={OldWalletIcon}
                    value={null}
                    onPress={() => {
                        if (currentJob.job.type === 'transaction') {
                            navigation.navigate('Transfer', {
                                target: currentJob.job.target.toFriendly({ testOnly: AppConfig.isTestnet }),
                                comment: currentJob.job.text,
                                amount: currentJob.job.amount.toString(10),
                                payload: currentJob.job.payload,
                                job: currentJob.jobRaw
                            });
                        }
                    }}
                />
            )}
        </View>
    )
})