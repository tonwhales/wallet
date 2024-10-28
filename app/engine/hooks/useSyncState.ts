import { Queries } from '../queries';
import { useSelectedAccount } from './appstate/useSelectedAccount';
import { useRecoilValue } from 'recoil';
import { blockWatcherAtom } from '../state/blockWatcherState';
import { useIsFetching } from '@tanstack/react-query';
import { useJettonWalletAddress, useKnownJettons, useNetwork } from '.';

function useIsFetchingTxs(account: string) {
    return useIsFetching({ queryKey: Queries.Transactions(account) });
}

function useIsFetchingHints(account: string) {
    const hintsQueryKey = Queries.Hints(account);
    const mintlessHintsQueryKey = Queries.Mintless(account);

    return useIsFetching({
        predicate: (query) => {
            return query.queryKey === hintsQueryKey || query.queryKey === mintlessHintsQueryKey;
        }
    });
}

function useIsFetchingSpecialJettonAddress(account: string) {
    const { isTestnet } = useNetwork();
    const knownJettons = useKnownJettons(isTestnet);
    const specialJettonMaster = knownJettons?.specialJetton || 'default-null';

    const walletAddressQueryKey = Queries.Jettons().Address(account).Wallet(specialJettonMaster);

    return useIsFetching({ queryKey: walletAddressQueryKey });
}

function useIsFetchingMasterContent() {
    const { isTestnet } = useNetwork();
    const knownJettons = useKnownJettons(isTestnet);
    const specialJettonMaster = knownJettons?.specialJetton || 'default-null';

    const masterContentQueryKey = Queries.Jettons().MasterContent(specialJettonMaster);

    return useIsFetching({ queryKey: masterContentQueryKey });
}

function useIsFetchingWalletContent(account: string) {
    const { isTestnet } = useNetwork();
    const knownJettons = useKnownJettons(isTestnet);
    const specialJettonMaster = knownJettons?.specialJetton || 'default-null';
    const walletAddress = useJettonWalletAddress(specialJettonMaster, account).data;
    const walletAddressStr = walletAddress || 'default-null';

    const walletContentQueryKey = Queries.Account(walletAddressStr).JettonWallet();

    return useIsFetching({ queryKey: walletContentQueryKey });
}

function useIsFetchingSpecialJetton(account: string) {
    const isFetchingMasterContent = useIsFetchingMasterContent();
    const isFetchingWalletContent = useIsFetchingWalletContent(account);
    const isFetchingWalletAddress = useIsFetchingSpecialJettonAddress(account);

    return isFetchingMasterContent + isFetchingWalletContent + isFetchingWalletAddress;
}



export function useSyncState(address?: string): 'online' | 'connecting' | 'updating' {
    const account = useSelectedAccount();
    const socketState = useRecoilValue(blockWatcherAtom);

    const acc = address || account?.addressString || 'default-null';

    const isFetchingAccount = useIsFetching({ queryKey: Queries.Account(acc).All() });
    const isFetchingSpecialJetton = useIsFetchingSpecialJetton(acc);
    const isFetchingTransactions = useIsFetchingTxs(acc);
    const isFetchingHints = useIsFetchingHints(acc);

    if (isFetchingHints > 0) {
        return 'updating';
    }

    if (isFetchingSpecialJetton > 0) {
        return 'updating';
    }

    if (isFetchingTransactions > 0) {
        return 'updating';
    }

    if (isFetchingAccount > 0) {
        return 'updating';
    }

    if (socketState === 'connecting') {
        return 'connecting';
    }

    return 'online';
}