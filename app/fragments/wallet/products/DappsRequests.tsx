import { memo } from "react";
import { View, Text } from "react-native";
import { useConnectPendingRequests, useCurrentJob, useNetwork, useTheme } from "../../../engine/hooks";
import { t } from "../../../i18n/t";
import { Typography } from "../../../components/styles";
import { TonXRequestButton } from "../views/TonXRequestButton";
import { TonConnectRequestButton } from "../views/TonConnectRequestButton";

export const DappsRequests = memo(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const [tonconnectRequests,] = useConnectPendingRequests();
    const [tonXRequest,] = useCurrentJob();

    if (!tonXRequest && tonconnectRequests.length === 0) {
        return null;
    }

    return (
        <View style={[{ paddingHorizontal: 16, marginBottom: 10 }]}>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between', alignItems: 'center',
                paddingVertical: 16,
            }}>
                <Text style={[{ color: theme.textPrimary }, Typography.semiBold20_28]}>
                    {t('products.transactionRequest.groupTitle')}
                </Text>
            </View>
            <View style={{
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: theme.surfaceOnBg,
            }}>
                {!!tonXRequest && (
                    <>
                        <TonXRequestButton
                            key={`ton-x-req`}
                            request={tonXRequest}
                            divider={tonconnectRequests.length > 0}
                        />
                    </>
                )}
                {tonconnectRequests.map((r, index) => {
                    return (
                        <TonConnectRequestButton
                            key={`tonconnect-req-${index}`}
                            request={r}
                            divider={index < tonconnectRequests.length - 1}
                            isTestnet
                        />
                    );
                })}
            </View>
        </View>
    );
});
DappsRequests.displayName = 'DappsRequests';