import { View, StyleSheet } from "react-native";
import { SolanaTransaction } from "../../../../engine/api/solana/fetchSolanaTransactions";
import { ReceiveableSolanaAsset } from "../../ReceiveFragment";
import { SolanaNativeTransferView } from "./SolanaNativeTransferView";
import { SolanaTokenTransferView } from "./SolanaTokenTransferView";

export const SolanaTransactionView = ({ item, owner, asset }: { item: SolanaTransaction, owner: string, asset?: ReceiveableSolanaAsset }) => {
    const { nativeTransfers, tokenTransfers, signature, accountData } = item;

    if (!asset) {
        return (
            <View style={[styles.transactionItem, { gap: 2 }]}>
                {nativeTransfers?.map((tx, index) => {
                    return <SolanaNativeTransferView
                        key={`${signature}-${index}`}
                        transfer={tx}
                        owner={owner}
                        item={item}
                    />
                })}
            </View>
        );
    }

    return (
        <View style={[styles.transactionItem, { gap: 2 }]}>
            {!!asset && tokenTransfers?.map((tx, index) => {
                return <SolanaTokenTransferView
                    key={`${tx.mint}-${signature}-${index}`}
                    transfer={tx}
                    owner={owner}
                    accountData={accountData}
                    item={item}
                />
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    transactionItem: {
        padding: 16,
        borderRadius: 12,
        marginVertical: 8
    }
});