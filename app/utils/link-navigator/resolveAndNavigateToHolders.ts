import { QueryClient } from "@tanstack/react-query"
import { SelectedAccount } from "../../engine/types"
import { AppState, getAppState } from "../../storage/appState"
import { TypedNavigation } from "../useTypedNavigation"
import { solanaAddressFromPublicKey } from "../solana/address"
import { Address } from "@ton/core"
import { PublicKey } from '@solana/web3.js';
import { HoldersAppParams, HoldersAppParamsType } from "../../fragments/holders/HoldersAppFragment"
import { holdersUrl } from "../../engine/api/holders/fetchUserState"
import { getNeedsEnrollment } from "./getNeedsEnrollment"

type HolderResloveParams = {
    query: { [key: string]: string | undefined },
    navigation: TypedNavigation,
    selected: SelectedAccount,
    updateAppState: (value: AppState, isTestnet: boolean) => void,
    isTestnet: boolean,
    queryClient: QueryClient
}

type HoldersTransactionResolveParams = HolderResloveParams & { type: 'holders-transactions' }
type HoldersPathResolveParams = HolderResloveParams & { type: 'holders-path', path: string }

export function resolveAndNavigateToHolders(params: HoldersTransactionResolveParams | HoldersPathResolveParams) {
    const { type, query, navigation, selected, updateAppState, queryClient, isTestnet } = params
    const addresses = query['addresses']?.split(',');

    const solanaAddress = solanaAddressFromPublicKey(selected.publicKey);
    const isSelectedAddress = addresses?.find((a) => {
        try {
            return Address.parse(a).equals(selected.address);
        } catch {
            try {
                const solPub = new PublicKey(a);
                return solPub.equals(solanaAddress);
            } catch {
                return false;
            }
        }
    });
    const transactionId = query['transactionId'];

    const holdersNavParams: HoldersAppParams = type === 'holders-transactions'
        ? {
            type: HoldersAppParamsType.Transactions,
            query: { transactionId }
        } : {
            type: HoldersAppParamsType.Path,
            path: params.path,
            query
        }

    const url = holdersUrl(isTestnet);

    if (isSelectedAddress || !addresses || addresses.length === 0) {
        const normalizedAddress = selected.address.toString({ testOnly: isTestnet });
        const needsEnrollment = getNeedsEnrollment(url, normalizedAddress, isTestnet, queryClient);

        if (needsEnrollment) {
            navigation.navigateHoldersLanding({ endpoint: url, onEnrollType: holdersNavParams }, isTestnet);
            return;
        }

        navigation.navigateHolders(holdersNavParams, isTestnet);

    } else { // If transaction is for another address, navigate to the address first
        const appState = getAppState();
        const index = appState.addresses.findIndex((a) => {
            let tonAddressFound = false;
            let solanaAddressFound = false;
            addresses.forEach((addr) => {
                try {
                    tonAddressFound = a.address.equals(Address.parse(addr));
                } catch {
                    try {
                        const solPub = new PublicKey(addr);
                        solanaAddressFound = solPub.equals(solanaAddressFromPublicKey(a.publicKey));
                    } catch { }
                }
            });
            return tonAddressFound || solanaAddressFound;
        });

        // If address is found, select it
        if (index !== -1) {
            // Select new address
            updateAppState({ ...appState, selected: index }, isTestnet);
            const normalizedAddress = appState.addresses[index].address.toString({ testOnly: isTestnet });
            const needsEnrollment = getNeedsEnrollment(url, normalizedAddress, isTestnet, queryClient);

            if (needsEnrollment) {
                navigation.navigateAndReplaceHome({
                    navigateTo: {
                        type: 'holders-landing',
                        endpoint: url,
                        onEnrollType: holdersNavParams
                    }
                });
                return;
            }

            // navigate to home with tx to be opened after
            navigation.navigateAndReplaceHome({
                navigateTo: {
                    type: 'holders-app',
                    params: holdersNavParams
                }
            });
        }
    }
}