import { acc } from 'react-native-reanimated';
import { queryClient } from '../clients';
import { Queries } from '../queries';
import { useSelectedAccount } from './useSelectedAccount';
import { useRecoilValue } from 'recoil';
import { blockWatcherAtom } from '../state/blockWatcherState';
import { useIsFetching } from '@tanstack/react-query';

export function useSyncState(): 'online' | 'connecting' | 'updating' {
    let account = useSelectedAccount();
    let socketState = useRecoilValue(blockWatcherAtom);
    let isFetching = useIsFetching(Queries.Account(account.addressString).All());

    if (socketState === 'connecting') {
        return 'connecting';
    }

    return isFetching > 0 ? 'updating' : 'online';
}