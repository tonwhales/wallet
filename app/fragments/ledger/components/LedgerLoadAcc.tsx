import React, { useEffect, useLayoutEffect, useState } from "react";
import { View, Text, Alert, Platform, LayoutAnimation } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "ton";
import { TonTransport } from "ton-ledger";
import { AppConfig } from "../../../AppConfig";
import { RoundButton } from "../../../components/RoundButton";
import { WalletAddress } from "../../../components/WalletAddress";
import { t } from "../../../i18n/t";
import { Theme } from "../../../Theme";
import { pathFromAccountNumber } from "../../../utils/pathFromAccountNumber";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";

export const LedgerLoadAcc = React.memo((
    {
        account,
        device,
        reset
    }: {
        account: number,
        device: TonTransport,
        reset: () => void
    }) => {
    const safeArea = useSafeAreaInsets();
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
        [device, account, address],
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

    useLayoutEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [address]);

    return (
        <View style={{ flexGrow: 1 }}>
            <View style={{
                backgroundColor: Theme.item,
                borderRadius: 14,
                marginTop: 17,
                marginHorizontal: 16,
                padding: 16,
            }}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    marginVertical: 8
                }}>
                    {t('hardwareWallet.actions.account', { account: account })}
                </Text>
                {!address && (
                    <Text
                        style={{
                            fontSize: 16,
                            color: Theme.textColor,
                            fontVariant: ['tabular-nums'],
                            fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
                            textAlign: 'left',
                            fontWeight: '500',
                            lineHeight: 20,
                            marginBottom: 12,
                        }}
                        selectable={false}
                        ellipsizeMode={'middle'}
                        numberOfLines={1}
                    >
                        {'...'}
                    </Text>
                )}
                {address && (
                    <WalletAddress
                        address={Address.parse(address.address)}
                        textProps={{ numberOfLines: undefined }}
                        textStyle={{
                            textAlign: 'left',
                            fontWeight: '500',
                            fontSize: 16,
                            lineHeight: 20
                        }}
                        style={{
                            width: undefined,
                            marginTop: undefined,
                            marginBottom: 12,
                        }}
                        previewBackgroundColor={Theme.item}
                    />
                )}
                <Text style={{
                    color: Theme.textColor,
                    fontWeight: '400',
                    fontSize: 16,
                }}>
                    {t('hardwareWallet.openAppVerifyAddress')}
                </Text>
            </View>

            <RoundButton
                title={t('hardwareWallet.actions.loadAddress')}
                action={onLoadAccount}
                disabled={!address}
                style={{
                    position: 'absolute',
                    bottom: safeArea.bottom + 16, left: 16, right: 16,
                    margin: 4
                }}
            />
        </View>
    );
});