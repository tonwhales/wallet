import React, { useEffect, useState } from "react";
import { View, Text, Alert } from "react-native";
import { TonTransport } from "ton-ledger";
import { AppConfig } from "../../AppConfig";
import { RoundButton } from "../../components/RoundButton";
import { t } from "../../i18n/t";
import { Theme } from "../../Theme";
import { pathFromAccountNumber } from "../../utils/pathFromAccountNumber";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

export const LedgerLoadAccComponent = React.memo((
    {
        account,
        device,
        reset
    }: {
        account: number,
        device: TonTransport,
        reset: () => void
    }) => {
    const [address, setAddress] = useState<{ address: string, publicKey: Buffer }>();
    const navigation = useTypedNavigation();

    const onLoadAccount = React.useCallback(
        (async () => {
            if (!device) {
                Alert.alert(t('hardwareWallet.errors.noDevice'));
                reset();
                return;
            }
            if (account === null) {
                reset();
                return;
            }
            if (!address) {
                reset();
                return;
            }
            let path = pathFromAccountNumber(account);
            try {
                await device.validateAddress(path, { testOnly: AppConfig.isTestnet });
                navigation.navigateLedgerApp({ account, address, device });
            } catch (e) {
                console.warn(e);
                reset();
            }
        }),
        [device, account],
    );

    useEffect(() => {
        (async () => {
            if (!device) {
                Alert.alert(t('hardwareWallet.errors.noDevice'));
                return;
            }
            if (account === null) {
                return;
            }
            const path = pathFromAccountNumber(account);
            const address = await device.getAddress(path, { testOnly: AppConfig.isTestnet });
            setAddress(address);
        })();
    }, []);


    return (
        <View style={{
            marginHorizontal: 16,
            marginBottom: 16, marginTop: 17,
            backgroundColor: Theme.item,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
            flexGrow: 1,
        }}>
            <Text style={{
                fontWeight: '600',
                fontSize: 18,
                color: Theme.textColor,
                marginBottom: 16
            }}>
                {t('hardwareWallet.openAppVerifyAddress')}
            </Text>

            <Text style={{
                fontWeight: '600',
                fontSize: 18,
                color: Theme.textColor,
                marginBottom: 16
            }}>
                {address ? address.address : '...'}
            </Text>
            <RoundButton
                title={t('hardwareWallet.actions.loadAddress')}
                action={onLoadAccount}
                style={{
                    width: '100%',
                    margin: 4
                }}
            />
        </View>
    );
});