import React from "react";
import { View, Text } from "react-native";
import { RoundButton } from "../../../components/RoundButton";
import { t } from "../../../i18n/t";
import { useEngine } from "../../../engine/Engine";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { useAppConfig } from "../../../utils/AppConfigContext";

export const OfflineErrorComponent = React.memo(({
    errorDomain, errorCode, errorDesc
}: {
    errorDomain?: string, errorCode: number, errorDesc: string
}) => {
    const { Theme } = useAppConfig();
    const engine = useEngine();
    const navigation = useTypedNavigation();
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ flexGrow: 1 }} />
            <Text style={{
                fontSize: 20,
                color: Theme.textColor,
                fontWeight: '600',
                marginHorizontal: 16,
                textAlign: 'center'
            }}>
                {'There wan an error loading the app, please try again later'}
            </Text>
            <Text style={{
                fontSize: 17,
                fontWeight: '600',
                margin: 16,
                color: Theme.textSecondary
            }}>
                {'Error code: '} {errorCode}
            </Text>
            <View style={{ flexGrow: 1 }} />
            <RoundButton
                action={async () => {
                    await engine.products.holders.forceSyncOfflineApp();
                    navigation.goBack();
                }}
                title={t('common.close')}
                style={{ marginBottom: 64, marginHorizontal: 16 }}
            />
        </View>
    );
});