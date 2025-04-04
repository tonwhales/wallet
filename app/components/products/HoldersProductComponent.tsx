import React, { memo, useCallback, useEffect, useMemo } from "react"
import { InteractionManager, View } from "react-native";
import { useHoldersAccounts, useHoldersHiddenAccounts, useNetwork, useSelectedAccount, useSolanaSelectedAccount, useTheme } from "../../engine/hooks";
import { useHoldersHiddenPrepaidCards } from "../../engine/hooks/holders/useHoldersHiddenPrepaidCards";
import { HoldersAccounts } from "./HoldersAccounts";
import { HoldersCards } from "./HoldersCards";
import { HoldersAccountStatus } from "../../engine/hooks/holders/useHoldersAccountStatus";
import { useLedgerTransport } from "../../fragments/ledger/components/TransportContext";
import { Address } from "@ton/core";
import { makeScreenSecure } from "../../modules/SecureScreen";
import { useFocusEffect } from "@react-navigation/native";
import { useScreenProtectorState } from "../../engine/hooks/settings/useScreenProtector";

export const HoldersProductComponent = memo(({ holdersAccStatus, isLedger }: { holdersAccStatus?: HoldersAccountStatus, isLedger?: boolean }) => {
    const network = useNetwork();
    const theme = useTheme();
    const ledgerContext = useLedgerTransport();
    const selected = useSelectedAccount();
    const address = isLedger ? Address.parse(ledgerContext.addr!.address) : selected?.address!;
    const solanaAddress = useSolanaSelectedAccount()!;
    const { accounts, prepaidCards } = useHoldersAccounts(address, isLedger ? undefined : solanaAddress).data ?? {};
    const [isScreenProtectorEnabled] = useScreenProtectorState();

    const [hiddenAccounts, markAccount] = useHoldersHiddenAccounts(address);
    const [hiddenPrepaidCards, markPrepaidCard] = useHoldersHiddenPrepaidCards(address);

    const visibleAccountsList = useMemo(() => {
        return (accounts ?? []).filter((item) => {
            return !hiddenAccounts.includes(item.id);
        });
    }, [hiddenAccounts, accounts]);

    const visiblePrepaidList = useMemo(() => {
        return (prepaidCards ?? []).filter((item) => {
            return !hiddenPrepaidCards.includes(item.id);
        });
    }, [hiddenPrepaidCards, prepaidCards]);

    const hasAccounts = visibleAccountsList?.length > 0;
    const hasPrepaid = visiblePrepaidList?.length > 0;

    useFocusEffect(useCallback(() => {
        if ((hasPrepaid || hasAccounts) && isScreenProtectorEnabled) {
            InteractionManager.runAfterInteractions(() => makeScreenSecure())
        }
        return () => {
            makeScreenSecure(false)
        }
    }, [hasPrepaid, hasAccounts, isScreenProtectorEnabled]))

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