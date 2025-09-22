import { memo, useCallback } from "react";
import { WalletRequest } from "../../engine/WalletRequestsWatcher";
import { Pressable, View, Text } from "react-native";
import { useCurrentAddress, useNetwork, useTheme } from "../../engine/hooks";
import { respondWalletRequest } from "../../engine/api/requests/respondWalletRequest";
import { useKeysAuth } from "../secure/AuthWalletKeys";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { t } from "../../i18n/t";

export const WalletRequestItem = memo(({ request }: { request: WalletRequest }) => {
    const theme = useTheme();
    const currentAddress = useCurrentAddress();
    const authWalletKeys = useKeysAuth();
    const { isTestnet } = useNetwork();

    const onAnswer = useCallback(async (answer: 'confirmed' | 'declined') => {
        const keys = await authWalletKeys.authenticate();
        const address = currentAddress.tonAddress.toString({ bounceable: false, testOnly: isTestnet });
        const res = await respondWalletRequest({
            keys,
            requestId: request.requestId,
            walletAddress: address,
            status: answer,
            isTestnet
        });
    }, [request, authWalletKeys, currentAddress]);

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
            style={{
                borderRadius: 20,
                padding: 20, gap: 20,
                margin: 20, marginBottom: 0,
                backgroundColor: theme.backgroundPrimary
            }}
        >
            <Text>
                {t('walletRequests.title')}
            </Text>
            <Text>
                {request.requestor}
            </Text>
            {request.message && (
                <Text>
                    {request.message}
                </Text>
            )}
            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'space-evenly', alignItems: 'center', width: '100%' }}>
                <Pressable
                    onPress={() => onAnswer('confirmed')}
                >
                    <Text>
                        {t('common.confirm')}
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => onAnswer('declined')}
                >
                    <Text>
                        {t('common.cancel')}
                    </Text>
                </Pressable>
            </View>
        </Animated.View>
    );
});