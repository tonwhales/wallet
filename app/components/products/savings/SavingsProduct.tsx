import { memo, useCallback } from "react";
import { View } from "react-native";
import { t } from "../../../i18n/t";
import { useDisplayableJettons, useNetwork, useSolanaTokens, useTheme } from "../../../engine/hooks";
import { Typography } from "../../styles";
import { TonProductComponent } from "../TonProductComponent";
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
    const { totalBalance } = useSavingsBalance(address);
    const navigation = useTypedNavigation();
    const solanaAddress = solanaAddressFromPublicKey(pubKey).toString();
    const tokens = useSolanaTokens(solanaAddress);

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
        switch (item.type) {
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
                        testOnly={isTestnet}
                    />
                );
            case 'solanaToken':
                return (
                    <SolanaTokenProduct
                        token={item}
                        address={solanaAddress}
                        testOnly={isTestnet}
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

    const solanaTokens: ({ type: AssetType.SolanaToken } & SolanaToken)[] = tokens.data?.map((t) => ({ type: AssetType.SolanaToken, ...t })) ?? [];

    const items: SavingsItem[] = [
        { type: AssetType.Ton },
        { type: AssetType.Special },
        { type: AssetType.Solana },
        ...savingsItems,
        ...solanaTokens
    ];

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

    // if (savingsItems.length === 0) {
    //     return (
    //         <View style={{ marginHorizontal: 16, marginVertical: 16 }}>
    //             <Text style={[{ color: theme.textPrimary }, Typography.semiBold20_28]}>
    //                 {t('products.savings')}
    //             </Text>
    //             <View style={{
    //                 backgroundColor: theme.surfaceOnBg,
    //                 borderRadius: 20, marginTop: 14,
    //             }}>
    //                 <TonProductComponent
    //                     theme={theme}
    //                     address={address}
    //                     testOnly={isTestnet}
    //                     isLedger={isLedger}
    //                 />
    //             </View>

    //             <View style={{
    //                 backgroundColor: theme.surfaceOnBg,
    //                 borderRadius: 20, marginTop: 14,
    //             }}>
    //                 <SpecialJettonProduct
    //                     theme={theme}
    //                     address={address}
    //                     testOnly={isTestnet}
    //                     isLedger={isLedger}
    //                 />
    //             </View>
    //         </View>
    //     );
    // }

    return (
        <View style={{ marginVertical: 16 }}>
            <CollapsibleCards
                title={t('products.savings')}
                items={items}
                renderItem={renderItem}
                renderFace={renderFace}
                itemHeight={86}
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