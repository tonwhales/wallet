import { useJettons } from '../engine/hooks/useJettons';
import { usePrefetchHints } from '../engine/hooks/usePrefetchHints';
import { useSelectedAccount } from '../engine/hooks/useSelectedAccount';

export function HintsPrefetcher() {
    let selected = useSelectedAccount();
    
    usePrefetchHints(selected.addressString);

    console.warn(useJettons(selected.addressString));
    
    return <></>;
}