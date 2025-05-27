import { Platform, View } from "react-native";
import { HoldersAppFragment } from "../holders/HoldersAppFragment";
import { HoldersAppParamsType } from "../holders/HoldersAppFragment";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useEnrolledAndReady, useIsLedgerRoute, useNetwork } from "../../engine/hooks";
import { HoldersLandingComponent } from "../holders/components/HoldersLandingComponent";
import { holdersUrl } from "../../engine/api/holders/fetchUserState";

export const HoldersTransactionsFragment = (() => {
    const bottomBarHeight = useBottomTabBarHeight();
    const ledger = useIsLedgerRoute();
    const { isTestnet } = useNetwork();

    const isReady = useEnrolledAndReady();

    return (
        <View style={{ marginBottom: Platform.OS === 'ios' ? bottomBarHeight : 0, flex: 1 }}>
            {isReady ? (
                <HoldersAppFragment initialParams={{
                    type: HoldersAppParamsType.Transactions,
                    query: {},
                    ledger
                }} />
            ) : (
                <HoldersLandingComponent
                    endpoint={holdersUrl(isTestnet)}
                    onEnrollType={{ type: HoldersAppParamsType.Transactions, query: {} }}
                    isLedger={ledger}
                />
            )}
        </View>
    )
});