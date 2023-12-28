import { Address } from "@ton/core";
import { useCloudValue } from "../cloud";
import { useNetwork } from "../network";

export function useMarkJettonActive() {
    const [, update] = useCloudValue<{ disabled: { [key: string]: { reason: string } } }>('jettons-disabled', (src) => { src.disabled = {} });
    const { isTestnet } = useNetwork();
    return (master: Address) => {
        return update((src) => delete src.disabled[master.toString({ testOnly: isTestnet })]);
    }
}