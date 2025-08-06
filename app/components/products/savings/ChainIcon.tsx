
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
import { Image } from 'expo-image';
import { FC, useMemo } from 'react';
import { SvgProps } from 'react-native-svg';
import { useTheme } from '../../../engine/hooks';

export function ChainIcon({ blockchain, size = 46 }: { blockchain: string, size?: number }) {
    const theme = useTheme();

    const IconSvg: FC<SvgProps> | undefined = useMemo(() => {
        if (blockchain === 'ethereum') return EtherIcon;
        if (blockchain === 'polygon') return PolygonIcon;
        if (blockchain === 'solana') return SolanaIcon;
        if (blockchain === 'tron') return TronIcon;
        if (blockchain === 'near') return NearIcon;
        if (blockchain === 'avax') return AvaxIcon;
        if (blockchain === 'arbitrum') return ArbitrumIcon;
        if (blockchain === 'optimism') return OptimismIcon;
        if (blockchain === 'stellar') return StellarIcon;
        if (blockchain === 'ton') return TonIcon;

        return undefined;
    }, [blockchain]);

    const pngIconSource = useMemo(() => {
        if (blockchain === 'bitcoin') return require('@assets/ic-bitcoin.png');

        return undefined;
    }, [blockchain]);

    if (!IconSvg && !pngIconSource) return null;

    if (pngIconSource) {
        return <Image source={pngIconSource} style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1,
            borderColor: theme.divider
        }} />;
    } else if (IconSvg) {
        return (
            <IconSvg
                key={blockchain}
                width={size}
                height={size}
                style={{
                    borderRadius: size / 2,
                    borderWidth: 1,
                    borderColor: theme.divider
                }}
            />
        );
    }
}