import { memo } from "react";
import { View, Text } from "react-native";
import { useConnectPendingRequests, useNetwork, useTheme } from "../../../engine/hooks";
import { t } from "../../../i18n/t";
import { Typography } from "../../../components/styles";
import { TonConnectTxRequestButton } from "../views/tonconnect/TonConnectTxRequestButton";
import { TonConnectSignRequestButton } from "../views/tonconnect/TonConnectSignRequestButton";

export const DappsRequests = memo(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const [tonconnectRequests] = useConnectPendingRequests();

    if (tonconnectRequests.length === 0) {
        return null;
    }

    const lastThreeRequests = tonconnectRequests.slice(-3);

    return (
        <View style={[{ paddingHorizontal: 16, marginTop: 16 }]}>
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
                {lastThreeRequests.map((r, index) => {
                    if (r.method === 'sendTransaction') {
                        return (
                            <TonConnectTxRequestButton
                                key={`tonconnect-req-${index}`}
                                request={r}
                                divider={index < lastThreeRequests.length - 1}
                                isTestnet={isTestnet}
                            />
                        );
                    } else if (r.method === 'signData') {
                        return (
                            <TonConnectSignRequestButton
                                key={`tonconnect-req-${index}`}
                                request={r}
                            />
                        );
                    }
                })}
            </View>
        </View>
    );
});
DappsRequests.displayName = 'DappsRequests';