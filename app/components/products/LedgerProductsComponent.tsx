import React, {  } from "react"
import { Text, View } from "react-native"
import { useEngine } from "../../engine/Engine";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";
import { LedgerStakingProductComponent } from "./LedgerStakingProductComponent";
import { LedgerJettonsProductComponent } from "./LedgerJettonsProductComponent";

export const LedgerProductsComponent = React.memo(() => {
    const { Theme, AppConfig } = useAppConfig();
    const navigation = useTypedNavigation();
    const engine = useEngine();

    return (
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
                    color: Theme.textColor,
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
    )
})