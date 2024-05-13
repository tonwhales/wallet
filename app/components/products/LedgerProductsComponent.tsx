import React, { memo } from "react"
import { Text, View } from "react-native"
import { t } from "../../i18n/t";
import { StakingProductComponent } from "./StakingProductComponent";
import { LedgerJettonsProductComponent } from "./LedgerJettonsProductComponent";
import { useTheme } from "../../engine/hooks";
import { Typography } from "../styles";
import { AccountLite } from '../../engine/hooks/accounts/useAccountLite';
import { useTypedNavigation } from '../../utils/useTypedNavigation';
import { TonProductComponent } from "./TonProductComponent";
import { SpecialJettonProduct } from "./SpecialJettonProduct";
import { Address } from "@ton/core";

export const LedgerProductsComponent = memo(({ account, testOnly }: { account: AccountLite, testOnly: boolean }) => {
    const theme = useTheme();
    const navigation = useTypedNavigation();
    const address = Address.parse(account.address);

    return (
        <View>
            <View style={{ backgroundColor: theme.backgroundPrimary }}>
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

                <View style={{
                    marginHorizontal: 16, marginBottom: 16,
                    backgroundColor: theme.surfaceOnBg,
                    borderRadius: 20
                }}>
                    <TonProductComponent
                        key={'ton-native'}
                        balance={account.balance}
                        theme={theme}
                        navigation={navigation}
                        address={Address.parse(account.address)}
                        testOnly={testOnly}
                        isLedger={true}
                    />

                    <SpecialJettonProduct
                        key={'special-jettton'}
                        theme={theme}
                        navigation={navigation}
                        address={Address.parse(account.address)}
                        testOnly={testOnly}
                        divider={'top'}
                        isLedger={true}
                    />
                </View>

                <View style={{ marginTop: 4 }}>
                    <StakingProductComponent
                        isLedger
                        key={'pool'}
                        address={address}
                    />
                </View>
                <LedgerJettonsProductComponent
                    address={address}
                    testOnly={testOnly}
                    key={'jettons'}
                />
            </View>
        </View>
    );
});