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
    const [account, engine] = useAccount();
    const oldWalletsBalance = engine.products.oldWallets.useState();
    const navigation = useTypedNavigation();

    if (!oldWalletsBalance.gt(new BN(0)) && !AppConfig.isTestnet) {
        return null;
    }

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
            {AppConfig.isTestnet && (<StakingProductComponent />)}
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