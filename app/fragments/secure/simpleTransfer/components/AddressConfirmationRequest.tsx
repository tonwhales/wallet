import { memo } from "react";
import { View, Text } from "react-native";
import { useAddressConfirmationRequest, useNetwork, useTheme } from "../../../../engine/hooks";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { RoundButton } from "../../../../components/RoundButton";
import { Address } from "@ton/core";
import { t } from "../../../../i18n/t";
import { RoundButtonDisplay } from "../../../../components/roundButtonDisplays";

type Props = {
    address?: string;
}

function RequestView({ address }: { address: string }) {
    const { requestId, sendRequest, status, reset } = useAddressConfirmationRequest(address);
    const theme = useTheme();
    const { isTestnet } = useNetwork();

    const formatted = Address.parse(address).toString({ testOnly: isTestnet });

    let title = 'Request confirmation';
    let buttonDisplay: RoundButtonDisplay = 'pro';

    switch (status) {
        case 'pending':
            title = 'Wating for confirmation...';
            buttonDisplay = 'pro';
            break;
        case 'confirmed':
            title = 'Address confirmed!';
            buttonDisplay = 'success';
            break;
        case 'declined':
            title = 'Request declined';
            buttonDisplay = 'warning';
            break;
        case 'expired':
            title = 'Request expired';
            buttonDisplay = 'warning';
            break;
    }

    return (
        <View style={{
            marginVertical: 16,
            gap: 16,
        }}>
            <RoundButton
                // title={t('walletRequests.request')}
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
        <Animated.View>
            <RequestView address={address} />
        </Animated.View>
    );
});