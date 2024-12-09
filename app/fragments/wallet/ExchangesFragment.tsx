import React, {  } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fragment } from "../../fragment";
import { View, Platform } from "react-native";
import { useParams } from "../../utils/useParams";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useNetwork, useTheme } from "../../engine/hooks";
import { StatusBar } from "expo-status-bar";
import { GeneralHoldersAccount } from "../../engine/api/holders/fetchAccounts";

export type ExchangesFragmentParams = {
    holdersAccount: GeneralHoldersAccount
}

export const ExchangesFragment = fragment(() => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const { holdersAccount } = useParams<ExchangesFragmentParams>();

    return (
        <View
            style={{
                flexGrow: 1,
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
            }}
            collapsable={false}
        >
            <StatusBar style={Platform.select({ android: theme.style === 'dark' ? 'light' : 'dark', ios: 'light' })} />
            {/* TODO: Receive webview */}
        </View>
    );
});