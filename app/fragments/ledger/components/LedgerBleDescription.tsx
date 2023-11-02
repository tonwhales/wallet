import React from "react";
import { View, Image, Text, Platform } from "react-native";
import { useTheme } from '../../../engine/hooks/theme/useTheme';
import { t } from "../../../i18n/t";
import { RoundButton } from "../../../components/RoundButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const LedgerBleDescription = React.memo(({ onScan }: { onScan: () => void }) => {
    const theme = useTheme();
    const safeArea = useSafeAreaInsets();

    return (
        <>
            <View style={{
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 16,
                flexGrow: 1,
            }}>
                <View style={{ flexGrow: 1 }} />
                <Image style={{ width: 204, height: 204 }}
                    source={require('../../../../assets/ic_ledger_x.png')}
                />
                <Text style={{
                    color: theme.textColor,
                    fontWeight: '700',
                    fontSize: 20,
                    marginBottom: 32,
                    marginHorizontal: 16,
                    marginTop: 16
                }}>
                    {t('hardwareWallet.actions.connect')}
                </Text>
                <View style={{ justifyContent: 'center' }}>
                    <Text style={{
                        color: theme.textColor,
                        fontWeight: '400',
                        fontSize: 16,
                        marginBottom: 12,
                    }}>
                        {t('hardwareWallet.bluetoothScanDescription_1')}
                    </Text>
                    <Text style={{
                        color: theme.textColor,
                        fontWeight: '400',
                        fontSize: 16,
                        marginBottom: 12,
                    }}>
                        {t('hardwareWallet.bluetoothScanDescription_2')}
                    </Text>
                    <Text style={{
                        color: theme.textColor,
                        fontWeight: '400',
                        fontSize: 16,
                        marginBottom: 12,
                    }}>
                        {t(`hardwareWallet.bluetoothScanDescription_3${Platform.OS === 'android' ? '_and' : ''}`)}
                    </Text>
                    {Platform.OS === 'android' && (
                        <Text style={{
                            color: theme.textColor,
                            fontWeight: '400',
                            fontSize: 16,
                            marginBottom: 12,
                        }}>
                            {t('hardwareWallet.bluetoothScanDescription_4_and')}
                        </Text>
                    )}
                </View>
                <View style={{ flexGrow: 1 }} />
            </View>
            <RoundButton
                title={t('hardwareWallet.actions.scanBluetooth')}
                onPress={onScan}
                style={{
                    marginBottom: safeArea.bottom + 16,
                    marginHorizontal: 16,
                }}
            />
        </>
    );
});