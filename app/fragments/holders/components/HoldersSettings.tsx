import { HoldersAppFragment } from "../HoldersAppFragment";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Platform, View } from "react-native";
import { HoldersAppParamsType } from "../HoldersAppFragment";
import { useRoute } from "@react-navigation/native";

export const HoldersSettings = () => {
    const bottomBarHeight = useBottomTabBarHeight();
    const route = useRoute();
    const ledger = route.name.startsWith('Ledger');

    return (
        <View style={{ marginBottom: Platform.OS === 'ios' ? bottomBarHeight : 0, flex: 1 }}>
            <HoldersAppFragment initialParams={{ type: HoldersAppParamsType.Settings, ledger }} />
        </View>
    )
};