import { Address } from "@ton/core";
import { useCloudValue } from "../cloud";
import { useNetwork } from "../network";

export function useMarkJettonDisabled() {
    const [, update] = useCloudValue<{ disabled: { [key: string]: { reason: string } } }>('jettons-disabled', (src) => { src.disabled = {} });
    const { isTestnet } = useNetwork();
    return (address: Address | string) => {
        const addressStr = typeof address === 'string' ? address : address.toString({ testOnly: isTestnet });
        return update((src) => src.disabled[addressStr] = { reason: 'disabled' });
    }
}