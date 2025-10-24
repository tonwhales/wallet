import { memo } from "react";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { t } from "../../../i18n/t";
import { toNano } from "@ton/core";
import { SolanaToken } from "../../../engine/api/solana/fetchSolanaTokens";
import { CoinItem } from "./CoinItem";
import { ThemeType } from "../../../engine/state/theme";
import { AssetViewType } from "../../../fragments/wallet/AssetsFragment";

export const SolanaTokenProduct = memo(({
    theme,
    token,
    address,
    onSelect,
    viewType,
    isSelected
}: {
    theme: ThemeType,
    token: SolanaToken,
    address: string,
    onSelect?: () => void,
    viewType?: AssetViewType,
    isSelected?: boolean
}) => {
    const navigation = useTypedNavigation();

    const decimals = token.decimals ?? 6;
    const balance = token.amount ?? 0n;
    const price = toNano(token.uiAmount ?? 0);
    const symbol = token.symbol ?? "?";
    const name = token.name ?? "?";

    const onPress = () => {
        if (onSelect) {
            onSelect();
        } else {
            navigation.navigateSolanaTokenWallet({ owner: address, mint: token.address });
        }
    };

    return (
        <CoinItem
            theme={theme}
            balance={balance}
            symbol={symbol}
            decimals={decimals}
            priceNano={price}
            priceUSD={1}
            onPress={onPress}
            name={name}
            description={t('savings.general', { symbol })}
            withArrow={!!onSelect}
            blockchain="solana"
            imageUrl={token.logoURI}
            viewType={viewType}
            isSelected={isSelected}
        />
    );
});

SolanaTokenProduct.displayName = 'SolanaUSDCProduct';
