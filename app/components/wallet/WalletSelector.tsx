import React, { memo, useCallback, useMemo } from "react";
import { View, Text, Pressable, Image, Alert, FlatList } from "react-native";
import { ellipsiseAddress } from "../address/WalletAddress";
import { WalletItem } from "./WalletItem";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { useAppState, useBounceableWalletFormat, useNetwork, useTheme } from "../../engine/hooks";
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";
import { Address } from "@ton/core";
import { t } from "../../i18n/t";
import { useNavigationState } from "@react-navigation/native";
import { KnownWallets } from "../../secure/KnownWallets";
import { SelectedAccount, WalletVersions } from "../../engine/types";
import { Typography } from "../styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import IcCheck from "@assets/ic-check.svg";

type Item = {
    type: 'ledger';
    address: string;
} | {
    type: 'wallet';
    account: SelectedAccount
}

const LedgerItem = memo(({ address, onSelect }: { address: string, onSelect: () => void }) => {
    const theme = useTheme();

    return (
        <Pressable
            style={{
                backgroundColor: theme.surfaceOnElevation,
                padding: 20,
                marginBottom: 16,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}
            onPress={onSelect}
        >
            <View style={{
                height: 46, width: 46,
                borderRadius: 23,
                marginRight: 12,
                justifyContent: 'center',
                alignItems: 'center', overflow: 'hidden'
            }}>
                <Image
                    style={{ width: 46, height: 46 }}
                    source={require('@assets/ledger_device.png')}
                />
            </View>
            <View style={{ justifyContent: 'center', flexGrow: 1, flexShrink: 1 }}>
                <Text
                    style={[{
                        color: theme.textPrimary,
                        marginBottom: 2,
                        maxWidth: '90%',
                    }, Typography.semiBold17_24]}
                    numberOfLines={1}
                >
                    {'Ledger'}
                </Text>
                <Text style={[{ color: '#838D99' }, Typography.regular15_20]}>
                    {ellipsiseAddress(address)}
                </Text>
            </View>
            <View style={{
                justifyContent: 'center', alignItems: 'center',
                height: 24, width: 24,
                backgroundColor: theme.divider,
                borderRadius: 12
            }}>
                <IcCheck color={'white'} height={16} width={16} style={{ height: 16, width: 16 }} />
            </View>
        </Pressable>
    );
});

export const WalletSelector = memo(({ onSelect }: { onSelect?: (address: Address) => void }) => {
    const safeArea = useSafeAreaInsets();
    const navigation = useTypedNavigation();
    const prevScreen = useNavigationState((state) => state.routes[state.index - 1]?.name);
    const { isTestnet } = useNetwork();
    const [bounceableFormat] = useBounceableWalletFormat();
    const knownWallets = KnownWallets(isTestnet);

    const isPrevScreenLedger = prevScreen?.startsWith('Ledger') ?? false;

    const appState = useAppState();

    const ledgerContext = useLedgerTransport();

    const connectedLedgerAddress = useMemo(() => {
        if (!ledgerContext?.tonTransport || !ledgerContext.addr?.address) {
            return null;
        }
        try {
            const parsed = Address.parse(ledgerContext.addr.address);

            return parsed.toString({
                bounceable: bounceableFormat,
                testOnly: isTestnet
            });
        } catch {
            return null;
        }
    }, [ledgerContext, bounceableFormat]);

    const onLedgerSelect = useCallback(async () => {
        if (!!onSelect) {
            if (!!ledgerContext.addr?.address) {
                try {
                    onSelect(Address.parse(ledgerContext.addr?.address));
                } catch (error) {
                    Alert.alert(t('transfer.error.invalidAddress'));
                }
            } else {
                Alert.alert(t('transfer.error.invalidAddress'));
            }
            return;
        }
        navigation.navigateLedgerApp();
    }, [onSelect, ledgerContext]);

    const renderItem = useCallback(({ item, index }: { item: Item, index: number }) => {
        if (item.type === 'ledger') {
            return (
                <LedgerItem
                    address={item.address}
                    onSelect={onLedgerSelect}
                />
            );
        }

        const wallet = item.account;

        if (onSelect && index === appState.selected) {
            return null;
        }

        return (
            <WalletItem
                key={`wallet-${index}`}
                index={index}
                address={wallet.address}
                selected={index === appState.selected && !isPrevScreenLedger}
                onSelect={onSelect}
                bounceableFormat={bounceableFormat}
                isW5={wallet.version === WalletVersions.v5R1}
                isTestnet={isTestnet}
                knownWallets={knownWallets}
            />
        )
    }, [isPrevScreenLedger, onLedgerSelect, onSelect, appState.selected, bounceableFormat, isTestnet, knownWallets]);

    const items: Item[] = useMemo(() => {
        const walletItems: Item[] = appState.addresses.map(account => ({
            type: 'wallet' as const,
            account
        }));

        if (!connectedLedgerAddress) {
            return walletItems;
        }

        const ledgerItem: Item = {
            type: 'ledger',
            address: connectedLedgerAddress
        };

        return [ledgerItem, ...walletItems];

    }, [appState, connectedLedgerAddress]);

    return (
        <FlatList
            data={items}
            renderItem={renderItem}
            contentContainerStyle={{
                paddingHorizontal: 16
            }}
            contentInset={{
                bottom: safeArea.bottom + 16,
                top: 16
            }}
            contentOffset={{ y: -16, x: 0 }}
        />
    );
});