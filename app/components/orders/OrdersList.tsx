import { memo } from "react";
import { View } from "react-native";
import { OrderItemView } from "./OrderItemView";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useChangellyTransactions } from "../../engine/hooks/changelly/useChangellyTransactions";
import { ChangellyTransactionModel } from "../../engine/api/changelly/fetchChangellyUserTransactions";

export const OrdersList = memo(() => {
    const { data: orders } = useChangellyTransactions();

    const navigation = useTypedNavigation();

    if (!orders || orders.length <= 0) {
        return null;
    }

    const onOrderPress = (order: ChangellyTransactionModel) => {
        navigation.navigateChangellyOrder({
            changellyTransaction: order
        });
    };

    return (
        <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 16 }}>
            {(orders).map((order) => (
                <OrderItemView
                    key={order.id}
                    order={order}
                    onPress={onOrderPress}
                />
            ))}
        </View>
    );
});

OrdersList.displayName = 'OrdersList';