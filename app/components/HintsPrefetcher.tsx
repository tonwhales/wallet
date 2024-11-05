import { useSelectedAccount } from '../engine/hooks';
import { useHintsFull } from '../engine/hooks/jettons/useHintsFull';

export function HintsPrefetcher(props: { address?: string }) {
    const selected = useSelectedAccount();
    const address = props.address || selected?.addressString;

    useHintsFull(address);

    return null;
}