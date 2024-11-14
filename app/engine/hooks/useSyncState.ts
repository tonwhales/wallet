import { Queries } from '../queries';
import { useSelectedAccount } from './appstate/useSelectedAccount';
import { useRecoilValue } from 'recoil';
import { blockWatcherAtom } from '../state/blockWatcherState';
import { useIsFetching } from '@tanstack/react-query';
import { useHoldersAccountStatus, useJettonWalletAddress, useKnownJettons, useNetwork } from '.';
import { HoldersUserState } from '../api/holders/fetchUserState';

function useIsFetchingTxs(account: string) {
    return useIsFetching(Queries.Transactions(account));
}

function useIsFetchingHints(account: string) {
    const hintsQueryKey = Queries.HintsFull(account);
    return useIsFetching(hintsQueryKey);
}

function useIsFetchingSpecialJettonAddress(account: string) {
    const { isTestnet } = useNetwork();
    const knownJettons = useKnownJettons(isTestnet);
    const specialJettonMaster = knownJettons?.specialJetton || 'default-null';

    const walletAddressQueryKey = Queries.Jettons().Address(account).Wallet(specialJettonMaster);

    return useIsFetching(walletAddressQueryKey);
}

function useIsFetchingMasterContent() {
    const { isTestnet } = useNetwork();
    const knownJettons = useKnownJettons(isTestnet);
    const specialJettonMaster = knownJettons?.specialJetton || 'default-null';

    const masterContentQueryKey = Queries.Jettons().MasterContent(specialJettonMaster);

    return useIsFetching(masterContentQueryKey);
}

function useIsFetchingWalletContent(account: string) {
    const { isTestnet } = useNetwork();
    const knownJettons = useKnownJettons(isTestnet);
    const specialJettonMaster = knownJettons?.specialJetton || 'default-null';
    const walletAddress = useJettonWalletAddress(specialJettonMaster, account).data;
    const walletAddressStr = walletAddress || 'default-null';

    const walletContentQueryKey = Queries.Account(walletAddressStr).JettonWallet();

    return useIsFetching(walletContentQueryKey);
}

function useIsFetchingSpecialJetton(account: string) {
    const isFetchingMasterContent = useIsFetchingMasterContent();
    const isFetchingWalletContent = useIsFetchingWalletContent(account);
    const isFetchingWalletAddress = useIsFetchingSpecialJettonAddress(account);

    return isFetchingMasterContent + isFetchingWalletContent + isFetchingWalletAddress;
}

function useIsFetchingHoldersAccounts(account: string) {
    const status = useHoldersAccountStatus(account).data;

    const token = (
        !!status &&
        status.state !== HoldersUserState.NoRef &&
        status.state !== HoldersUserState.NeedEnrollment
    ) ? status.token : null;

    const holdersQueryKey = Queries.Holders(account).Cards(!!token ? 'private' : 'public');

    return useIsFetching(holdersQueryKey);
}

export function useSyncState(address?: string): 'online' | 'connecting' | 'updating' {
    const account = useSelectedAccount();
    const socketState = useRecoilValue(blockWatcherAtom);

    const acc = address || account?.addressString || 'default-null';

    const isFetchingAccount = useIsFetching({
        predicate: (query) => {
            if (query.queryKey[0] !== 'account') {
                return false;
            }

            if (query.queryKey[1] !== acc) {
                return false;
            }

            if (query.queryKey[2] === 'lite' ||  query.queryKey[2] !== 'wallet-v4') {
                return true;
            }

            return false;
        }
    });

    const isFetchingHoldersAccounts = useIsFetchingHoldersAccounts(acc);
    const isFetchingHints = useIsFetchingHints(acc)

    if (isFetchingHints > 0) {
        return 'updating';
    }

    if (isFetchingHoldersAccounts > 0) {
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