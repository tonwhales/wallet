import { usePrefetchHints } from '../engine/hooks';
import { useSelectedAccount } from '../engine/hooks';

export function HintsPrefetcher() {
    let selected = useSelectedAccount();
    
    usePrefetchHints(selected?.addressString);
    
    return <></>;
}