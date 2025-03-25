import { View, Text } from "react-native";
import { ItemGroup } from "../../../../components/ItemGroup";
import { usePrice, useSolanaTransactionFees, useTheme } from "../../../../engine/hooks";
import { Transaction } from "@solana/web3.js";
import { Typography } from "../../../../components/styles";
import { t } from "../../../../i18n/t";
import { fromNano } from "@ton/core";
import { PriceComponent } from "../../../../components/PriceComponent";

export const SolanaTransferFees = ({ tx }: { tx: Transaction }) => {
    const fees = useSolanaTransactionFees(tx);
    const theme = useTheme();
    const [, , solPrice] = usePrice();

    if (!fees) {
        return null;
    }

    return (
        <ItemGroup>
            <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                    {t('txPreview.blockchainFee')}
                </Text>
                <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                        {fromNano(BigInt(fees)) + ' SOL'}
                    </Text>
                    <PriceComponent
                        amount={BigInt(fees)}
                        style={{
                            backgroundColor: theme.transparent,
                            paddingHorizontal: 0,
                            paddingLeft: 0
                        }}
                        textStyle={[{ color: theme.textPrimary, fontSize: 17, fontWeight: '400' }]}
                        priceUSD={solPrice.price.usd}
                        theme={theme}
                    />
                </View>
            </View>
        </ItemGroup>
    )
}