import React, { } from "react"
import { Text, View } from "react-native"
import { useAppConfig } from "../../utils/AppConfigContext";
import { t } from "../../i18n/t";
import { LedgerStakingProductComponent } from "./LedgerStakingProductComponent";
import { LedgerJettonsProductComponent } from "./LedgerJettonsProductComponent";

export const LedgerProductsComponent = React.memo(() => {
    const { Theme } = useAppConfig();

    return (
        <View style={{ backgroundColor: Theme.backgroundUnchangeable }}>
            <View style={{
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                backgroundColor: Theme.white,
                minHeight: 400
            }}>
                <View style={{ paddingHorizontal: 16 }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between', alignItems: 'center',
                        marginTop: 16,
                        paddingVertical: 12,
                        marginBottom: 4
                    }}>
                        <Text style={{
                            fontSize: 17,
                            fontWeight: '600',
                            color: Theme.textPrimary,
                            lineHeight: 24,
                        }}>
                            {t('common.products')}
                        </Text>
                    </View>

                    <View style={{ marginTop: 8 }}>
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