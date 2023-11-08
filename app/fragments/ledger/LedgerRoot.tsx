import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { TransportProvider } from "./components/TransportContext";
import { HardwareWalletFragment } from "./HardwareWalletFragment";
import { LedgerAppFragment } from "./LedgerAppFragment";
import { LedgerAssetsFragment } from "./LedgerAssetsFragment";
import { LedgerBleFragment } from "./LedgerBleFragment";
import { LedgerHIDFragment } from "./LedgerHIDFragment";
import { LedgerSignTransferFragment } from "./LedgerSignTransferFragment";
import { LedgerTransferFragment } from "./LedgerTransferFragment";
import { ReceiveFragment } from "../wallet/ReceiveFragment";
import { TransactionPreviewFragment } from "../wallet/TransactionPreviewFragment";

const Stack = createNativeStackNavigator();

function modalScreen(name: string, component: React.ComponentType<any>) {
    return (
        <Stack.Screen
            key={`modalScreen-${name}`}
            name={name}
            component={component}
            options={{ presentation: 'modal', headerShown: false }}
        />
    );
}

function lockedModalScreen(name: string, component: React.ComponentType<any>) {
    return (
        <Stack.Screen
            key={`modalScreen-${name}`}
            name={name}
            component={component}
            options={{ presentation: 'modal', headerShown: false, gestureEnabled: false }}
        />
    );
}

const ledgerNavigation = [
    modalScreen('HardwareWallet', HardwareWalletFragment),
    lockedModalScreen('LedgerHID', LedgerHIDFragment),
    lockedModalScreen('LedgerBle', LedgerBleFragment),
    lockedModalScreen('LedgerApp', LedgerAppFragment),
    modalScreen('LedgerTransfer', LedgerTransferFragment),
    modalScreen('LedgerReceive', ReceiveFragment),
    lockedModalScreen('LedgerSignTransfer', LedgerSignTransferFragment),
    modalScreen('LedgerTransactionPreview', TransactionPreviewFragment),
    modalScreen('LedgerAssets', LedgerAssetsFragment),
]

export const LedgerRoot = fragment(() => {

    return (
        <TransportProvider>
            <Stack.Navigator
                initialRouteName={'HardwareWallet'}
                screenOptions={{ headerBackTitle: t('common.back'), title: '', headerShadowVisible: false, headerTransparent: false, headerStyle: { backgroundColor: 'white' } }}
            >
                {ledgerNavigation}
            </Stack.Navigator>
        </TransportProvider>
    );
})