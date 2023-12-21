import { memo } from "react";
import { View, Text } from "react-native";
import { useConnectPendingRequests, useCurrentJob, useTheme } from "../../../engine/hooks";
import { DappRequestButton } from "../views/DappRequestButton";
import { t } from "../../../i18n/t";

export const DappsRequests = memo(() => {
    const theme = useTheme();
    const [tonconnectRequests,] = useConnectPendingRequests();
    const [tonXRequest,] = useCurrentJob();

    if (!tonXRequest && tonconnectRequests.length === 0) {
        return null;
    }

    return (
        <View style={[{ paddingHorizontal: 16 }]}>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between', alignItems: 'center',
                marginTop: 20,
                paddingVertical: 12,
                marginBottom: 4,
            }}>
                <Text style={{
                    fontSize: 17,
                    fontWeight: '600',
                    color: theme.textPrimary,
                    lineHeight: 24,
                }}>
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
                        <DappRequestButton
                            key={`ton-x-req`}
                            type={'ton-x'}
                            request={tonXRequest}
                            divider={tonconnectRequests.length > 0}
                        />
                    </>
                )}
                {tonconnectRequests.map((r, index) => {
                    return (
                        <DappRequestButton
                            key={`tonconnect-req-${index}`}
                            type={'ton-connect'}
                            request={r}
                            divider={index < tonconnectRequests.length - 1}
                        />
                    );
                })}
            </View>
        </View>
    );
});