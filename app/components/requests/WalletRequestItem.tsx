import { memo, useCallback } from "react";
import { WalletRequest } from "../../engine/WalletRequestsWatcher";
import { Pressable, View, Text } from "react-native";
import { useCurrentAddress, useNetwork, useTheme } from "../../engine/hooks";
import { respondWalletRequest } from "../../engine/api/requests/secure/respondWalletRequest";
import { useKeysAuth } from "../secure/AuthWalletKeys";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { t } from "../../i18n/t";
import { avatarColors } from "../avatar/Avatar";
import { AddressInputAvatar } from "../address/AddressInputAvatar";
import { AddressComponent } from "../address/AddressComponent";
import { Address } from "@ton/core";
import { avatarHash } from "../../utils/avatarHash";
import { walletRequestsState } from "../../engine/useWalletRequestsWatcher";
import { useRecoilState } from "recoil";
import { Typography } from "../styles";
import { RoundButton } from "../RoundButton";

export const WalletRequestItem = memo(({ request }: { request: WalletRequest }) => {
    const theme = useTheme();
    const { tonAddress } = useCurrentAddress();
    const authWalletKeys = useKeysAuth();
    const { isTestnet } = useNetwork();
    const addressKey = tonAddress.toString({ bounceable: false, testOnly: isTestnet }) || '';
    const [, setRequests] = useRecoilState(walletRequestsState(addressKey));

    const onAnswer = useCallback(async (answer: 'confirmed' | 'declined') => {
        const keys = await authWalletKeys.authenticate();
        try {
            const res = await respondWalletRequest({
                keys,
                requestId: request.requestId,
                walletAddress: addressKey,
                status: answer,
                isTestnet
            });
            setRequests(prev => {
                return prev.filter(r => r.requestId !== res.request.requestId);
            });
        } catch (error) {
            setRequests(prev => {
                return prev.filter(r => r.requestId !== request.requestId);
            });
        }
    }, [request, authWalletKeys, addressKey, setRequests]);

    const address = Address.parse(request.requestor).toString({ testOnly: isTestnet });
    const avatarColor = avatarColors[avatarHash(address, avatarColors.length)];

    return (
        <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
            style={{
                borderRadius: 20,
                padding: 20, gap: 12,
                margin: 20, marginBottom: 0,
                backgroundColor: theme.surfaceOnBg,
                overflow: 'hidden'
            }}
        >
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flexShrink: 1 }}>
                <AddressInputAvatar
                    size={38}
                    friendly={address}
                    theme={theme}
                    knownWallets={{}}
                    isOwn={false}
                    markContact={false}
                    avatarColor={avatarColor}
                />
                <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '600' }}>
                    <AddressComponent address={request.requestor} start={6} end={6} />
                </Text>
            </View>
            <Text style={[{ color: theme.textPrimary }, Typography.medium15_20]}>
                {t('walletRequests.title')}
            </Text>
            {request.message && (
                <Text>
                    {request.message}
                </Text>
            )}
            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <RoundButton
                    title={t('common.cancel')}
                    action={async () => {
                        await onAnswer('declined');
                    }}
                    display='secondary'
                    style={{ flex: 1, backgroundColor: theme.cardStackSecond }}
                    size='normal'
                />
                <RoundButton
                    title={t('common.confirm')}
                    action={async () => {
                        await onAnswer('confirmed');
                    }}
                    display={'success'}
                    size='normal'
                    style={{ flex: 1 }}
                />
            </View>
        </Animated.View>
    );
});