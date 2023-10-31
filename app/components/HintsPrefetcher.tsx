import { usePrefetchHints } from '../engine/hooks/usePrefetchHints';
import { useSelectedAccount } from '../engine/hooks/useSelectedAccount';

export function HintsPrefetcher() {
    let selected = useSelectedAccount();
    
    usePrefetchHints(selected?.addressString);
    
    return <></>;
}