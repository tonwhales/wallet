import { memo } from "react";
import { useWalletRequestsWatcher } from "../../engine/useWalletRequestsWatcher";
import { View } from "react-native";
import { WalletRequestItem } from "./secure/WalletRequestItem";

export const WalletRequests = memo(() => {
    const { requests } = useWalletRequestsWatcher();

    const statusFilteredRequests = requests.filter(request => request.status === 'pending');

    if (statusFilteredRequests.length === 0) {
        return null;
    }

    return (
        <View>
            {statusFilteredRequests.map((request) => (
                <WalletRequestItem
                    key={request.requestId}
                    request={request}
                />
            ))}
        </View>
    );
});