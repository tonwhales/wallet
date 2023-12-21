import React, { } from "react"
import { Text, View } from "react-native"
import { t } from "../../i18n/t";
import { LedgerStakingProductComponent } from "./LedgerStakingProductComponent";
import { LedgerJettonsProductComponent } from "./LedgerJettonsProductComponent";
import { useTheme } from "../../engine/hooks";
import { Typography } from "../styles";

export const LedgerProductsComponent = React.memo(() => {
    const theme = useTheme();

    return (
        <View>
            <View style={{
                backgroundColor: theme.backgroundPrimary,
            }}>
                <View style={{ paddingHorizontal: 16 }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between', alignItems: 'center',
                        marginTop: 16,
                        paddingVertical: 12,
                    }}>
                        <Text style={[{ color: theme.textPrimary, }, Typography.semiBold20_28]}>
                        {t('common.products')}
                    </Text>
                    </View>

                    <View style={{ marginTop: 4 }}>
                        <LedgerStakingProductComponent key={'pool'} />
                    </View>

                    <View style={{ marginTop: 8 }}>
                        <LedgerJettonsProductComponent key={'jettons'} />
                    </View>
                </View>
            </View>
        </View>
    )
})