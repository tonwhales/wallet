import SolanaIcon from '@assets/chains/solana.svg';
import { Image } from "expo-image";
import { Currency } from '../../../engine/types/deposit';

export const CoinIcon = ({ type, url }: { type?: Currency, url?: string | null }) => {
    const ICON_SIZE = 46;
    const ICON_RADIUS = ICON_SIZE / 2;

    const coinIconMap: Record<Currency, { source?: any; SvgComponent?: React.ComponentType<any> }> = {
        [Currency.UsdTon]: { source: require('@assets/known/ic-usdt.png') },
        [Currency.Ton]: { source: require('@assets/ic-ton-acc.png') },
        [Currency.UsdcSol]: { source: require('@assets/ic-usdc.png') },
        [Currency.Sol]: { SvgComponent: SolanaIcon },
    };

    const icon = type ? coinIconMap[type] : url ? { source: url } : undefined;

    if (icon) {
        if (icon.SvgComponent) {
            const Svg = icon.SvgComponent;
            return (
                <Svg
                    width={ICON_SIZE}
                    height={ICON_SIZE}
                    style={{ borderRadius: ICON_RADIUS }}
                />
            );
        }
        if (icon.source) {
            return (
                <Image
                    source={icon.source}
                    style={{ height: ICON_SIZE, width: ICON_SIZE, borderRadius: ICON_RADIUS }}
                />
            );
        }
    }
    return null;
};
