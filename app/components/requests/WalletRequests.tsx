import { memo } from "react";
import { useWalletRequestsWatcher } from "../../engine/useWalletRequestsWatcher";
import { View } from "react-native";
import { WalletRequestItem } from "./WalletRequestItem";

export const WalletRequests = memo(() => {
    const { requests } = useWalletRequestsWatcher();

    if (requests.length === 0) {
        return null;
    }

    return (
        <View>
            {requests.map((request) => (
                <WalletRequestItem key={request.requestId} request={request} />
            ))}
        </View>
    );
});