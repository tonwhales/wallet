import { HoldersAppFragment } from "../HoldersAppFragment";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Platform, View } from "react-native";
import { HoldersAppParamsType } from "../HoldersAppFragment";
import { useRoute } from "@react-navigation/native";
import { useEnrolledAndReady, useNetwork } from "../../../engine/hooks";
import { holdersUrl } from "../../../engine/api/holders/fetchUserState";
import { HoldersLandingComponent } from "./HoldersLandingComponent";

export const HoldersSettings = () => {
    const bottomBarHeight = useBottomTabBarHeight();
    const route = useRoute();
    const ledger = route.name.startsWith('Ledger');
    const { isTestnet } = useNetwork();

    const isReady = useEnrolledAndReady();

    return (
        <View style={{ marginBottom: Platform.OS === 'ios' ? bottomBarHeight : 0, flex: 1 }}>
            {isReady ? (
                <HoldersAppFragment initialParams={{ type: HoldersAppParamsType.Settings, ledger }} />
            ) : (
                <HoldersLandingComponent
                    endpoint={holdersUrl(isTestnet)}
                    onEnrollType={{ type: HoldersAppParamsType.Settings }}
                    isLedger={ledger}
                />
            )}
        </View>
    )
};