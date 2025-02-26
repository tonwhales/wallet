import { Queries } from '../queries';
import { useSelectedAccount } from './appstate/useSelectedAccount';
import { useRecoilValue } from 'recoil';
import { blockWatcherAtom } from '../state/blockWatcherState';
import { useIsFetching } from '@tanstack/react-query';
import { useHoldersAccountStatus } from '.';
import { HoldersUserState } from '../api/holders/fetchUserState';

function useIsFetchingHints(account: string) {
    const hintsQueryKey = Queries.HintsFull(account);
    return useIsFetching(hintsQueryKey);
}

const lastHoldersFetch = 0;
const lastStale = 10 * 60 * 1000;

function useIsFetchingHoldersAccounts(account: string) {
    const status = useHoldersAccountStatus(account).data;

    const token = (
        !!status &&
        status.state === HoldersUserState.Ok
    ) ? status.token : null;

    const holdersQueryKey = Queries.Holders(account).Cards(!!token ? 'private' : 'public');

    let isFetching = useIsFetching(holdersQueryKey);

    if (isFetching > 0 && (Date.now() - lastHoldersFetch > lastStale)) { 
        isFetching = 0;
    }

    return isFetching;
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

            if (query.queryKey[2] === 'lite' || query.queryKey[2] !== 'wallet-v4') {
                return true;
            }

            return false;
        }
    });

    const isFetchingHoldersAccounts = useIsFetchingHoldersAccounts(acc);
    const isFetchingHints = useIsFetchingHints(acc);

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