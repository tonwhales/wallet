import { ExtraCurrencyHint } from "../../api/fetchExtraCurrencyHints";
import { useExtraCurrencyHints, useNetwork, useSelectedAccount } from "..";
import { ExtraCurrency } from "@ton/core";

export function useExtraCurrencyMap(extraCurrency?: ExtraCurrency | null, address?: string) {
    const { isTestnet } = useNetwork();
    const selected = useSelectedAccount();
    const currencies = useExtraCurrencyHints(address ?? selected?.address.toString({ testOnly: isTestnet }));

    return currencies.data?.reduce((acc, curr) => {
        const keys = Object.keys(extraCurrency ?? {});
        if (keys.includes(curr.preview.id.toString())) {
            acc[curr.preview.id] = {
                ...curr,
                amount: extraCurrency?.[curr.preview.id] ?? 0n,
                balance: BigInt(curr.amount)
            };
        }
        return acc;
    }, {} as Record<number, Omit<ExtraCurrencyHint, 'amount'> & { amount: bigint, balance: bigint }>);
}