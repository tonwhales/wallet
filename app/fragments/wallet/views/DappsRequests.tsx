import { memo, useCallback } from "react";
import { Pressable, View, Text } from "react-native";
import Animated, { Layout } from "react-native-reanimated";
import { t } from "../../../i18n/t";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { getConnectionReferences } from "../../../storage/appState";
import { extractDomain } from "../../../engine/utils/extractDomain";
import { useAnimatedPressedInOut } from "../../../utils/useAnimatedPressedInOut";
import { useConnectCallback, useConnectPendingRequests, useCurrentJob, useNetwork, usePrepareConnectRequest, useTheme } from "../../../engine/hooks";

export const DappsRequests = memo(() => {
    const navigation = useTypedNavigation();
    const theme = useTheme();
    const network = useNetwork();
    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    const [tonconnectRequests,] = useConnectPendingRequests();
    const [tonXRequest,] = useCurrentJob();
    const prepareConnectRequest = usePrepareConnectRequest();
    const connectCallback = useConnectCallback();

    const onPress = useCallback(() => {
        if (tonXRequest) {
            if (tonXRequest.job.type === 'transaction') {
                navigation.navigateTransfer({
                    order: {
                        type: 'order',
                        messages: [{
                            target: tonXRequest.job.target.toString({ testOnly: network.isTestnet }),
                            amount: tonXRequest.job.amount,
                            payload: tonXRequest.job.payload,
                            stateInit: tonXRequest.job.stateInit,
                            amountAll: false
                        }]
                    },
                    job: tonXRequest.jobRaw,
                    text: tonXRequest.job.text,
                    callback: null
                });
            } else {
                const connection = getConnectionReferences().find((v) => Buffer.from(v.key, 'base64').equals(tonXRequest.key));
                if (!connection) {
                    return; // Just in case
                }
                navigation.navigateSign({
                    text: tonXRequest.job.text,
                    textCell: tonXRequest.job.textCell,
                    payloadCell: tonXRequest.job.payloadCell,
                    job: tonXRequest.jobRaw,
                    callback: null,
                    name: connection.name
                });
            }
        } else if (tonconnectRequests.length > 0) {
            const request = tonconnectRequests[0];
            const prepared = prepareConnectRequest(request);
            if (request.method === 'sendTransaction' && prepared) {
                navigation.navigateTransfer({
                    text: null,
                    order: {
                        type: 'order',
                        messages: prepared.messages,
                        app: (prepared.app && prepared.app) ? {
                            title: prepared.app.name,
                            domain: extractDomain(prepared.app.url),
                        } : undefined
                    },
                    job: null,
                    callback: (ok, result) => connectCallback(ok, result, prepared.request, prepared.sessionCrypto)
                })
            }
        }
    }, [tonXRequest, tonconnectRequests]);

    if (!tonXRequest && tonconnectRequests.length === 0) {
        return null;
    }

    let title = t('products.transactionRequest.title');

    if (tonXRequest?.job.type === 'sign') {
        title = title + '/' + t('products.signatureRequest.title');
    }

    return (
        <Animated.View
            layout={Layout.duration(300)}
            style={[{ paddingHorizontal: 16, marginTop: 24 }, animatedStyle]}
        >
            <Pressable
                style={{
                    flex: 1,
                    backgroundColor: theme.border,
                    borderRadius: 20,
                    padding: 20,
                    flexDirection: 'row',
                    alignItems: 'center'
                }}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={onPress}
            >
                <View style={{ flexGrow: 1 }}>
                    <Text style={{
                        fontSize: 17, lineHeight: 24,
                        fontWeight: '600',
                        color: theme.textPrimary,
                        marginBottom: 2
                    }}>
                        {title}
                    </Text>
                    <Text style={{
                        fontSize: 15, lineHeight: 20,
                        fontWeight: '400',
                        color: theme.textSecondary,
                    }}>
                        {t('products.transactionRequest.subtitle')}
                    </Text>
                </View>
                <View style={{
                    backgroundColor: theme.accentRed,
                    borderRadius: 20,
                    justifyContent: 'center', alignItems: 'center',
                    paddingHorizontal: 8, paddingVertical: 3,
                    flexShrink: 1
                }}>
                    <Text style={{
                        flexShrink: 1,
                        color: theme.white,
                        fontSize: 13,
                        fontWeight: '500',
                        lineHeight: 18,
                    }}>
                        {tonconnectRequests.length + (tonXRequest ? 1 : 0)}
                    </Text>
                </View>
            </Pressable>
        </Animated.View>
    );
});