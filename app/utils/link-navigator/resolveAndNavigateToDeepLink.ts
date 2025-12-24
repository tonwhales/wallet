import { Address } from "@ton/core";
import { PublicKey } from '@solana/web3.js';
import { SelectedAccount } from "../../engine/types";
import { AppState, getAppState } from "../../storage/appState";
import { TypedNavigation } from "../useTypedNavigation";
import { solanaAddressFromPublicKey } from "../solana/address";
import { t } from "../../i18n/t";

export type DeepLinkType = 'new-wallet' | 'deposit' | 'security' | 'earnings' | 'swap' | 'send';

type DeepLinkResolveParams = {
    type: DeepLinkType,
    query: { [key: string]: string | undefined },
    navigation: TypedNavigation,
    selected: SelectedAccount,
    updateAppState: (value: AppState, isTestnet: boolean) => void,
    isTestnet: boolean
}

function navigateToScreen(navigation: TypedNavigation, type: DeepLinkType) {
    switch (type) {
        case 'new-wallet':
            navigation.navigate('WalletCreate', { additionalWallet: true });
            break;
        case 'deposit':
            navigation.navigateReceiveAssets({ title: t('wallet.actions.deposit') });
            break;
        case 'security':
            navigation.navigate('Security');
            break;
        case 'earnings':
            navigation.navigateStakingPools();
            break;
        case 'swap':
            navigation.navigateSwap();
            break;
        case 'send':
            navigation.navigateSimpleTransfer({
                target: null,
                comment: null,
                amount: null,
                stateInit: null,
                asset: null,
                callback: null,
            });
            break;
    }
}

export function resolveAndNavigateToDeepLink(params: DeepLinkResolveParams) {
    const { type, query, navigation, selected, updateAppState, isTestnet } = params;
    const addresses = query['addresses']?.split(',');

    // For new-wallet, we don't need to check addresses - just navigate directly
    if (type === 'new-wallet') {
        navigateToScreen(navigation, type);
        return;
    }

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

    if (isSelectedAddress || !addresses || addresses.length === 0) {
        // Current wallet is the target wallet, navigate directly
        navigateToScreen(navigation, type);
    } else {
        // Need to switch wallet first
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

        // If address is found, select it and navigate
        if (index !== -1) {
            // Select new address
            updateAppState({ ...appState, selected: index }, isTestnet);
            // Navigate to home with target screen to be opened after
            navigation.navigateAndReplaceHome({
                navigateTo: {
                    type: 'deep-link',
                    deepLinkType: type
                }
            });
        }
    }
}

