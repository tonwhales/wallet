import { memo } from "react";
import { View, Text } from "react-native";
import { t } from "../../i18n/t";
import { useDisplayableJettons, useNetwork, useTheme } from "../../engine/hooks";
import { Typography } from "../styles";
import { TonProductComponent } from "./TonProductComponent";
import { SpecialJettonProduct } from "./SpecialJettonProduct";
import { Address } from "@ton/ton";
import { JettonProductItem } from "./JettonProductItem";
import { AssetViewType } from "../../fragments/wallet/AssetsFragment";
import { ItemDivider } from "../ItemDivider";
import { useTypedNavigation } from "../../utils/useTypedNavigation";

export const SavingsProduct = memo(({ address }: { address: Address }) => {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const savings = useDisplayableJettons(address.toString({ testOnly: isTestnet })).savings;
    const navigation = useTypedNavigation();

    return (
        <View style={{ marginHorizontal: 16, marginVertical: 16 }}>
            <Text style={[{ color: theme.textPrimary }, Typography.semiBold20_28]}>
                {t('products.savings')}
            </Text>
            <View style={{
                backgroundColor: theme.surfaceOnBg,
                borderRadius: 20, marginTop: 8
            }}>
                <TonProductComponent
                    theme={theme}
                    address={address}
                    testOnly={isTestnet}
                />

                <SpecialJettonProduct
                    theme={theme}
                    address={address}
                    testOnly={isTestnet}
                    divider={'top'}
                />

                {savings.map((s, i) => (
                    <View>
                        <ItemDivider marginHorizontal={16} marginVertical={0} />
                        <JettonProductItem
                            key={'jt' + s.jetton.address}
                            hint={s}
                            last={true}
                            owner={address}
                            jettonViewType={AssetViewType.Default}
                            selectParams={{
                                onSelect: (h) => {
                                    navigation.navigateJettonWallet({
                                        owner: address.toString({ testOnly: isTestnet }),
                                        master: h.jetton.address,
                                        wallet: h.walletAddress.address
                                    });
                                },
                                forceBalance: true
                            }}
                        />
                    </View>
                ))}
            </View>
        </View>
    );
});

SavingsProduct.displayName = 'SavingsProduct';