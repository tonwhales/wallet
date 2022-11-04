import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import { Platform, View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AndroidToolbar } from "../../components/AndroidToolbar";
import { CloseButton } from "../../components/CloseButton";
import { fragment } from "../../fragment";
import { t } from "../../i18n/t";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useEngine } from "../../engine/Engine";
import { Theme } from "../../Theme";
import { RoundButton } from "../../components/RoundButton";
import LedgerIcon from '../../../assets/ic_ledger.svg';
import { LedgerHIDComponent } from "./LedgerHIDComponent";
import { LedgerBluetoothComponent } from "./LedgerBluetoothComponent";

export const HardwareWalletFragment = fragment(() => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const engine = useEngine();
    const [connection, setConnection] = useState<'hid' | 'bluetooth' | null>(Platform.OS === 'android' ? null : 'bluetooth');

    const onReset = useCallback(
        () => {
            setConnection(null);
        },
        [],
    );

    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? safeArea.top : undefined,
        }}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
            <AndroidToolbar pageTitle={t('hardwareWallet.title')} />
            {Platform.OS === 'ios' && (
                <View style={{
                    marginTop: 12,
                    height: 32
                }}>
                    <Text style={[{
                        fontWeight: '600',
                        marginLeft: 17,
                        fontSize: 17
                    }, { textAlign: 'center' }]}>
                        {t('hardwareWallet.title')}
                    </Text>
                </View>
            )}
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                style={{
                    flexGrow: 1,
                    backgroundColor: Theme.background,
                    flexBasis: 0,
                    marginBottom: safeArea.bottom
                }}
            >
                {!connection && (
                    <View style={{
                        marginHorizontal: 16,
                        marginBottom: 16, marginTop: 17,
                        backgroundColor: Theme.item,
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 16
                    }}>
                        <LedgerIcon
                            color={'black'}
                            width={64}
                            height={64}
                            style={{
                                margin: 16
                            }}
                        />
                        {/* TODO: install TON app for Ledger description text */}
                        <Text style={{
                            color: Theme.textColor,
                            fontWeight: '600',
                            fontSize: 18,
                            marginBottom: 12,
                            textAlign: 'center'
                        }}>
                            {Platform.OS === 'android' && t('hardwareWallet.connectionDescriptionAndroid')}
                            {Platform.OS === 'ios' && t('hardwareWallet.connectionDescriptionIOS')}
                        </Text>
                        {!connection && Platform.OS === 'android' && (
                            <>
                                <RoundButton
                                    title={t('hardwareWallet.actions.connectHid')}
                                    onPress={() => setConnection('hid')}
                                    style={{
                                        width: '100%',
                                        marginHorizontal: 16,
                                        marginVertical: 4
                                    }}
                                />
                                <RoundButton
                                    title={t('hardwareWallet.actions.connectBluetooth')}
                                    onPress={() => setConnection('bluetooth')}
                                    style={{
                                        width: '100%',
                                        marginHorizontal: 16,
                                        marginVertical: 4
                                    }}
                                />
                            </>
                        )}
                    </View>
                )}
                {connection === 'hid' && Platform.OS === 'android' && (
                    <LedgerHIDComponent onReset={onReset} />
                )}
                {connection === 'bluetooth' && (
                    <LedgerBluetoothComponent onReset={Platform.OS === 'android' ? onReset : undefined} />
                )}
            </ScrollView>
            {Platform.OS === 'ios' && (
                <CloseButton
                    style={{ position: 'absolute', top: 12, right: 10 }}
                    onPress={() => {
                        navigation.goBack();
                    }}
                />
            )}
        </View>
    );
});