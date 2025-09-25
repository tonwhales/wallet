import { memo } from "react";
import { View, Text } from "react-native";
import { useAddressConfirmationRequest, useTheme } from "../../../../engine/hooks";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { RoundButton } from "../../../../components/RoundButton";
import { t } from "../../../../i18n/t";
import { RoundButtonDisplay } from "../../../../components/roundButtonDisplays";

type Props = { address?: string }

function RequestView({ address }: Props) {
    const { sendRequest, status } = useAddressConfirmationRequest(address);
    const theme = useTheme();

    let title = 'Request confirmation';
    let buttonDisplay: RoundButtonDisplay = 'pro';

    switch (status) {
        case 'pending':
            title = t('walletRequests.pending');
            buttonDisplay = 'pro';
            break;
        case 'confirmed':
            title = t('walletRequests.confirmed');
            buttonDisplay = 'success';
            break;
        case 'declined':
            title = t('walletRequests.declined');
            buttonDisplay = 'warning';
            break;
        case 'expired':
            title = t('walletRequests.expired');
            buttonDisplay = 'warning';
            break;
    }

    return (
        <View style={{
            marginVertical: 16,
            gap: 16,
        }}>
            <RoundButton
                disabled={status !== 'not-requested'}
                overrideDisabledDisplay={true}
                title={title}
                action={sendRequest}
                display={buttonDisplay}
            />
            {status === 'not-requested' && (
                <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
                    <Text style={{ color: theme.textSecondary, fontSize: 16, fontWeight: '600' }}>
                        {t('walletRequests.description')}
                    </Text>
                </Animated.View>
            )}
        </View>
    );
}

export const AddressConfirmationRequest = memo(({ address }: Props) => {

    if (!address) {
        return null;
    }

    return (
        <View>
            <RequestView address={address} />
        </View>
    );
});