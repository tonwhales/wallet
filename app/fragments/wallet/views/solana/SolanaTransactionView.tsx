import { View, StyleSheet } from "react-native";
import { SolanaNativeTransfer, SolanaTokenTransfer, SolanaTransaction } from "../../../../engine/api/solana/fetchSolanaTransactions";
import { ReceiveableSolanaAsset } from "../../ReceiveFragment";
import { SolanaNativeTransferView } from "./SolanaNativeTransferView";
import { SolanaTokenTransferView } from "./SolanaTokenTransferView";

const SolanaNativeTransfers = ({ nativeTransfers, owner, item }: { nativeTransfers: SolanaNativeTransfer[], owner: string, item: SolanaTransaction }) => {
    const filteredNativeTransfers = nativeTransfers.filter((tx) => {
        return tx.fromUserAccount === owner || tx.toUserAccount === owner;
    });

    return (
        <View style={[styles.transactionItem, { gap: 32 }]}>
            {filteredNativeTransfers?.map((tx, index) => {
                return <SolanaNativeTransferView
                    key={`${item.signature}-${index}`}
                    transfer={tx}
                    owner={owner}
                    item={item}
                />
            })}
        </View>
    );
};

const SolanaTokenTransfers = ({ tokenTransfers, owner, item, asset }: { tokenTransfers: SolanaTokenTransfer[], owner: string, item: SolanaTransaction, asset?: ReceiveableSolanaAsset }) => {
    return (
        <View style={[styles.transactionItem, { gap: 32 }]}>
            {!!asset && tokenTransfers?.map((tx, index) => {
                return <SolanaTokenTransferView
                    key={`${tx.mint}-${item.signature}-${index}`}
                    transfer={tx}
                    owner={owner}
                    accountData={item.accountData}
                    item={item}
                />
            })}
        </View>
    )
};

export const SolanaTransactionView = ({ item, owner, asset }: { item: SolanaTransaction, owner: string, asset?: ReceiveableSolanaAsset }) => {
    const { nativeTransfers, tokenTransfers } = item;

    if (!asset) {
        return (
            <SolanaNativeTransfers
                nativeTransfers={nativeTransfers}
                owner={owner}
                item={item}
            />
        );
    }

    return (
        <SolanaTokenTransfers
            tokenTransfers={tokenTransfers}
            owner={owner}
            item={item}
            asset={asset}
        />
    );
};

const styles = StyleSheet.create({
    transactionItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        marginVertical: 8
    }
});