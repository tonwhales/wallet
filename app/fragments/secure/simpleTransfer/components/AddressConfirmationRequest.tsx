import { memo } from "react";
import { View } from "react-native";
import { useAddressConfirmationRequest, useNetwork, useTheme } from "../../../../engine/hooks";
import Animated from "react-native-reanimated";
import { RoundButton } from "../../../../components/RoundButton";
import { Address } from "@ton/core";

type Props = {
    address?: string;
}

function RequestView({ address }: { address: string }) {
    const { requestId, sendRequest, status, reset } = useAddressConfirmationRequest(address);
    const theme = useTheme();
    const { isTestnet } = useNetwork();

    const formatted = Address.parse(address).toString({ testOnly: isTestnet });

    return (
        <View style={{
            marginVertical: 16,
            gap: 16,
        }}>
            <RoundButton
                // title={t('walletRequests.request')}
                disabled={status === 'pending' ? true : false}
                title={'Request confirmation'}
                action={sendRequest}
                display={'pro'}
            />
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