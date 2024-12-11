import React, { memo, useMemo } from "react";
import {View} from "react-native";
import { WalletItem } from "./WalletItem";
import { useAppState, useBounceableWalletFormat, useNetwork } from "../../engine/hooks";
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";
import { Address } from "@ton/core";
import { useNavigationState } from "@react-navigation/native";
import { KnownWallets } from "../../secure/KnownWallets";
import { WalletVersions } from "../../engine/types";

import {LedgerWalletItem} from "./LedgerWalletItem";

export const WalletSelector = memo(({ onSelect }: { onSelect?: (address: Address) => void }) => {
    const prevScreen = useNavigationState((state) => state.routes[state.index - 1]?.name);
    const { isTestnet } = useNetwork();
    const [bounceableFormat] = useBounceableWalletFormat();
    const knownWallets = KnownWallets(isTestnet);

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

    return (
        <View style={{ flexGrow: 1 }}>
            {ledgerContext.ledgerWallets.map((address, index) => {
                const selected = address.address === connectedLedgerAddress && isPrevScreenLedger;
                
                return (
                    <LedgerWalletItem
                        key={`ledger-${index}`}
                        ledgerWallet={address}
                        selected={selected}
                        onSelect={onSelect}
                        index={index}
                    />
                );
            })}

            {appState.addresses.map((wallet, index) => {
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
            })}
        </View>
    );
});
