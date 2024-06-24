import { useQueryClient } from '@tanstack/react-query';
import { usePrefetchHints } from '../engine/hooks';
import { useSelectedAccount } from '../engine/hooks';

export function HintsPrefetcher() {
    let selected = useSelectedAccount();
    let client = useQueryClient();
    
    usePrefetchHints(client, selected?.addressString);
    
    return null;
}