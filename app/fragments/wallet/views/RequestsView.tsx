import { memo, useCallback } from "react";
import { Pressable, View, Text } from "react-native";
import Animated, { Layout } from "react-native-reanimated";
import { useAppConfig } from "../../../utils/AppConfigContext";
import { t } from "../../../i18n/t";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { getConnectionReferences } from "../../../storage/appState";
import { useEngine } from "../../../engine/Engine";
import { prepareTonConnectRequest, tonConnectTransactionCallback } from "../../../engine/tonconnect/utils";
import { extractDomain } from "../../../engine/utils/extractDomain";
import { useAnimatedPressedInOut } from "../../../utils/useAnimatedPressedInOut";

export const RequestsView = memo(() => {
    const engine = useEngine();
    const tonXRequest = engine.products.apps.useState();
    const tonconnectRequests = engine.products.tonConnect.usePendingRequests();
    const navigation = useTypedNavigation();
    const { Theme, AppConfig } = useAppConfig();
    const { onPressIn, onPressOut, animatedStyle } = useAnimatedPressedInOut();

    const onPress = useCallback(() => {
        if (tonXRequest) {
            if (tonXRequest.job.type === 'transaction') {
                navigation.navigateTransfer({
                    order: {
                        messages: [{
                            target: tonXRequest.job.target.toFriendly({ testOnly: AppConfig.isTestnet }),
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
            const prepared = prepareTonConnectRequest(request, engine);
            if (request.method === 'sendTransaction' && prepared) {
                navigation.navigateTransfer({
                    text: null,
                    order: {
                        messages: prepared.messages,
                        app: (prepared.app && prepared.app.connectedApp) ? {
                            title: prepared.app.connectedApp.name,
                            domain: extractDomain(prepared.app.connectedApp.url),
                        } : undefined
                    },
                    job: null,
                    callback: (ok, result) => tonConnectTransactionCallback(ok, result, prepared.request, prepared.sessionCrypto, engine)
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
            style={[{paddingHorizontal: 16, marginTop: 24}, animatedStyle]}
        >
            <Pressable
                style={{
                    flex: 1,
                    backgroundColor: Theme.lightGrey,
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
                        color: Theme.textColor,
                        marginBottom: 2
                    }}>
                        {title}
                    </Text>
                    <Text style={{
                        fontSize: 15, lineHeight: 20,
                        fontWeight: '400',
                        color: Theme.darkGrey,
                    }}>
                        {t('products.transactionRequest.subtitle')}
                    </Text>
                </View>
                <View style={{
                    backgroundColor: Theme.red,
                    borderRadius: 20,
                    justifyContent: 'center', alignItems: 'center',
                    paddingHorizontal: 8, paddingVertical: 3,
                    flexShrink: 1
                }}>
                    <Text style={{
                        flexShrink: 1,
                        color: Theme.white,
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