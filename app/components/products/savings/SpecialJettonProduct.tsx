import { memo, useCallback, useMemo } from "react";
import { ThemeType } from "../../../engine/state/theme";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { Address } from "@ton/core";
import { useSpecialJetton } from "../../../engine/hooks/jettons/useSpecialJetton";
import { useBounceableWalletFormat, useJettonContent } from "../../../engine/hooks";
import { useGaslessConfig } from "../../../engine/hooks/jettons/useGaslessConfig";
import { useWalletVersion } from "../../../engine/hooks/useWalletVersion";
import { ReceiveableTonAsset } from "../../../fragments/wallet/ReceiveFragment";
import { t } from "../../../i18n/t";
import { CoinItem } from "./CoinItem";
import { Currency } from "../../../engine/types/deposit";

export const SpecialJettonProduct = memo(({
    theme,
    isLedger,
    address,
    testOnly,
    assetCallback
}: {
    theme: ThemeType,
    isLedger?: boolean,
    address: Address,
    testOnly: boolean,
    assetCallback?: (asset: ReceiveableTonAsset | null) => void
}) => {
    const navigation = useTypedNavigation();
    const specialJetton = useSpecialJetton(address);
    const masterContent = useJettonContent(specialJetton?.master.toString({ testOnly }));
    const balance = specialJetton?.balance ?? 0n;
    const [bounceableFormat] = useBounceableWalletFormat();
    const ledgerAddressStr = address.toString({ bounceable: bounceableFormat, testOnly });
    const gaslessConfig = useGaslessConfig().data;
    const walletVersion = useWalletVersion(address);
    const symbol = specialJetton?.symbol ?? 'USDT';

    const isGassless = useMemo(() => {
        if (walletVersion !== 'v5R1') {
            return false;
        }

        if (!gaslessConfig) {
            return false;
        }

        return gaslessConfig.gas_jettons.find((j: { master_id: string }) => {
            try {
                return specialJetton?.master?.equals(Address.parse(j.master_id));
            } catch (error) {
                return false;
            }
        }) !== undefined;
    }, [gaslessConfig?.gas_jettons, walletVersion, specialJetton?.master]);

    const onPress = useCallback(async () => {

        if (!!assetCallback && specialJetton?.master) {
            assetCallback({
                address: specialJetton?.master,
                content: {
                    icon: masterContent?.originalImage,
                    name: masterContent?.name,
                }
            });
            return;
        }

        const hasWallet = !!specialJetton?.wallet;

        if (hasWallet) {
            navigation.navigateJettonWallet({
                owner: address.toString({ bounceable: bounceableFormat, testOnly }),
                master: specialJetton.master.toString({ testOnly }),
                wallet: specialJetton.wallet?.toString({ testOnly }),
                isLedger
            });

            return;
        }

        navigation.navigateReceive({
            asset: specialJetton ? {
                address: specialJetton.master,
                content: {
                    icon: masterContent?.originalImage,
                    name: masterContent?.name,
                }
            } : undefined,
            addr: address.toString({ bounceable: isLedger ? false : bounceableFormat, testOnly })
        }, isLedger);
    }, [assetCallback, specialJetton, isLedger, ledgerAddressStr, navigation, masterContent]);

    return (
        <CoinItem
            theme={theme}
            balance={balance}
            symbol={symbol}
            currency={Currency.UsdTon}
            decimals={specialJetton?.decimals ?? 6}
            priceNano={specialJetton?.nano ?? 0n}
            isGassless={isGassless}
            assetCallback={assetCallback}
            onPress={onPress}
            name={symbol}
            description={t('savings.general', { symbol })}
            blockchain="ton"
            withArrow={!!assetCallback}
            priceUSD={1}
        />
    );
});