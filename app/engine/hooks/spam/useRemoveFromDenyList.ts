import { Address } from "@ton/core";
import { useAddressBook } from "../contacts/useAddressBook";
import { useNetwork } from "../network/useNetwork";

export function useRemoveFromDenyList() {
    const [, update] = useAddressBook();
    const { isTestnet } = useNetwork();

    return (address: string | Address) => {
        let addr = '';

        if (address instanceof Address) {
            addr = address.toString({ testOnly: isTestnet });
        } else {
            addr = address;
        }

        return update((doc) => {
            delete doc.denyList[addr];
        });
    };
}