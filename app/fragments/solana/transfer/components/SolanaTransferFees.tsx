import { View, Text } from "react-native";
import { ItemGroup } from "../../../../components/ItemGroup";
import { useSolanaTransactionFees, useTheme } from "../../../../engine/hooks";
import { Transaction } from "@solana/web3.js";
import { Typography } from "../../../../components/styles";
import { t } from "../../../../i18n/t";
import { fromNano } from "@ton/core";

export const SolanaTransferFees = ({ tx }: { tx: Transaction }) => {
    const fees = useSolanaTransactionFees(tx);
    const theme = useTheme();

    if (!fees) {
        return null;
    }

    return (
        <ItemGroup>
            <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
                <Text style={[{ color: theme.textSecondary }, Typography.regular13_18]}>
                    {t('txPreview.blockchainFee')}
                </Text>
                <View style={{ alignItems: 'center', flexDirection: 'row', }}>
                    <Text style={[{ color: theme.textPrimary }, Typography.regular17_24]}>
                        {fromNano(BigInt(fees)) + ' SOL'}
                    </Text>
                </View>
            </View>
        </ItemGroup>
    )
}