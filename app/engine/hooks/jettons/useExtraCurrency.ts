import { useExtraCurrencyHints, useNetwork, useSelectedAccount } from "..";

export function useExtraCurrency(id?: number | null, address?: string) {
    const { isTestnet } = useNetwork();
    const selected = useSelectedAccount();
    const currencies = useExtraCurrencyHints(address ?? selected?.address.toString({ testOnly: isTestnet }));

    return currencies.data?.find((c) => c.preview.id === id);
}