import { Address } from "@ton/core";
import { useAddressBook } from "../../hooks/contacts/useAddressBook";
import { useNetwork } from "../../hooks/useNetwork";

export function useAddToDenyList() {
    const [, update] = useAddressBook();
    const { isTestnet } = useNetwork();

    return (address: string | Address, reason: string = 'spam') => {
        let addr = '';

        if (address instanceof Address) {
            addr = address.toString({ testOnly: isTestnet });
        } else {
            addr = address;
        }
        
        return update((doc) => doc.denyList[addr] = { reason });
    };
}