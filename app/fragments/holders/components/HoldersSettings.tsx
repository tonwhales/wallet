import { HoldersAppFragment } from "../HoldersAppFragment";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Platform, View } from "react-native";
import { HoldersAppParamsType } from "../HoldersAppFragment";
export const HoldersSettings = () => {
    const bottomBarHeight = useBottomTabBarHeight();

    return (
        <View style={{ marginBottom: Platform.OS === 'ios' ? bottomBarHeight : 0, flex: 1 }}>
            <HoldersAppFragment initialParams={{ type: HoldersAppParamsType.Settings }} />
        </View>
    )
};