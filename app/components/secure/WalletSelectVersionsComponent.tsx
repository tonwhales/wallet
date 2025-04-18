import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { t } from "../../i18n/t";
import { useAppState, useNetwork, useTheme } from "../../engine/hooks";
import { Typography } from "../styles";
import { RoundButton } from "../RoundButton";
import { LinearGradient } from 'expo-linear-gradient';
import { contractFromPublicKey } from "../../engine/contractFromPublicKey";
import { mnemonicToWalletKey } from "@ton/crypto";
import { ellipsiseAddress } from "../address/WalletAddress";
import { clients } from "../../engine/clients";
import { Address, fromNano } from "@ton/core";
import { getLastBlock } from "../../engine/accountWatcher";
import { warn } from "../../utils/log";
import { WalletVersions } from "../../engine/types";

import IcCheck from "@assets/ic-check.svg";

type WalletAddress = string;

type WalletBalances = { [key in WalletAddress]: string };

type WalletAddressVersion = {
    version: WalletVersions;
    address: string;
}

async function fetchBalance(address: WalletAddress, isTestnet: boolean) {
    try {
        const client = clients.ton[isTestnet ? 'testnet' : 'mainnet'];
        const last = await getLastBlock();
        const data = await client.getAccountLite(last, Address.parse(address));
        return data?.account ? BigInt(data.account.balance.coins) : BigInt(0);
    } catch (err) {
        warn(`fetchBalance error: ${err}`);
        return BigInt(0);
    }
}

export const WalletSelectVersionsComponent = React.memo((props: {
    onContinue: (versions: WalletVersions[]) => void,
    mnemonics: string,
}) => {
    const { onContinue, mnemonics } = props;
    const theme = useTheme();
    const appState = useAppState();
    const { isTestnet } = useNetwork();
    const [addresses, setAddresses] = useState<WalletAddressVersion[]>([]);
    const [balances, setBalances] = useState<WalletBalances>({});
    const [selected, setSelected] = useState<WalletVersions[]>([
        WalletVersions.v5R1,
        WalletVersions.v4R2
    ]);

    const handleContinue = useCallback(async () => {
        if (selected.length === 0) {
            Alert.alert(t('wallets.noVersionTitle'), t('wallets.noVersionDescription'))
        } else {
            onContinue(selected);
        }
    }, [onContinue, selected]);

    const toggleVersion = useCallback((version: WalletVersions) => () => {
        setSelected((selected) => {
            const updatedSelected = [...selected];

            if (selected.includes(version)) {
                updatedSelected.splice(selected.indexOf(version), 1)
            } else {
                updatedSelected.push(version);
            }

            return updatedSelected;
        })
    }, [setSelected]);

    useEffect(() => {
        mnemonicToWalletKey(mnemonics.split(' ')).then(({ publicKey }) => {
            const addresses = [WalletVersions.v5R1, WalletVersions.v4R2].map((version) => {
                const contract = contractFromPublicKey(publicKey, version, isTestnet);
                const address = contract.address.toString({
                    testOnly: isTestnet,
                    bounceable: false
                });

                return { address, version };
            });

            const currentAddresses = appState.addresses.map((wallet: any) => {
                const parsedAddressFriendly = wallet.address.toString({
                    testOnly: isTestnet,
                    bounceable: false
                });

                return parsedAddressFriendly
            })
            const newAddresses = addresses.filter(addr => !currentAddresses.includes(addr.address));
            setAddresses(newAddresses);

            newAddresses.forEach(async (item) => {
                const balance = await fetchBalance(item.address, isTestnet);
                setBalances((balances) => ({ ...balances, [item.address]: fromNano(balance) }));
            });
        });
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <Text style={[{ color: theme.textPrimary, textAlign: 'center', marginBottom: 24, marginTop: 11 }, Typography.semiBold32_38]}>
                {t('wallets.choose_versions')}
            </Text>
            {addresses.map((item) => (
                <TouchableOpacity
                    key={item.version}
                    style={[styles.item, { backgroundColor: theme.surfaceOnBg }]}
                    onPress={toggleVersion(item.version)}
                    activeOpacity={0.6}
                >
                    <View style={styles.leftContent}>
                        <View style={{ flexDirection: 'row' }}>
                            <Text style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}>
                                {ellipsiseAddress(item.address, { start: 4, end: 4 })}
                            </Text>
                            {item.version === WalletVersions.v5R1 ? (
                                <View style={[styles.label, { backgroundColor: theme.divider }]}>
                                    <LinearGradient
                                        style={styles.gradientW5}
                                        colors={['#F54927', '#FAA046']}
                                        start={[0, 1]}
                                        end={[1, 0]}
                                    />
                                    <Text style={[{ color: '#FFF' }, Typography.medium13_18]}>
                                        W5
                                    </Text>
                                </View>
                            ) : (
                                <View style={[styles.label, { backgroundColor: theme.divider }]}>
                                    <Text style={[{ color: theme.textSecondary }, Typography.medium13_18]}>
                                        {item.version}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text style={[{ color: theme.textSecondary }, Typography.regular15_20]}>
                            {balances[item.address] ?? '~'} TON
                        </Text>
                    </View>
                    <View style={{
                        justifyContent: 'center', alignItems: 'center',
                        height: 24, width: 24,
                        backgroundColor: selected.includes(item.version) ? theme.accent : theme.divider,
                        borderRadius: 6
                    }}>
                        {selected.includes(item.version) && (
                            <IcCheck color={'white'} height={16} width={16} style={{ height: 16, width: 16 }} />
                        )}
                    </View>
                </TouchableOpacity>
            ))}

            <View style={{ flexGrow: 1 }} />
            <View style={{ paddingHorizontal: 16 }}>
                <RoundButton
                    title={t('common.continue')}
                    action={handleContinue}
                />
            </View>
        </View>
    )
});

const styles = StyleSheet.create({
    item: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        padding: 20,
    },
    leftContent: {
        flex: 1
    },
    label: {
        paddingHorizontal: 8,
        paddingVertical: 1,
        marginLeft: 8,
        borderRadius: 20,
        height: 20,
    },
    gradientW5: {
        position: 'absolute',
        borderRadius: 20,
        left: 0,
        top: 0,
        height: 20,
        width: 37,
    },
});