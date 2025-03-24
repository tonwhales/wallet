import { Platform, View } from "react-native";
import { HoldersAppFragment } from "../holders/HoldersAppFragment";
import { HoldersAppParamsType } from "../holders/HoldersAppFragment";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

export const HoldersTransactionsFragment = (() => {
    const bottomBarHeight = useBottomTabBarHeight();

    return (
        <View style={{ marginBottom: Platform.OS === 'ios' ? bottomBarHeight : 0, flex: 1 }}>
            <HoldersAppFragment initialParams={{
                type: HoldersAppParamsType.Transactions,
                query: {}
            }} />
        </View>
    )
});