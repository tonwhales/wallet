import React, { memo, useCallback, useMemo } from "react";
import { Alert, FlatList } from "react-native";
import { WalletItem } from "./WalletItem";
import { useAppState, useBounceableWalletFormat, useNetwork } from "../../engine/hooks";
import { LedgerWallet, useLedgerTransport } from "../../fragments/ledger/components/TransportContext";
import { Address } from "@ton/core";
import { useNavigationState } from "@react-navigation/native";
import { useKnownWallets } from "../../secure/KnownWallets";
import { SelectedAccount, WalletVersions } from "../../engine/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LedgerWalletItem } from "./LedgerWalletItem";
import { useTypedNavigation } from "../../utils/useTypedNavigation";
import { t } from "../../i18n/t";

type Item = {
    type: 'ledger';
    address: LedgerWallet;
} | {
    type: 'wallet';
    account: SelectedAccount
}

export const WalletSelector = memo(({ onSelect }: { onSelect?: (address: Address) => void }) => {
    const safeArea = useSafeAreaInsets();
    const prevScreen = useNavigationState((state) => state.routes[state.index - 1]?.name);
    const { isTestnet } = useNetwork();
    const [bounceableFormat] = useBounceableWalletFormat();
    const knownWallets = useKnownWallets(isTestnet);

    const isPrevScreenLedger = prevScreen?.startsWith('Ledger') ?? false;

    const appState = useAppState();

    const ledgerContext = useLedgerTransport();

    const connectedLedgerAddress = useMemo(() => {
        if (!ledgerContext.addr) {
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


    const renderItem = useCallback(({ item, index }: { item: Item, index: number }) => {
        if (item.type === 'ledger') {
            let selected = false;
            try {
                const itemAddress = Address.parse(item.address.address).toString({ testOnly: isTestnet, bounceable: bounceableFormat });
                selected = (itemAddress === connectedLedgerAddress) && isPrevScreenLedger;
            } catch {
                selected = false;
            }

            return (
                <LedgerWalletItem
                    key={`ledger-${index}`}
                    ledgerWallet={item.address}
                    selected={selected}
                    onSelect={onSelect}
                    index={index}
                />
            );
        }

        const wallet = item.account;

        if (onSelect && index === appState.selected) {
            return null;
        }

        const i = index - (ledgerContext?.wallets?.length ?? 0);
        const isSelected = i === appState.selected && !isPrevScreenLedger;

        return (
            <WalletItem
                key={`wallet-${index}`}
                index={i}
                address={wallet.address}
                selected={isSelected}
                onSelect={onSelect}
                bounceableFormat={bounceableFormat}
                isW5={wallet.version === WalletVersions.v5R1}
                isTestnet={isTestnet}
                knownWallets={knownWallets}
            />
        )
    }, [isPrevScreenLedger, onSelect, appState.selected, bounceableFormat, isTestnet, knownWallets, ledgerContext.wallets, connectedLedgerAddress]);

    const items: Item[] = useMemo(() => {
        const walletItems: Item[] = appState.addresses.map(account => ({
            type: 'wallet' as const,
            account
        }));

        const ledgerItems: Item[] = ledgerContext.wallets.map((address, index) => ({
            type: 'ledger' as const,
            address,
        }));

        return [...ledgerItems, ...walletItems];

    }, [appState, ledgerContext.wallets]);

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
