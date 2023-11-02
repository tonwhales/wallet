import { usePrefetchHints } from '../engine/hooks/jettons/usePrefetchHints';
import { useSelectedAccount } from '../engine/hooks/appstate/useSelectedAccount';

export function HintsPrefetcher() {
    let selected = useSelectedAccount();
    
    usePrefetchHints(selected?.addressString);
    
    return <></>;
}