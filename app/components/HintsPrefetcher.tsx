import { useQueryClient } from '@tanstack/react-query';
import { usePrefetchHints } from '../engine/hooks';
import { useSelectedAccount } from '../engine/hooks';

export function HintsPrefetcher(props: { address?: string }) {
    const selected = useSelectedAccount();
    const client = useQueryClient();
    const address = props.address || selected?.addressString;

    usePrefetchHints(client, address);

    return null;
}