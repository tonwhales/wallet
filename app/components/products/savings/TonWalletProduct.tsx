import { memo } from "react";
import { ThemeType } from "../../../engine/state/theme";
import { Address } from "@ton/core";
import { useAccountLite, useBounceableWalletFormat } from "../../../engine/hooks";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { t } from "../../../i18n/t";
import { CoinItem } from "./CoinItem";
import { Currency } from "../../../engine/types/deposit";

export const TonProductComponent = memo(({
    theme,
    isLedger,
    address,
    testOnly,
    onSelect
}: {
    theme: ThemeType,
    isLedger?: boolean,
    address: Address,
    testOnly?: boolean,
    onSelect?: () => void
}) => {
    const navigation = useTypedNavigation();
    const accountLite = useAccountLite(address);
    const balance = accountLite?.balance ?? 0n;
    const [bounceableFormat] = useBounceableWalletFormat();
    const addr = address?.toString({ bounceable: bounceableFormat, testOnly });
    const symbol = 'TON';

    const onPress = () => {
        if (onSelect) {
            onSelect();
        } else {
            navigation.navigateTonWallet({ owner: addr }, isLedger);
        }
    };

    return (
        <CoinItem
            theme={theme}
            balance={balance}
            symbol={symbol}
            priceNano={balance}
            currency={Currency.Ton}
            onPress={onPress}
            name={symbol}
            description={t('savings.general', { symbol })}
            withArrow={!!onSelect}
        />
    );
});