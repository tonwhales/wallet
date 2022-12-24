import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "ton";
import { TonTransport } from "ton-ledger";
import { AppConfig } from "../../../AppConfig";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { RoundButton } from "../../../components/RoundButton";
import { WalletAddress } from "../../../components/WalletAddress";
import { t } from "../../../i18n/t";
import { Theme } from "../../../Theme";
import { pathFromAccountNumber } from "../../../utils/pathFromAccountNumber";

export const LedgerSelectAccount = React.memo(({
    onSelect,
    device
}: {
    onSelect: (account: number) => void,
    device: TonTransport,
}) => {
    const safeArea = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<{ i: number, addr: { address: string, publicKey: Buffer } }[]>([]);

    useEffect(() => {
        (async () => {
            const proms: Promise<{ i: number, addr: { address: string, publicKey: Buffer } }>[] = [];
            for (let i = 0; i < 10; i++) {
                proms.push((async () => {
                    const path = pathFromAccountNumber(i);
                    const addr = await device.getAddress(path, { testOnly: AppConfig.isTestnet });
                    return { i, addr };
                })());
            }
            const res = await Promise.all(proms);
            setAccounts(res);
            setLoading(false);
        })();
    }, []);

    return (
        <View style={{
            flex: 1,
        }}>
            <Text style={{
                fontWeight: '600',
                fontSize: 18,
                color: Theme.textColor,
                marginBottom: 16,
                textAlign: 'center',
                marginHorizontal: 16
            }}>
                {t('hardwareWallet.chooseAccountDescription')}
            </Text>
            <ScrollView
                contentInset={{ top: 0, bottom: safeArea.bottom + 16 }}
                contentOffset={{ y: 16 + safeArea.top, x: 0 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
            >
                {loading && (
                    <LoadingIndicator simple />
                )}
                {accounts.map((acc) => {
                    return (
                        <View key={acc.i} style={{
                            marginVertical: 4,
                            backgroundColor: Theme.item,
                            borderRadius: 14,
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 16,
                        }}>
                            <WalletAddress
                                address={Address.parse(acc.addr.address)}
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
                                    marginBottom: 4,
                                    alignSelf: 'flex-start'
                                }}
                                previewBackgroundColor={Theme.item}
                            />
                            <RoundButton
                                title={t('hardwareWallet.actions.account', { account: acc.i })}
                                onPress={() => onSelect(acc.i)}
                                style={{
                                    width: '100%',
                                    margin: 4
                                }}
                            />
                        </View>
                    )
                })}
            </ScrollView>
        </View>
    );
});