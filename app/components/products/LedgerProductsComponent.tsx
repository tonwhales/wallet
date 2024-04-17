import React, { } from "react"
import { Text, View } from "react-native"
import { t } from "../../i18n/t";
import { StakingProductComponent } from "./StakingProductComponent";
import { LedgerJettonsProductComponent } from "./LedgerJettonsProductComponent";
import { useTheme } from "../../engine/hooks";
import { Typography } from "../styles";
import { AccountLite } from '../../engine/hooks/accounts/useAccountLite';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { TonProductComponent } from "./TonProductComponent";
import { USDTProduct } from "./USDTProduct";
import { Address } from "@ton/core";

export const LedgerProductsComponent = React.memo(({ account, testOnly }: { account: AccountLite, testOnly: boolean }) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();

    return (
        <View>
            <View style={{
                backgroundColor: theme.backgroundPrimary,
            }}>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between', alignItems: 'center',
                    marginTop: 16,
                    paddingVertical: 12,
                    paddingHorizontal: 16
                }}>
                    <Text style={[{ color: theme.textPrimary, }, Typography.semiBold20_28]}>
                        {t('common.products')}
                    </Text>
                </View>

                <TonProductComponent
                    key={'ton-native'}
                    balance={account.balance}
                    theme={theme}
                    navigation={navigation}
                    isLedger
                />

                <View style={{ marginTop: 4 }}>
                    <StakingProductComponent isLedger key={'pool'} />
                </View>
                <View style={{ paddingHorizontal: 16 }}>
                    <LedgerJettonsProductComponent key={'jettons'} />
                </View>
            </View>
        </View>
    );
});