import { useHintsFull, useSelectedAccount } from '../engine/hooks';

export function HintsPrefetcher(props: { address?: string }) {
    const selected = useSelectedAccount();
    const address = props.address || selected?.addressString;

    useHintsFull(address);

    return null;
}