import { Platform, View } from "react-native";
import { HoldersAppFragment } from "../holders/HoldersAppFragment";
import { HoldersAppParamsType } from "../holders/HoldersAppFragment";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRoute } from "@react-navigation/native";
export const HoldersTransactionsFragment = (() => {
    const bottomBarHeight = useBottomTabBarHeight();
    const route = useRoute();
    const ledger = route.name.startsWith('Ledger');

    return (
        <View style={{ marginBottom: Platform.OS === 'ios' ? bottomBarHeight : 0, flex: 1 }}>
            <HoldersAppFragment initialParams={{
                type: HoldersAppParamsType.Transactions,
                query: {},
                ledger
            }} />
        </View>
    )
});