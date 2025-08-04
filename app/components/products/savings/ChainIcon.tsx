
import ArbitrumIcon from '@assets/chains/arbitrum.svg';
import AvaxIcon from '@assets/chains/avax.svg';
import EtherIcon from '@assets/chains/ether.svg';
import NearIcon from '@assets/chains/near.svg';
import OptimismIcon from '@assets/chains/optimism.svg';
import PolygonIcon from '@assets/chains/polygon.svg';
import SolanaIcon from '@assets/chains/solana.svg';
import StellarIcon from '@assets/chains/stellar.svg';
import TonIcon from '@assets/chains/ton.svg';
import TronIcon from '@assets/chains/tron.svg';
import { useMemo } from 'react';

export function ChainIcon({ blockchain, size = 46 }: { blockchain: string, size?: number }) {
    const Icon = useMemo(() => {
        if (blockchain === 'ethereum') return EtherIcon;
        if (blockchain === 'polygon') return PolygonIcon;
        if (blockchain === 'solana') return SolanaIcon;
        if (blockchain === 'tron') return TronIcon;
        if (blockchain === 'near') return NearIcon;
        if (blockchain === 'avax') return AvaxIcon;
        if (blockchain === 'arbitrum') return ArbitrumIcon;
        if (blockchain === 'optimism') return OptimismIcon;
        if (blockchain === 'stellar') return StellarIcon;

        return TonIcon;
    }, [blockchain]);

    return (
        <Icon
            key={blockchain}
            width={size}
            height={size}
            style={{ borderRadius: size / 2 }}
        />
    );
}