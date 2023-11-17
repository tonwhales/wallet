import React, { } from "react"
import { Text, View } from "react-native"
import { t } from "../../i18n/t";
import { LedgerStakingProductComponent } from "./LedgerStakingProductComponent";
import { LedgerJettonsProductComponent } from "./LedgerJettonsProductComponent";
import { useTheme } from "../../engine/hooks";

export const LedgerProductsComponent = React.memo(() => {
    const theme = useTheme();

    return (
        <View style={{ backgroundColor: theme.backgroundUnchangeable }}>
            <View style={{
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                backgroundColor: theme.surfaceOnBg,
                minHeight: 400
            }}>
                <View style={{ paddingHorizontal: 16 }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between', alignItems: 'center',
                        marginTop: 16,
                        paddingVertical: 12,
                    }}>
                        <Text style={{
                            fontSize: 17,
                            fontWeight: '600',
                            color: theme.textPrimary,
                            lineHeight: 24,
                        }}>
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