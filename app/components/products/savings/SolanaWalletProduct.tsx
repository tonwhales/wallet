import { memo } from "react";
import { ThemeType } from "../../../engine/state/theme";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { usePrice, useSolanaAccount } from "../../../engine/hooks";
import { t } from "../../../i18n/t";
import { Currency } from "../../../engine/types/deposit";
import { CoinItem } from "./CoinItem";

export const SolanaWalletProduct = memo(({
    theme,
    address,
    onSelect
}: {
    theme: ThemeType,
    address: string,
    onSelect?: () => void
}) => {
    const navigation = useTypedNavigation();
    const account = useSolanaAccount(address);
    const [, , rates] = usePrice();

    const balance = account.data?.balance ?? 0n;
    const symbol = "SOL";
    const decimals = 9;

    const onPress = () => {
        if (onSelect) {
            onSelect();
        } else {
            navigation.navigateSolanaWallet({ owner: address });
        }
    };

    return (
        <CoinItem
            theme={theme}
            balance={balance}
            symbol={symbol}
            currency={Currency.Sol}
            decimals={decimals}
            priceNano={balance}
            onPress={onPress}
            name="Solana"
            description={t('savings.general', { symbol })}
            withArrow={!!onSelect}
            priceUSD={rates?.price?.usd}
        />
    );
});

SolanaWalletProduct.displayName = 'SolanaWalletProduct';
