import { memo, useCallback } from "react";
import { View } from "react-native";
import { t } from "../../../i18n/t";
import { useDisplayableJettons, useNetwork, useSolanaSavingsBalance, useSolanaTokens, useTheme } from "../../../engine/hooks";
import { Typography } from "../../styles";
import { TonProductComponent } from "./TonWalletProduct";
import { SpecialJettonProduct } from "./SpecialJettonProduct";
import { Address } from "@ton/ton";
import { JettonProductItem } from "../JettonProductItem";
import { AssetViewType } from "../../../fragments/wallet/AssetsFragment";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { JettonFull } from "../../../engine/api/fetchHintsFull";
import { Image } from "expo-image";
import { PerfText } from "../../basic/PerfText";
import { CollapsibleCards } from "../../animated/CollapsibleCards";
import { useSavingsBalance } from "../../../engine/hooks/jettons/useSavingsBalance";
import { PriceComponent } from "../../PriceComponent";
import { SolanaWalletProduct } from "./SolanaWalletProduct";
import { solanaAddressFromPublicKey } from "../../../utils/solana/address";
import { SolanaTokenProduct } from "./SolanaTokenProduct";
import { SolanaToken } from "../../../engine/api/solana/fetchSolanaTokens";
import { ASSET_ITEM_HEIGHT } from "../../../utils/constants";

enum AssetType {
    Jetton = 'jetton',
    Special = 'special',
    Ton = 'ton',
    Solana = 'solana',
    SolanaToken = 'solanaToken'
}

type SavingsItem = { type: AssetType.Jetton, description: string } & JettonFull
    | { type: AssetType.Special }
    | { type: AssetType.Ton }
    | { type: AssetType.Solana }
    | { type: AssetType.SolanaToken } & SolanaToken;

export const SavingsProduct = memo(({ address, isLedger, pubKey }: { address: Address, isLedger?: boolean, pubKey: Buffer }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const savings = useDisplayableJettons(address.toString({ testOnly: isTestnet })).savings || [];
    const { totalBalance: tonTotalBalance } = useSavingsBalance(address);
    const navigation = useTypedNavigation();
    const solanaAddress = solanaAddressFromPublicKey(pubKey).toString();
    const tokens = useSolanaTokens(solanaAddress, isLedger);
    const { solAssets: solanaSavingsBalance } = useSolanaSavingsBalance(solanaAddress);
    
    const totalBalance = tonTotalBalance + solanaSavingsBalance;

    const selectParams = {
        onSelect: (h: any) => {
            navigation.navigateJettonWallet({
                owner: address.toString({ testOnly: isTestnet }),
                master: h.jetton.address,
                wallet: h.walletAddress.address,
                isLedger
            });
        },
        forceBalance: true
    }

    const renderItem = useCallback((item: SavingsItem) => {
        switch (item?.type) {
            case 'jetton':
                return (
                    <JettonProductItem
                        hint={item}
                        last={true}
                        owner={address}
                        jettonViewType={AssetViewType.Default}
                        selectParams={selectParams}
                        description={item.description}
                        ledger={isLedger}
                    />
                );
            case 'special':
                return (
                    <SpecialJettonProduct
                        theme={theme}
                        address={address}
                        testOnly={isTestnet}
                        isLedger={isLedger}
                    />
                );
            case 'ton':
                return (
                    <TonProductComponent
                        theme={theme}
                        address={address}
                        testOnly={isTestnet}
                        isLedger={isLedger}
                    />
                );
            case 'solana':
                return (
                    <SolanaWalletProduct
                        theme={theme}
                        address={solanaAddress}
                    />
                );
            case 'solanaToken':
                return (
                    <SolanaTokenProduct
                        theme={theme}
                        token={item}
                        address={solanaAddress}
                    />
                );
        }
    }, [isTestnet, theme, selectParams, isLedger, address, solanaAddress]);

    const savingsItems: ({ type: AssetType.Jetton, description: string } & JettonFull)[] = savings
        .filter((s) => { // filter out zero balances
            try {
                return BigInt(s.balance) > 0n;
            } catch { }
            return false;
        })
        .map((s) => ({ type: AssetType.Jetton, ...s }));

    const solanaTokens: ({ type: AssetType.SolanaToken } & SolanaToken)[] = tokens?.data?.map((t) => ({ type: AssetType.SolanaToken, ...t })) ?? [];

    const items: SavingsItem[] = [
        { type: AssetType.Ton },
        { type: AssetType.Special },
    ];

    if (!isLedger) {
        items.push({ type: AssetType.Solana });
        items.push(...solanaTokens);
    }

    items.push(...savingsItems);

    const renderFace = useCallback(() => {
        return (
            <View style={[
                {
                    flexGrow: 1, flexDirection: 'row',
                    padding: 20,
                    marginHorizontal: 16,
                    borderRadius: 20,
                    alignItems: 'center',
                    backgroundColor: theme.surfaceOnBg,
                },
                theme.style === 'dark' ? {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                } : {}
            ]}>
                <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0 }}>
                    <Image
                        source={require('@assets/ic-coins.png')}
                        style={{ width: 46, height: 46, borderRadius: 23 }}
                    />
                </View>
                <View style={{ marginLeft: 12, flexShrink: 1 }}>
                    <PerfText
                        style={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                        ellipsizeMode="tail"
                        numberOfLines={1}
                    >
                        {t('products.savings')}
                    </PerfText>
                    <PerfText
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                        style={[{ flexShrink: 1, color: theme.textSecondary }, Typography.regular15_20]}
                    >
                        <PerfText style={{ flexShrink: 1 }}>
                            {t('common.showMore')}
                        </PerfText>
                    </PerfText>
                </View>
                <View style={{ flexGrow: 1, alignItems: 'flex-end' }}>
                    <PriceComponent
                        amount={totalBalance}
                        priceUSD={1}
                        theme={theme}
                        style={{
                            backgroundColor: 'transparent',
                            paddingHorizontal: 0, paddingVertical: 0,
                            alignSelf: 'flex-end',
                            height: undefined
                        }}
                        textStyle={[{ color: theme.textPrimary }, Typography.semiBold17_24]}
                        hideCentsIfNull
                    />
                </View>
            </View>
        );
    }, [theme.surfaceOnBg, theme.textPrimary, theme.textSecondary, theme.style, totalBalance]);

    return (
        <View style={{ marginVertical: 16 }}>
            <CollapsibleCards
                title={t('products.savings')}
                items={items}
                renderItem={renderItem}
                renderFace={renderFace}
                itemHeight={ASSET_ITEM_HEIGHT}
                theme={theme}
                limitConfig={{
                    maxItems: 10,
                    fullList: { type: 'jettons' }
                }}
            />
        </View>
    );
});

SavingsProduct.displayName = 'SavingsProduct';