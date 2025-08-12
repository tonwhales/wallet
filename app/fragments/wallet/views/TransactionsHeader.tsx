import { Address } from "@ton/core";
import { memo } from "react";
import { PendingTransactions } from "./PendingTransactions";
import { useNetwork } from "../../../engine/hooks";

type TransactionsHeaderProps = {
    address: string | Address,
}

export const TransactionsHeader = memo(({ address }: TransactionsHeaderProps) => {
    const { isTestnet } = useNetwork();
    const addressString = typeof address === 'string' ? address : address.toString({ testOnly: isTestnet });

    return (
        <PendingTransactions
            viewType={'history'}
            address={addressString}
        />
    );
});