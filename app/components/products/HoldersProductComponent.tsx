import React, { memo, useMemo } from "react"
import { View } from "react-native";
import { useHoldersAccounts, useHoldersHiddenAccounts, useNetwork, useSelectedAccount, useTheme } from "../../engine/hooks";
import { useHoldersHiddenPrepaidCards } from "../../engine/hooks/holders/useHoldersHiddenPrepaidCards";
import { HoldersAccounts } from "./HoldersAccounts";
import { HoldersCards } from "./HoldersCards";
import { HoldersAccountStatus } from "../../engine/hooks/holders/useHoldersAccountStatus";
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";
import { Address } from "@ton/core";

export const HoldersProductComponent = memo(({ holdersAccStatus, isLedger }: { holdersAccStatus?: HoldersAccountStatus, isLedger?: boolean }) => {
    const network = useNetwork();
    const theme = useTheme();
    const ledgerContext = useLedgerTransport();
    const selected = useSelectedAccount();
    const address = isLedger ? Address.parse(ledgerContext.addr!.address) : selected?.address!;
    const accounts = useHoldersAccounts(address).data?.accounts;
    const prePaid = useHoldersAccounts(address).data?.prepaidCards;

    const [hiddenAccounts, markAccount] = useHoldersHiddenAccounts(address);
    const [hiddenPrepaidCards, markPrepaidCard] = useHoldersHiddenPrepaidCards(address);

    const visibleAccountsList = useMemo(() => {
        return (accounts ?? []).filter((item) => {
            return !hiddenAccounts.includes(item.id);
        });
    }, [hiddenAccounts, accounts]);

    const visiblePrepaidList = useMemo(() => {
        return (prePaid ?? []).filter((item) => {
            return !hiddenPrepaidCards.includes(item.id);
        });
    }, [hiddenPrepaidCards, prePaid]);

    const hasAccounts = visibleAccountsList?.length > 0;
    const hasPrepaid = visiblePrepaidList?.length > 0;

    if (!hasAccounts && !hasPrepaid) {
        return null;
    }

    return (
        <View style={{ marginTop: (hasAccounts || hasPrepaid) ? 16 : 0 }}>
            <HoldersAccounts
                owner={address}
                theme={theme}
                isTestnet={network.isTestnet}
                markAccount={markAccount}
                accs={visibleAccountsList}
                holdersAccStatus={holdersAccStatus}
                isLedger={isLedger}
            />
            <View style={{ marginTop: (hasAccounts && hasPrepaid) ? 16 : 0 }}>
                <HoldersCards
                    owner={address}
                    theme={theme}
                    isTestnet={network.isTestnet}
                    markPrepaidCard={markPrepaidCard}
                    cards={visiblePrepaidList}
                    holdersAccStatus={holdersAccStatus}
                    isLedger={isLedger}
                />
            </View>
        </View>
    );
});

HoldersProductComponent.displayName = 'HoldersProductComponent';