import { AppState, getAppState } from "../../storage/appState"
import { TypedNavigation } from "../useTypedNavigation"
import { fetchChangellyTransactionDetails } from "../../engine/api/changelly/fetchChangellyTransactionDetails"
import { solanaAddressFromPublicKey } from "../solana/address"
import { Address } from "@ton/core"
import { isTonAddress } from "../ton/address"
import { LedgerTransport } from "../../fragments/ledger/components/TransportContext"

type ChangellyOrderResolveParams = {
    selectedTonAddress: Address,
    selectedSolanaAddress?: string,
    navigation: TypedNavigation,
    updateAppState: (value: AppState, isTestnet: boolean) => void,
    isTestnet: boolean,
    transactionId: string,
    address: string,
    ledgerContext: LedgerTransport
}

export async function resolveAndNavigateToChangellyOrder(params: ChangellyOrderResolveParams) {
    const {
        selectedTonAddress,
        selectedSolanaAddress,
        transactionId,
        address,
        navigation,
        updateAppState,
        isTestnet,
        ledgerContext
    } = params;

    const navigateToChangellyOrder = async () => {
        try {
            const changellyTransaction = await fetchChangellyTransactionDetails({
                transactionId
            });

            navigation.navigateChangellyOrder({
                changellyTransaction
            });
        } catch (error) {
            return;
        }

    };

    const isSelectedAddress = (() => {
        if (isTonAddress(address)) {
            return Address.parse(address).equals(selectedTonAddress);
        } else {
            return address === selectedSolanaAddress;
        }
    })();

    if (isSelectedAddress) {
        try {
            await navigateToChangellyOrder();
        } catch (error) {
            return;
        }
    } else {
        const appState = getAppState();
        const standardWalletIndex = appState.addresses.findIndex((a) => {
            try {
                if (isTonAddress(address)) {
                    return a.address.equals(Address.parse(address));
                } else {
                    return address === solanaAddressFromPublicKey(a.publicKey).toString();
                }
            } catch {
                return false;
            }
        });

        const ledgerWalletIndex = ledgerContext.wallets.findIndex((a) => {
            try {
                return Address.parse(a.address).equals(Address.parse(address));
            } catch {
                return false;
            }
        });

        if (standardWalletIndex !== -1) {
            updateAppState({ ...appState, selected: standardWalletIndex }, isTestnet);

            await navigateToChangellyOrder();
        } else if (ledgerWalletIndex !== -1) {
            ledgerContext.setAddr(ledgerContext.wallets[ledgerWalletIndex]);
            navigation.navigateLedgerApp()

            await navigateToChangellyOrder();
        } else {
            await navigateToChangellyOrder();
        }
    }
}